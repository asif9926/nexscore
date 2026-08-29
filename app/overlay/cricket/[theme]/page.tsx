import BroadcastEngine from "@/components/overlay/cricket/BroadcastEngine";
import EventPopup from "@/components/overlay/cricket/EventPopup";
import BroadcastLogoBadge from "@/components/overlay/BroadcastLogoBadge";

export default async function CricketOverlayPage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;

  return (
    <main className="w-full h-screen relative bg-transparent overflow-hidden">
      <BroadcastLogoBadge />
      <EventPopup />
      <BroadcastEngine theme={theme} />
    </main>
  );
}