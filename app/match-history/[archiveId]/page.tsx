import { notFound } from "next/navigation";
import { adminFirestore } from "@/lib/firebase/admin";
import LiveMatchCenter from "@/components/public-view/LiveMatchCenter";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import MatchShareActions from "@/components/public-view/MatchShareActions";

export const revalidate = 300;

interface Props {
  params: Promise<{ archiveId: string }>;
}

export default async function MatchDetailPage({ params }: Props) {
  const { archiveId } = await params;
  const doc = await adminFirestore.collection("matches_history").doc(archiveId).get();
  if (!doc.exists) notFound();

  const match = doc.data()!;
  const matchData = match.fullSnapshot;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block">
        <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto mt-2 sm:mt-4 w-full max-w-5xl min-w-0 overflow-hidden px-3.5 pb-20 sm:px-6 md:p-6">
        {/* Share Graphic & (i) Instruction Actions Bar */}
        <MatchShareActions archiveId={archiveId} />

        {matchData && <LiveMatchCenter matchData={matchData} />}
      </div>
      <Footer />
    </div>
  );
}