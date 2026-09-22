import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Redirect route: /s/:code -> 302 to the original URL (or a friendly 404).
http.route({
  path: "/s/:code",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const code = decodeURIComponent(parts[1] ?? "").toLowerCase();

    const link = await ctx.runQuery(internal.links.getByShortCode, {
      shortCode: code,
    });

    if (!link) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${url.origin}/not-found-link` },
      });
    }

    await ctx.runMutation(internal.links.recordClick, { shortCode: code });

    return new Response(null, {
      status: 302,
      headers: { Location: link.originalUrl },
    });
  }),
});

// JSON API: POST /api/shorten { url, alias? } -> { shortCode, shortUrl, originalUrl }
http.route({
  path: "/api/shorten",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    let body: { url?: unknown; alias?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body.url !== "string") {
      return Response.json(
        { error: "Field 'url' is required" },
        { status: 400 },
      );
    }

    const result = await ctx.runMutation(api.links.createLink, {
      url: body.url,
      alias: typeof body.alias === "string" ? body.alias : undefined,
    });

    return Response.json({
      shortCode: result.shortCode,
      shortUrl: `${url.origin}/s/${result.shortCode}`,
      originalUrl: result.originalUrl,
    });
  }),
});

export default http;
