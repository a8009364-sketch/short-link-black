import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Check,
  Copy,
  Database,
  KeyRound,
  Link2,
  Scissors,
  Search,
  Terminal,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const stats = useQuery(api.links.globalStats);

  const [url, setUrl] = useState("");
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    setCreating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_CONVEX_URL}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to shorten URL");
      setShortCode(data.shortCode as string);
      setUrl("");
      toast.success("Short link created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to shorten URL");
    } finally {
      setCreating(false);
    }
  };

  const copyShort = async () => {
    if (!shortCode) return;
    const shortUrl = `${window.location.origin}/s/${shortCode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — please copy manually");
    }
  };

  const goTo = (path: string) => navigate(path);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center border-2 border-border bg-accent shadow-brutal-sm">
              <Scissors className="size-5" />
            </div>
            <span className="text-lg font-extrabold uppercase tracking-tight">
              Short Link Black
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && isAuthenticated ? (
              <Button
                onClick={() => goTo("/dashboard")}
                className="press border-2 border-border bg-accent font-bold shadow-brutal hover:bg-accent hover:text-accent-foreground"
              >
                Console
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={() => goTo("/auth?returnTo=/dashboard")}
                className="press border-2 border-border bg-accent font-bold shadow-brutal hover:bg-accent hover:text-accent-foreground"
              >
                Sign in
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero — service panel */}
        <section className="border-b-2 border-border bg-brutal-grid">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid items-start gap-10 lg:grid-cols-2">
              {/* Left: what this is */}
              <div className="flex flex-col gap-5">
                <Badge
                  variant="outline"
                  className="w-fit border-2 border-border bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest"
                >
                  <span className="mr-1 inline-block size-2 bg-foreground" />
                  Private redirect service · Single operator
                </Badge>
                <h1 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl">
                  Short Link
                  <br />
                  <span className="border-b-8 border-accent pb-1">Black</span>
                </h1>
                <p className="max-w-md text-lg text-muted-foreground">
                  A bare-bones URL shortener built for one person: me. It turns
                  long URLs into compact <code>/s/</code> links, redirects them
                  instantly, and keeps every mapping in a searchable catalog.
                </p>

                {/* Service facts */}
                <ul className="mt-2 flex flex-col divide-y-2 divide-border border-2 border-border bg-card shadow-brutal">
                  {[
                    {
                      icon: <Database className="size-4" />,
                      label: "Storage",
                      value: "Managed database, one table",
                    },
                    {
                      icon: <Zap className="size-4" />,
                      label: "Redirects",
                      value: "HTTP 302, click-counted",
                    },
                    {
                      icon: <Terminal className="size-4" />,
                      label: "API",
                      value: "POST /api/shorten",
                    },
                    {
                      icon: <KeyRound className="size-4" />,
                      label: "Access",
                      value: "Operator sign-in via email code",
                    },
                  ].map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center gap-3 px-4 py-3 text-sm"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center border-2 border-border bg-secondary">
                        {row.icon}
                      </span>
                      <span className="w-24 shrink-0 font-bold uppercase tracking-widest text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="font-semibold">{row.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: quick shorten tool */}
              <Card className="border-2 border-border shadow-brutal-lg">
                <div className="flex items-center justify-between border-b-2 border-border bg-primary px-5 py-3 text-primary-foreground">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Quick shorten
                  </span>
                  <span className="text-xs font-semibold opacity-70">
                    no sign-in required
                  </span>
                </div>
                <CardContent className="flex flex-col gap-4 p-5">
                  <form onSubmit={handleShorten} className="flex flex-col gap-4">
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/very/long/path"
                      className="h-12 border-2 border-border bg-card font-medium placeholder:text-muted-foreground/60"
                      disabled={creating}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={creating}
                      className="press h-12 border-2 border-border bg-primary font-extrabold uppercase shadow-brutal hover:bg-primary hover:text-primary-foreground"
                    >
                      {creating ? "Shortening..." : "Shorten"}
                    </Button>
                  </form>

                  {shortCode && (
                    <div className="border-2 border-border bg-accent p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-accent-foreground/70">
                        Short URL
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <a
                          href={`/s/${shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate font-bold underline decoration-2 underline-offset-2"
                        >
                          {window.location.origin}/s/{shortCode}
                        </a>
                        <Button
                          type="button"
                          size="icon"
                          onClick={copyShort}
                          aria-label="Copy short link"
                          className="press-sm shrink-0 border-2 border-border bg-card shadow-brutal-sm hover:bg-card"
                        >
                          {copied ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-border bg-muted p-3">
                    <p className="text-xs font-semibold leading-5 text-muted-foreground">
                      Every link created here lands in the shared catalog.
                      Sign in as the operator to browse, search and manage the
                      full database.
                    </p>
                    <Button
                      type="button"
                      onClick={() => goTo("/dashboard")}
                      className="press-sm mt-3 h-9 w-full border-2 border-border bg-card text-xs font-bold uppercase shadow-brutal-sm hover:bg-card"
                    >
                      <Search className="size-3.5" />
                      Open catalog
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats band */}
        <section className="border-b-2 border-border bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y-2 divide-primary-foreground/20 sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
            <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
              <span className="text-4xl font-extrabold">
                {stats ? stats.totalLinks : "—"}
              </span>
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                Links stored
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
              <span className="text-4xl font-extrabold">
                {stats ? stats.totalClicks : "—"}
              </span>
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                Redirects served
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
              <span className="flex items-center gap-2 text-4xl font-extrabold">
                <Link2 className="size-8" />/s/
              </span>
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                Redirect path
              </span>
            </div>
          </div>
        </section>

        {/* API reference */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            API reference
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The frontend is just one client. The same service is available over
            plain HTTP: two endpoints, JSON in and out.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="border-2 border-border bg-card shadow-brutal">
              <div className="flex items-center gap-2 border-b-2 border-border bg-secondary px-4 py-2">
                <Badge
                  variant="outline"
                  className="border-2 border-border bg-card font-extrabold"
                >
                  POST
                </Badge>
                <code className="text-sm font-bold">/api/shorten</code>
              </div>
              <div className="p-4 text-sm leading-6">
                <p className="text-muted-foreground">
                  Create a short link. Returns the generated code and the full
                  short URL.
                </p>
                <pre className="mt-3 overflow-x-auto border-2 border-border bg-muted p-3 text-xs font-semibold">
                  {`curl -X POST <origin>/api/shorten \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
                </pre>
              </div>
            </div>
            <div className="border-2 border-border bg-card shadow-brutal">
              <div className="flex items-center gap-2 border-b-2 border-border bg-secondary px-4 py-2">
                <Badge
                  variant="outline"
                  className="border-2 border-border bg-card font-extrabold"
                >
                  GET
                </Badge>
                <code className="text-sm font-bold">/s/:code</code>
              </div>
              <div className="p-4 text-sm leading-6">
                <p className="text-muted-foreground">
                  Follow a short link. Responds with a 302 redirect to the
                  original URL and increments the click counter.
                </p>
                <pre className="mt-3 overflow-x-auto border-2 border-border bg-muted p-3 text-xs font-semibold">
                  {`curl -I <origin>/s/abc123`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t-2 border-border bg-secondary">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6">
            <h2 className="max-w-xl text-2xl font-extrabold uppercase leading-tight sm:text-3xl">
              Browse the full link catalog
            </h2>
            <p className="max-w-md text-muted-foreground">
              Every short link in the database is listed in the console with
              its destination, click count and creation date — searchable at a
              glance.
            </p>
            <Button
              onClick={() => goTo("/dashboard")}
              className="press h-14 border-2 border-border bg-accent px-8 text-lg font-extrabold uppercase shadow-brutal hover:bg-accent hover:text-accent-foreground"
            >
              Open console
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm font-semibold text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Short Link Black</span>
          <span className="flex items-center gap-2">
            <Scissors className="size-4" />
            Long URLs in, short links out.
          </span>
        </div>
      </footer>
    </div>
  );
}
