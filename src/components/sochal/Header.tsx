import { Link, useRouterState } from "@tanstack/react-router";
import { WalletButton } from "./WalletButton";
import { useSochal } from "@/lib/sochal-store";
import { Zap } from "lucide-react";

export function Header() {
  const { role } = useSochal();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const navLinks = role === "creator"
    ? [{ to: "/creator", label: "Studio" }, { to: "/explore", label: "Explore" }]
    : role === "fan"
    ? [{ to: "/fan", label: "Reels" }, { to: "/explore", label: "Explore" }]
    : [];

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative size-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            so<span className="text-gradient">chal</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                path === l.to
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}
