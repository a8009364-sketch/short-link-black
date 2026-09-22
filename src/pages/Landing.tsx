import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
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
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  Globe,
  Link2,
  Scissors,
  Timer,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const EXAMPLES = [
  "github.com/vercel/next.js",
  "en.wikipedia.org/wiki/URL_shortening",
  "developer.mozilla.org/en-US/docs/Web",
];

function shortenUrl(raw: string): string {
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
    const normalized = shortenUrl(url);
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
              Snip<span className="text-muted-foreground">.link</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && isAuthenticated ? (
              <Button
                onClick={() => goTo("/dashboard")}
                className="press border-2 border-border bg-accent font-bold shadow-brutal hover:bg-accent hover:text-accent-foreground"
              >
                Dashboard
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

      {/* Hero */}
      <main>
        <section className="border-b-2 border-border bg-brutal-grid">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left column */}
              <div className="flex flex-col gap-6">
                <Badge
                  variant="outline"
                  className="w-fit border-2 border-border bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest"
                >
                  <Zap className="size-3" />
                  Fast · Free · No tracking
                </Badge>
                <h1 className="text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
                  Long URLs,
                  <br />
                  <span className="border-b-8 border-accent pb-1">
                    Short Links
                  </span>
                </h1>
                <p className="max-w-md text-lg text-muted-foreground">
                  Paste a URL, get a compact link in milliseconds. Every click
                  is counted — no clutter, no nonsense.
                </p>

                {/* Feature chips */}
                <ul className="mt-2 flex flex-col gap-3 text-sm font-semibold">
                  <li className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center border-2 border-border bg-secondary shadow-brutal-sm">
                      <Zap className="size-4" />
                    </span>
                    Instant shortening with custom aliases
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center border-2 border-border bg-accent shadow-brutal-sm">
                      <BarChart3 className="size-4" />
                    </span>
                    Click counts on every link
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center border-2 border-border bg-primary text-primary-foreground shadow-brutal-sm">
                      <Globe className="size-4" />
                    </span>
                    Public JSON API at <code>/api/shorten</code>
                  </li>
                </ul>
              </div>

              {/* Right column: shorten card */}
              <Card className="border-2 border-border shadow-brutal-lg">
                <CardHeader className="border-b-2 border-border bg-secondary">
                  <CardTitle className="flex items-center gap-2 text-lg font-extrabold uppercase">
                    <Link2 className="size-5" />
                    Shorten a URL
                  </CardTitle>
                  <CardDescription className="font-medium text-muted-foreground">
                    Try it right now — no account needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 p-6">
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
                      {creating ? "Snipping..." : "Snip it"}
                    </Button>
                  </form>

                  {shortCode && (
                    <div className="border-2 border-border bg-accent p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-accent-foreground/70">
                        Your short link
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

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Try:
                    </span>
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setUrl(example)}
                        className="press-sm max-w-full truncate border-2 border-border bg-card px-2 py-1 text-xs font-semibold shadow-brutal-sm hover:bg-secondary"
                      >
                        {example}
                      </button>
                    ))}
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
                Links snipped
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
              <span className="text-4xl font-extrabold">
                {stats ? stats.totalClicks : "—"}
              </span>
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                Clicks redirected
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
              <span className="flex items-center gap-2 text-4xl font-extrabold">
                <Timer className="size-8" />0 ms
              </span>
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                Added latency
              </span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Paste",
                body: "Drop any long URL into the box — with or without the https://.",
                bg: "bg-secondary",
              },
              {
                step: "02",
                title: "Snip",
                body: "We generate a unique 6-character code and store the mapping in the database.",
                bg: "bg-accent",
              },
              {
                step: "03",
                title: "Share",
                body: "Anyone opening your short link is redirected instantly. Clicks are tallied.",
                bg: "bg-card",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`border-2 border-border ${item.bg} p-6 shadow-brutal press-sm`}
              >
                <span className="text-4xl font-extrabold opacity-30">
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl font-extrabold uppercase">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-foreground/80">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t-2 border-border bg-secondary">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
            <h2 className="max-w-xl text-3xl font-extrabold uppercase leading-tight sm:text-4xl">
              Ready to tidy up your links?
            </h2>
            <p className="max-w-md text-muted-foreground">
              Create a free account to keep your links, track clicks and use
              custom aliases.
            </p>
            <Button
              onClick={() => goTo("/auth?returnTo=/dashboard")}
              className="press h-14 border-2 border-border bg-accent px-8 text-lg font-extrabold uppercase shadow-brutal hover:bg-accent hover:text-accent-foreground"
            >
              Start snipping
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm font-semibold text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Snip.link</span>
          <span className="flex items-center gap-2">
            <Scissors className="size-4" />
            Long URLs, short links.
          </span>
        </div>
      </footer>
    </div>
  );
}
