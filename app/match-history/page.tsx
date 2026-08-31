import { adminFirestore } from "@/lib/firebase/admin";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import MatchHistoryClient from "./MatchHistoryClient";

export const revalidate = 60;

export default async function MatchHistoryPage() {
  let matches: any[] = [];
  try {
    const snapshot = await adminFirestore.collection("matches_history").orderBy("completedAt", "desc").get();

    matches = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching match history:", error);
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block">
        <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl min-w-0 overflow-hidden flex-1 px-3.5 pb-20 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <MatchHistoryClient matches={matches} />
      </div>

      <Footer />
    </div>
  );
}