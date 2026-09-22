import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  LogOut,
  MousePointerClick,
  Plus,
  Scissors,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const SORTS = [
  { key: "recent", label: "Newest" },
  { key: "clicks", label: "Most clicked" },
  { key: "code", label: "By code" },
] as const;

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("recent");

  const links = useQuery(api.links.catalog, { search, sort });
  const stats = useQuery(api.links.globalStats);

  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedId) return;
    const t = setTimeout(() => setCopiedId(null), 1500);
    return () => clearTimeout(t);
  }, [copiedId]);

  const createLink = useMutation(api.links.createLink);
  const deleteLink = useMutation(api.links.deleteLink);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await createLink({
        url: normalizeUrl(url),
        alias: alias.trim() ? alias.trim() : undefined,
      });
      toast.success(`Created /s/${result.shortCode}`);
      setUrl("");
      setAlias("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: Doc<"links">["_id"]) => {
    try {
      await deleteLink({ id });
      toast.success("Link deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const copyShort = async (link: Doc<"links">) => {
    const shortUrl = `${window.location.origin}/s/${link.shortCode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(link._id);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — please copy manually");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const topLink =
    links && links.length > 0
      ? [...links].sort((a, b) => b.clicks - a.clicks)[0]
      : undefined;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center border-2 border-border bg-accent shadow-brutal-sm">
              <Scissors className="size-5" />
            </div>
            <span className="text-lg font-extrabold uppercase tracking-tight">
              Short Link Black
            </span>
          </a>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden max-w-48 truncate text-sm font-semibold text-muted-foreground sm:block">
                {user.email}
              </span>
            )}
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="press border-2 border-border bg-card font-bold shadow-brutal hover:bg-card"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Link catalog
          </h1>
          <p className="font-medium text-muted-foreground">
            Operator console — browse, search and manage every short link in
            the database.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border-2 border-border bg-secondary p-4 shadow-brutal">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Total links
            </p>
            <p className="mt-1 text-3xl font-extrabold">
              {stats ? stats.totalLinks : "—"}
            </p>
          </div>
          <div className="border-2 border-border bg-accent p-4 shadow-brutal">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-foreground/70">
              Total clicks
            </p>
            <p className="mt-1 text-3xl font-extrabold">
              {stats ? stats.totalClicks : "—"}
            </p>
          </div>
          <div className="border-2 border-border bg-primary p-4 text-primary-foreground shadow-brutal">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">
              Most clicked
            </p>
            <p className="mt-1 truncate text-lg font-extrabold">
              {topLink ? `/s/${topLink.shortCode}` : "—"}
            </p>
          </div>
        </div>

        {/* Create form */}
        <Card className="border-2 border-border shadow-brutal">
          <CardHeader className="border-b-2 border-border bg-secondary">
            <CardTitle className="flex items-center gap-2 text-lg font-extrabold uppercase">
              <Plus className="size-5" />
              New short link
            </CardTitle>
            <CardDescription className="font-medium text-muted-foreground">
              Optionally pick a custom alias (3–32 characters: letters,
              numbers and dashes).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/very/long/path"
                  className="h-12 flex-1 border-2 border-border bg-card font-medium placeholder:text-muted-foreground/60"
                  disabled={creating}
                  required
                />
                <div className="flex items-center border-2 border-border bg-card shadow-brutal-sm">
                  <span className="border-r-2 border-border bg-muted px-3 py-3 text-sm font-bold text-muted-foreground">
                    /s/
                  </span>
                  <Input
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="custom-alias"
                    className="h-12 w-40 border-0 shadow-none focus-visible:ring-0"
                    disabled={creating}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={creating}
                  className="press h-12 border-2 border-border bg-primary font-extrabold uppercase shadow-brutal hover:bg-primary hover:text-primary-foreground"
                >
                  {creating ? "Shortening..." : "Shorten"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Catalog table */}
        <Card className="border-2 border-border shadow-brutal">
          <CardHeader className="border-b-2 border-border bg-secondary">
            <CardTitle className="flex items-center gap-2 text-lg font-extrabold uppercase">
              <BarChart3 className="size-5" />
              Catalog
            </CardTitle>
            <CardDescription className="font-medium text-muted-foreground">
              Search by code or destination URL. Newest first by default.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Search + sort controls */}
            <div className="flex flex-col gap-3 border-b-2 border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search code or URL…"
                  className="h-10 border-2 border-border bg-card pl-9 font-medium"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSort(s.key)}
                    className={`press-sm border-2 border-border px-3 py-1.5 text-xs font-bold uppercase shadow-brutal-sm ${
                      sort === s.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {links === undefined ? (
              <p className="p-6 text-sm font-medium text-muted-foreground">
                Loading catalog…
              </p>
            ) : links.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <span className="flex size-12 items-center justify-center border-2 border-border bg-accent shadow-brutal-sm">
                  <MousePointerClick className="size-6" />
                </span>
                <p className="font-extrabold uppercase">
                  {search ? "No matches" : "Catalog is empty"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `Nothing matches "${search}". Try a different term.`
                    : "Create your first short link above to fill it."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-border hover:bg-transparent">
                    <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-widest">
                      Short link
                    </TableHead>
                    <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-widest">
                      Destination
                    </TableHead>
                    <TableHead className="h-11 px-4 text-right text-xs font-bold uppercase tracking-widest">
                      Clicks
                    </TableHead>
                    <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-widest">
                      Created
                    </TableHead>
                    <TableHead className="h-11 px-4 text-right text-xs font-bold uppercase tracking-widest">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow
                      key={link._id}
                      className="border-b-2 border-border last:border-b-0"
                    >
                      <TableCell className="px-4 py-4 font-bold">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/s/${link.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-2 underline-offset-2 hover:text-primary"
                          >
                            /s/{link.shortCode}
                          </a>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyShort(link)}
                            aria-label="Copy short link"
                            className="press-sm size-7 border-2 border-border bg-card shadow-brutal-sm hover:bg-card"
                          >
                            {copiedId === link._id ? (
                              <Check className="size-3.5" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-72 px-4 py-4">
                        <a
                          href={link.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 truncate text-sm text-muted-foreground underline decoration-1 underline-offset-2 hover:text-foreground"
                        >
                          <span className="truncate">{link.originalUrl}</span>
                          <ExternalLink className="size-3.5 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Badge
                          variant="outline"
                          className="border-2 border-border bg-secondary font-extrabold"
                        >
                          <MousePointerClick className="size-3" />
                          {link.clicks}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-muted-foreground">
                        {formatDate(link.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(link._id)}
                          aria-label="Delete link"
                          className="press-sm size-7 border-2 border-border bg-card text-destructive shadow-brutal-sm hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* API hint */}
        <div className="border-2 border-border bg-card p-4 shadow-brutal">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Developer API
          </p>
          <code className="mt-2 block overflow-x-auto whitespace-nowrap bg-muted p-3 text-xs font-semibold">
            curl -X POST {typeof window !== "undefined" ? window.location.origin : ""}/api/shorten
            -H "Content-Type: application/json" -d
            '{"{"}"url":"https://example.com"{"}"}'
          </code>
        </div>
      </div>
    </main>
  );
}
