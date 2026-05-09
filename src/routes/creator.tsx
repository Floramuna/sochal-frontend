import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TOPICS, useSochal, sochal, type Topic } from "@/lib/sochal-store";
import { TopicBadge } from "@/components/sochal/TopicBadge";
import { SolAmount } from "@/components/sochal/SolAmount";
import { ProfileSetupDialog } from "@/components/sochal/ProfileSetupDialog";
import { Radio, Trophy, Coins, TrendingUp, Wifi, Camera, Mic, Loader2, UserCircle2, StopCircle } from "lucide-react";

export const Route = createFileRoute("/creator")({
  head: () => ({ meta: [{ title: "Studio · Sochal" }] }),
  component: CreatorStudio,
});

function CreatorStudio() {
  const { wallet, profile, streams } = useSochal();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const myStreams = useMemo(
    () => (wallet ? streams.filter((s) => s.ownerWallet === wallet.address) : []),
    [streams, wallet],
  );
  const liveNow = myStreams.find((s) => s.isLive);
  const lifetime = myStreams.reduce((acc, s) => acc + s.potSol, 0);
  const lastEarned = myStreams[0]?.potSol ?? 0;
  const wins = 0; // TODO: read from on-chain bracket history.

  if (!wallet) {
    return (
      <div className="mx-auto max-w-md text-center py-32 px-4">
        <h2 className="text-2xl font-bold">Connect a wallet to start your stream</h2>
        <Link to="/" className="inline-block mt-6">
          <Button className="bg-gradient-primary shadow-glow">Back to home</Button>
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md text-center py-32 px-4">
        <div className="mx-auto size-14 grid place-items-center rounded-2xl bg-primary/15 text-primary mb-4">
          <UserCircle2 className="size-6" />
        </div>
        <h2 className="text-2xl font-bold">Create your creator profile</h2>
        <p className="text-muted-foreground mt-2">Pick a unique handle so fans can find and tip you.</p>
        <Button onClick={() => setProfileOpen(true)} className="mt-6 bg-gradient-primary shadow-glow">
          Set up profile
        </Button>
        <ProfileSetupDialog open={profileOpen} onOpenChange={setProfileOpen} />
      </div>
    );
  }

  const stats = [
    { icon: Coins, label: "Lifetime earned", value: lifetime, accent: "text-gradient" },
    { icon: TrendingUp, label: "Last live earned", value: lastEarned },
    { icon: Trophy, label: "Bracket wins", value: wins, isCount: true },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-8 md:py-12">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-primary/80 font-mono mb-2">
            Studio · @{profile.handle}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Ready to take the stage, {profile.displayName}?</h1>
          <p className="text-muted-foreground mt-1">One click. Stream goes live, tip menu opens, payouts settle on-chain.</p>
        </div>
      </div>

      {/* Go Live card */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-surface p-6 md:p-10 shadow-elevated">
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/15 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-accent/15 blur-3xl animate-float" />

        <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            {liveNow ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-success/15 border border-success/30 px-3 py-1 text-xs font-medium text-success mb-4">
                <span className="size-1.5 rounded-full bg-success animate-pulse" /> Live now
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-destructive/15 border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive mb-4">
                <span className="size-1.5 rounded-full bg-destructive animate-pulse" /> Offline
              </div>
            )}
            <h2 className="text-2xl md:text-3xl font-bold">{liveNow ? liveNow.title : "Go Live"}</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              {liveNow
                ? "Your stream is open. Tips land on-chain in real time. End the live to settle the pot."
                : "Pick a topic, set your stage. Sochal opens a 100ms room, deploys your Stream PDA, and starts accepting tips instantly."}
            </p>
            <div className="flex items-center gap-4 mt-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Camera className="size-3.5" /> Camera ready</span>
              <span className="flex items-center gap-1.5"><Mic className="size-3.5" /> Mic ready</span>
              <span className="flex items-center gap-1.5"><Wifi className="size-3.5" /> Solana mainnet</span>
            </div>
          </div>

          {liveNow ? (
            <Button
              size="lg"
              variant="outline"
              onClick={() => sochal.endStream(liveNow.id)}
              className="h-20 px-10 text-lg border-destructive/40 text-destructive font-bold"
            >
              <StopCircle className="size-6" />
              End stream
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => setOpen(true)}
              className="h-20 px-10 text-lg bg-gradient-primary shadow-glow font-bold animate-pulse-glow"
            >
              <Radio className="size-6" />
              Go Live
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className="size-4 text-primary" />
            </div>
            <div className={`mt-2 text-3xl font-bold ${s.accent ?? ""}`}>
              {s.isCount ? s.value : <SolAmount value={s.value} />}
            </div>
          </div>
        ))}
      </div>

      {/* Bracket peek */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Your bracket position</h3>
          <span className="text-xs text-muted-foreground font-mono">Unranked · go live to enter</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-[11px]">
          {["R16", "Quarter", "Semi", "Final"].map((r) => (
            <div
              key={r}
              className="rounded-xl p-3 text-center border border-border bg-surface text-muted-foreground"
            >
              <div className="font-bold text-sm">{r}</div>
              <div className="mt-1">Locked</div>
            </div>
          ))}
        </div>
      </div>

      <GoLiveModal open={open} onOpenChange={setOpen} />
      <ProfileSetupDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}

function GoLiveModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("1");
  const [phase, setPhase] = useState<"idle" | "signing" | "live">("idle");

  const handleGoLive = async () => {
    if (!topic || !title.trim()) return;
    setPhase("signing");
    // TODO: replace with Anchor `init_live(topic, title, target)` + 100ms room creation.
    await new Promise((r) => setTimeout(r, 900));
    sochal.startStream({ topic, title: title.trim(), targetSol: parseFloat(target) || 1 });
    setPhase("live");
    setTimeout(() => {
      onOpenChange(false);
      setPhase("idle");
      setTopic(null);
      setTitle("");
      setTarget("1");
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Configure your live</DialogTitle>
          <DialogDescription>
            Choose a topic, write a hook, and set your pot target. The first tip opens your bracket entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Topic</div>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`rounded-full transition ${topic === t ? "ring-glow" : "opacity-60 hover:opacity-100"}`}
                >
                  <TopicBadge topic={t} size="md" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2">Stream title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. High-note challenge — 1 SOL hits the riff"
              className="w-full bg-input rounded-xl px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
              maxLength={120}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2">Pot target (SOL)</div>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              inputMode="decimal"
              className="w-full bg-input rounded-xl px-3 py-2.5 text-sm border border-border focus:border-primary outline-none font-mono"
            />
          </div>

          <Button
            disabled={!topic || !title.trim() || phase !== "idle"}
            onClick={handleGoLive}
            className="w-full h-12 bg-gradient-primary shadow-glow font-bold"
          >
            {phase === "signing" ? (
              <><Loader2 className="size-5 animate-spin" /> Signing transaction…</>
            ) : phase === "live" ? (
              <>You're live ✨</>
            ) : (
              <><Radio className="size-5" /> Confirm & Go Live</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
