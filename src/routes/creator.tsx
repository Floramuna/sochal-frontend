import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSochal, sochal } from "@/lib/sochal-store";
import { ProfileSetupDialog } from "@/components/sochal/ProfileSetupDialog";
import { CreateReelModal } from "@/components/sochal/live/CreateReelModal";
import { LiveStreamView } from "@/components/sochal/live/LiveStreamView";
import { GoLiveModal } from "@/components/sochal/live/GoLiveModal";
import { Radio, Video, UserCircle2, Target, Users, Plus, LogIn } from "lucide-react";

export const Route = createFileRoute("/creator")({
  head: () => ({ meta: [{ title: "Creator Studio · Sochal" }] }),
  component: CreatorStudio,
});

function CreatorStudio() {
  const { wallet, profile, selectedChallenge } = useSochal();
  const [showCreateReel, setShowCreateReel] = useState(false);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);

  if (!wallet) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <LogIn className="size-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
          <p className="text-gray-400 mt-2">Connect your wallet to start creating</p>
          <Link to="/" className="inline-block mt-6">
            <Button className="bg-gradient-primary shadow-glow">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <UserCircle2 className="size-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Create Your Profile</h2>
          <p className="text-gray-400 mt-2">Set up your creator profile</p>
          <Button onClick={() => setProfileOpen(true)} className="mt-6 bg-gradient-primary">
            Set Up Profile
          </Button>
          <ProfileSetupDialog open={profileOpen} onOpenChange={setProfileOpen} />
        </div>
      </div>
    );
  }

  if (isLiveStreaming && currentStreamId && selectedChallenge) {
    return (
      <LiveStreamView
        streamId={currentStreamId}
        streamTitle={selectedChallenge.title}
        creatorName={profile.displayName}
        creatorHandle={profile.handle}
        creatorAvatar="https://randomuser.me/api/portraits/lego/1.jpg"
        isCreator={true}
        onEnd={() => {
          setIsLiveStreaming(false);
          setCurrentStreamId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Creator Studio</h1>
          <p className="text-gray-400 mt-1">@{profile.handle}</p>
        </div>

        {/* Selected Challenge Display */}
        {selectedChallenge && (
          <div className="mb-6 p-4 rounded-2xl border border-green-500/30 bg-green-500/10">
            <p className="text-xs text-green-400 mb-1">ACTIVE CHALLENGE</p>
            <p className="text-white font-semibold">{selectedChallenge.title}</p>
            <p className="text-gray-400 text-sm">#{selectedChallenge.topic} · {selectedChallenge.targetMin} SOL target</p>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Create Reel Button */}
          <button
            onClick={() => setShowCreateReel(true)}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-purple-600 hover:bg-purple-700 transition"
          >
            <Video className="size-10 text-white" />
            <span className="text-white font-semibold">Create Reel</span>
            <span className="text-white/70 text-xs">Record & post</span>
          </button>

          {/* Go Live Button */}
          <button
            onClick={() => {
              if (selectedChallenge) {
                setCurrentStreamId(`stream_${Date.now()}`);
                setIsLiveStreaming(true);
              } else {
                setShowGoLiveModal(true);
              }
            }}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl transition ${
              selectedChallenge
                ? "bg-gradient-primary shadow-glow animate-pulse-glow"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            <Radio className="size-10 text-white" />
            <span className="text-white font-semibold">Go Live</span>
            <span className="text-white/70 text-xs">
              {selectedChallenge ? "Ready to stream" : "Select challenge first"}
            </span>
          </button>
        </div>

        {/* Tips Card */}
        <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 mb-8">
          <h3 className="text-white font-semibold mb-2">📺 How to Go Live</h3>
          <p className="text-gray-400 text-sm">1. Create or join a challenge first</p>
          <p className="text-gray-400 text-sm">2. Select it as your active challenge</p>
          <p className="text-gray-400 text-sm">3. Press "Go Live" to start streaming</p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <button
            onClick={() => setShowGoLiveModal(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition"
          >
            <div className="flex items-center gap-3">
              <Target className="size-5 text-blue-400" />
              <span className="text-white">Create New Challenge</span>
            </div>
            <Plus className="size-5 text-gray-500" />
          </button>

          <Link to="/fan" className="block">
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-blue-400" />
                <span className="text-white">Browse Challenges</span>
              </div>
              <span className="text-gray-500">→</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Modals */}
      <CreateReelModal
        isOpen={showCreateReel}
        onClose={() => setShowCreateReel(false)}
        onReelCreated={() => {
          alert("✅ Reel created successfully!");
          setShowCreateReel(false);
        }}
      />

      <GoLiveModal
        isOpen={showGoLiveModal}
        onClose={() => setShowGoLiveModal(false)}
        onCreateChallenge={(topic, title, description, targetMin) => {
          sochal.createChallenge({
            topic,
            title,
            description,
            creatorId: wallet.address,
            targetMin,
          });
          setShowGoLiveModal(false);
        }}
        onJoinExisting={() => {
          setShowGoLiveModal(false);
        }}
      />

      <ProfileSetupDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}