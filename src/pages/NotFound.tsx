import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="flex flex-1 flex-col items-center justify-center bg-brutal-grid px-4">
        <div className="w-full max-w-md border-2 border-border bg-card p-10 text-center shadow-brutal-lg">
          <div className="mx-auto flex size-14 items-center justify-center border-2 border-border bg-destructive text-white shadow-brutal">
            <Scissors className="size-7" />
          </div>
          <h1 className="mt-6 text-6xl font-extrabold tracking-tight">404</h1>
          <p className="mt-2 text-lg font-bold uppercase tracking-widest text-muted-foreground">
            Page not found
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            This short link doesn&apos;t point anywhere. It may never have
            existed, or it was deleted from the catalog.
          </p>
          <a
            href="/"
            className="press mt-8 inline-block border-2 border-border bg-primary px-6 py-3 text-sm font-extrabold uppercase text-primary-foreground shadow-brutal no-underline hover:bg-primary hover:text-primary-foreground"
          >
            Back home
          </a>
        </div>
      </div>
    </motion.div>
  );
}
