import { getAuthUserId } from "@convex-dev/auth/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";

// Unambiguous alphabet (no 0/O, 1/l/I) for short codes.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 6;
const MAX_URL_LENGTH = 2048;

const URL_PATTERN = /^https?:\/\/[^\s]+\.[^\s]+$/i;

function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

function isValidHttpUrl(url: string): boolean {
  if (url.length > MAX_URL_LENGTH) return false;
  return URL_PATTERN.test(url);
}

// Normalize: trim and add https:// when the user omits the scheme.
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Create a short link. Optional custom alias: "my-link" -> /s/my-link
export const createLink = mutation({
  args: {
    url: v.string(),
    alias: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const originalUrl = normalizeUrl(args.url);

    if (!isValidHttpUrl(originalUrl)) {
      throw new Error("Please enter a valid URL (e.g. https://example.com)");
    }

    const userId = await getAuthUserId(ctx);

    // Resolve custom alias or generate a unique short code.
    let shortCode: string;
    if (args.alias !== undefined) {
      const alias = args.alias.trim().toLowerCase();
      if (alias.length < 3 || alias.length > 32) {
        throw new Error("Alias must be 3–32 characters");
      }
      if (!/^[a-z0-9-]+$/.test(alias)) {
        throw new Error("Alias can only contain letters, numbers and dashes");
      }
      const existing = await ctx.db
        .query("links")
        .withIndex("by_short_code", (q) => q.eq("shortCode", alias))
        .unique();
      if (existing) {
        throw new Error(`Alias "${alias}" is already taken`);
      }
      shortCode = alias;
    } else {
      // Generate until unique (collision odds are negligible at 6 chars).
      shortCode = "";
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateShortCode();
        const existing = await ctx.db
          .query("links")
          .withIndex("by_short_code", (q) => q.eq("shortCode", candidate))
          .unique();
        if (!existing) {
          shortCode = candidate;
          break;
        }
      }
      if (!shortCode) {
        throw new Error("Could not generate a unique short code, try again");
      }
    }

    const now = Date.now();
    const linkId = await ctx.db.insert("links", {
      shortCode,
      originalUrl,
      userId: userId ?? undefined,
      clicks: 0,
      createdAt: now,
    });

    return { id: linkId, shortCode, originalUrl };
  },
});

// Look up a link by short code (used by the redirect route + public stats).
export const getByShortCode = internalQuery({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_short_code", (q) =>
        q.eq("shortCode", args.shortCode.toLowerCase()),
      )
      .unique();
  },
});

// Atomically bump the click counter for a short code.
export const recordClick = internalMutation({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("links")
      .withIndex("by_short_code", (q) =>
        q.eq("shortCode", args.shortCode.toLowerCase()),
      )
      .unique();
    if (link) {
      await ctx.db.patch(link._id, { clicks: link.clicks + 1 });
    }
  },
});

// List the current user's links, newest first.
export const listMyLinks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Global stats for the landing page (total links + total clicks).
export const globalStats = query({
  args: {},
  handler: async (ctx) => {
    const links = await ctx.db.query("links").collect();
    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
    return { totalLinks: links.length, totalClicks };
  },
});

// Delete a link — only its owner can do that.
export const deleteLink = mutation({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const link = await ctx.db.get(args.id);
    if (!link) {
      throw new Error("Link not found");
    }
    if (link.userId !== userId) {
      throw new Error("You can only delete your own links");
    }
    await ctx.db.delete(args.id);
  },
});
