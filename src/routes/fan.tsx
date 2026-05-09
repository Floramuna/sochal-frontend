import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TOPICS, useSochal, sochal, type Topic, type LiveStream } from "@/lib/sochal-store";
import { ReelCard, type Reel } from "@/components/sochal/ReelCard";
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/fan")({
  head: () => ({ meta: [{ title: "Reels · Sochal" }] }),
  component: FanFeed,
});

const grads = [
  "bg-gradient-to-br from-[oklch(0.35_0.18_265)] via-[oklch(0.25_0.15_280)] to-[oklch(0.18_0.05_260)]",
  "bg-gradient-to-br from-[oklch(0.35_0.20_320)] via-[oklch(0.22_0.12_290)] to-[oklch(0.16_0.04_260)]",
  "bg-gradient-to-br from-[oklch(0.4_0.18_25)] via-[oklch(0.25_0.12_15)] to-[oklch(0.16_0.04_260)]",
  "bg-gradient-to-br from-[oklch(0.38_0.18_145)] via-[oklch(0.24_0.12_175)] to-[oklch(0.16_0.04_260)]",
];

function streamToReel(s: LiveStream): Reel {
  const seed = s.handle.charCodeAt(0) % grads.length;
  return {
    id: s.id,
    creator: s.displayName,
    handle: s.handle,
    topic: s.topic,
    title: s.title,
    isLive: s.isLive,
    potSol: s.potSol,
    targetSol: s.targetSol,
    viewers: s.viewers,
    bgGradient: grads[seed],
    avatarSeed: s.displayName.slice(0, 2).toUpperCase(),
  };
}

function FanFeed() {
  const { wallet, topic, streams } = useSochal();
  const [active, setActive] = useState<Topic | "All">(topic ?? "All");

  const reels = useMemo(() => {
    const live = streams.filter((s) => s.isLive);
    return (active === "All" ? live : live.filter((s) => s.topic === active)).map(streamToReel);
  }, [active, streams]);

  if (!wallet) return <ConnectGate />;

  return (
    <div className="mx-auto max-w-md md:max-w-lg px-3 py-4">
      <div className="sticky top-16 z-30 -mx-3 mb-3 px-3 py-2 glass rounded-2xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["All", ...TOPICS] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setActive(t);
                if (t !== "All") sochal.setTopic(t as Topic);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                active === t
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 snap-y snap-mandatory">
        {reels.map((r) => (
          <ReelCard key={r.id} reel={r} />
        ))}
        {reels.length === 0 && <EmptyFeed />}
      </div>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="mx-auto size-14 grid place-items-center rounded-2xl bg-primary/15 text-primary mb-4">
        <Radio className="size-6" />
      </div>
      <h3 className="text-xl font-bold">No live streams yet</h3>
      <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
        Sochal is fresh — nothing to watch in this topic. Be the first creator on stage and your stream lights up the feed for every fan that connects.
      </p>
      <Link to="/creator" className="inline-block mt-5">
        <Button className="bg-gradient-primary shadow-glow">
          <Radio className="size-4" /> Go live yourself
        </Button>
      </Link>
    </div>
  );
}

function ConnectGate() {
  return (
    <div className="mx-auto max-w-md text-center py-32 px-4">
      <h2 className="text-2xl font-bold">Connect a wallet to watch live</h2>
      <p className="text-muted-foreground mt-2">Tipping is on-chain — entry is 0.01 SOL.</p>
      <Link to="/" className="inline-block mt-6">
        <Button className="bg-gradient-primary shadow-glow">Back to home</Button>
      </Link>
    </div>
  );
}
