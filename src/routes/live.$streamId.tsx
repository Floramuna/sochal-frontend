import { createFileRoute } from "@tanstack/react-router";
import { LiveStreamView } from "@/components/sochal/live/LiveStreamView";
import { MOCK_LIVE_STREAMS } from "@/lib/mock-data";

export const Route = createFileRoute("/live/$streamId")({
  component: LivePage,
});

function LivePage() {
  const { streamId } = Route.useParams();
  
  // Find live stream in mock data
  const liveStream = MOCK_LIVE_STREAMS.find(s => s.id === streamId);
  
  return (
    <LiveStreamView 
      streamId={streamId}
      streamTitle={liveStream?.title || "Live Battle"}
      creatorName={liveStream?.creatorName || "Creator"}
      creatorHandle={liveStream?.creatorHandle || "@creator"}
      creatorAvatar={liveStream?.creatorAvatar || "https://randomuser.me/api/portraits/lego/1.jpg"}
      isCreator={false}
      onEnd={() => window.history.back()}
    />
  );
}