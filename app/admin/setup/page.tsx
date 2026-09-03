// app/admin/setup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Trophy, 
  X, 
  Crown, 
  Shield, 
  Sparkles, 
  Radio, 
  ArrowRight 
} from "lucide-react";
import { Player } from "@/lib/types/match";
import { ref, set, get } from "firebase/database";
import { rtdb, auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/context/ToastContext";
import Link from "next/link";

interface SetupState {
  sport: "cricket" | "football";
  teamA: string;
  teamB: string;
  tournament: string;
  venue: string;
  squadA: Player[];
  squadB: Player[];
  toss: { winner: "teamA" | "teamB" | null; decision: "bat" | "bowl" | null };
  maxOvers: number;
  openers: { striker: string; nonStriker: string; bowler: string };
}

const OVERS_PRESETS = [5, 10, 15, 20, 50];
const MAX_SQUAD_LIMIT = 11; // 🛡️ সর্বোচ্চ ১১ জন প্লেয়ার লিমিট

export default function PreMatchWizard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [existingLiveMatch, setExistingLiveMatch] = useState<{ id: string; data: any } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customOvers, setCustomOvers] = useState(false);

  const [setupData, setSetupData] = useState<SetupState>({
    sport: "cricket",
    teamA: "",
    teamB: "",
    tournament: "",
    venue: "",
    squadA: [],
    squadB: [],
    toss: { winner: null, decision: null },
    maxOvers: 20,
    openers: { striker: "", nonStriker: "", bowler: "" },
  });

  const isCricket = setupData.sport === "cricket";
  const currentRoles = isCricket 
    ? ["Batsman", "Bowler", "All-rounder"] 
    : ["Forward", "Midfielder", "Defender", "Goalkeeper"];

  const [playerInputA, setPlayerInputA] = useState({ 
    name: "", 
    role: "Batsman", 
    isCaptain: false, 
    isWicketKeeper: false 
  });
  const [playerInputB, setPlayerInputB] = useState({ 
    name: "", 
    role: "Batsman", 
    isCaptain: false, 
    isWicketKeeper: false 
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }
      setCurrentUser(user);

      try {
        const activeMatchRef = ref(rtdb, `admin_active_matches/${user.uid}`);
        const activeSnap = await get(activeMatchRef);

        if (activeSnap.exists()) {
          const activeMatchId = activeSnap.val();
          if (activeMatchId) {
            const matchSnap = await get(ref(rtdb, `matches/${activeMatchId}`));
            if (matchSnap.exists() && matchSnap.val()?.meta?.status === "live") {
              setExistingLiveMatch({ id: activeMatchId, data: matchSnap.val() });
            } else {
              await set(activeMatchRef, null);
            }
          }
        }
      } catch (err) {
        console.warn("Notice checking active match:", err);
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-ink text-fg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-electric" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-fg-muted">Checking Admin Status...</p>
      </div>
    );
  }

  if (existingLiveMatch) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-10 text-center">
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-crimson/30 bg-panel p-6 shadow-2xl sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-crimson/40 bg-crimson/15 text-crimson shadow-lg shadow-crimson/20">
            <Radio size={30} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-crimson/40 bg-crimson/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-crimson">
              <span className="h-2 w-2 animate-ping rounded-full bg-crimson" />
              Your Match is Currently Live
            </div>
            <h2 className="text-xl font-bold text-fg sm:text-2xl">
              {existingLiveMatch.data.meta.teamA} vs {existingLiveMatch.data.meta.teamB}
            </h2>
            <p className="text-xs leading-relaxed text-fg-muted">
              আপনার অ্যাকাউন্টে একটি ম্যাচ বর্তমানে লাইভ চলছে। নতুন ম্যাচ শুরু করতে হলে আগের ম্যাচটি কন্ট্রোল রুম থেকে সমাপ্ত (Archive) করতে হবে।
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link href={`/admin/control/${existingLiveMatch.id}`} className="block w-full">
              <button className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-crimson/25 transition-all hover:opacity-90 active:scale-95">
                <span>Enter Your Control Room</span>
                <ArrowRight size={15} />
              </button>
            </Link>

            <Link href="/admin" className="block w-full">
              <button className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border bg-ink px-5 py-2.5 text-xs font-bold text-fg-muted transition-all hover:bg-panel-raised hover:text-fg">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const TOTAL_STEPS = isCricket ? 4 : 2;

  const isStep1Valid = setupData.teamA.trim() !== "" && setupData.teamB.trim() !== "";
  const isStep2Valid = isCricket
    ? setupData.squadA.length >= 2 && setupData.squadB.length >= 2
    : setupData.squadA.length >= 1 && setupData.squadB.length >= 1;
  const isStep3Valid = isCricket
    ? setupData.maxOvers > 0 && setupData.toss.winner !== null && setupData.toss.decision !== null
    : true;
  const isStep4Valid = isCricket
    ? setupData.openers.striker !== "" &&
      setupData.openers.nonStriker !== "" &&
      setupData.openers.bowler !== "" &&
      setupData.openers.striker !== setupData.openers.nonStriker
    : true;

  const isNextDisabled = () => {
    if (step === 1) return !isStep1Valid;
    if (step === 2) return !isStep2Valid;
    if (step === 3) return !isStep3Valid;
    if (step === 4) return !isStep4Valid;
    return false;
  };

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) return showToast("উভয় দলের নাম দেওয়া আবশ্যক।", "error");
    if (step === 2 && !isStep2Valid) return showToast(`প্রতিটি দলে কমপক্ষে ${isCricket ? 2 : 1} জন খেলোয়াড় যোগ করুন।`, "error");
    if (step === 3 && !isStep3Valid) return showToast("ওভার, টস বিজয়ী এবং সিদ্ধান্ত নির্বাচন করুন।", "error");
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    if (step === 1) {
      router.push("/admin");
    } else {
      setStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleSportChange = (sport: "cricket" | "football") => {
    setSetupData((prev) => ({
      ...prev,
      sport,
      openers: { striker: "", nonStriker: "", bowler: "" },
    }));
    const newRoles = sport === "cricket" 
      ? ["Batsman", "Bowler", "All-rounder"] 
      : ["Forward", "Midfielder", "Defender", "Goalkeeper"];
    setPlayerInputA((p) => ({ ...p, role: newRoles[0], isWicketKeeper: false }));
    setPlayerInputB((p) => ({ ...p, role: newRoles[0], isWicketKeeper: false }));
  };

  // 🛡️ প্লেয়ার যুক্তকরণ ও ১১ জনের গার্ড
  const addPlayer = (team: "A" | "B") => {
    const squad = team === "A" ? setupData.squadA : setupData.squadB;
    if (squad.length >= MAX_SQUAD_LIMIT) {
      showToast(`দলে সর্বোচ্চ ${MAX_SQUAD_LIMIT} জন খেলোয়াড় যোগ করা যাবে।`, "error");
      return;
    }

    const input = team === "A" ? playerInputA : playerInputB;
    if (!input.name.trim()) return;

    const finalRole = currentRoles.includes(input.role) ? input.role : currentRoles[0];
    const newPlayer: Player = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.name.trim(),
      role: finalRole as any,
      isCaptain: input.isCaptain,
      isWicketKeeper: isCricket ? input.isWicketKeeper : false,
    };

    if (team === "A") {
      let updatedSquadA = [...setupData.squadA];
      if (input.isCaptain) updatedSquadA = updatedSquadA.map(p => ({ ...p, isCaptain: false }));
      if (input.isWicketKeeper && isCricket) updatedSquadA = updatedSquadA.map(p => ({ ...p, isWicketKeeper: false }));
      
      setSetupData((prev) => ({ ...prev, squadA: [...updatedSquadA, newPlayer] }));
      setPlayerInputA({ name: "", role: currentRoles[0], isCaptain: false, isWicketKeeper: false });
    } else {
      let updatedSquadB = [...setupData.squadB];
      if (input.isCaptain) updatedSquadB = updatedSquadB.map(p => ({ ...p, isCaptain: false }));
      if (input.isWicketKeeper && isCricket) updatedSquadB = updatedSquadB.map(p => ({ ...p, isWicketKeeper: false }));

      setSetupData((prev) => ({ ...prev, squadB: [...updatedSquadB, newPlayer] }));
      setPlayerInputB({ name: "", role: currentRoles[0], isCaptain: false, isWicketKeeper: false });
    }
  };

  const handleAutoFillSquad = (team: "A" | "B") => {
    const defaultCricketRoles = [
      "Batsman", "Batsman", "Batsman", "Batsman",
      "All-rounder", "All-rounder", "All-rounder",
      "Bowler", "Bowler", "Bowler", "Bowler"
    ];
    const defaultFootballRoles = [
      "Goalkeeper", "Defender", "Defender", "Defender", "Defender",
      "Midfielder", "Midfielder", "Midfielder",
      "Forward", "Forward", "Forward"
    ];

    const rolesList = isCricket ? defaultCricketRoles : defaultFootballRoles;
    const rawName = team === "A" ? setupData.teamA.trim() : setupData.teamB.trim();
    const shortCode = rawName.length > 0 ? rawName.slice(0, 4).toUpperCase() : (team === "A" ? "TMA" : "TMB");

    const genericSquad: Player[] = Array.from({ length: 11 }, (_, i) => ({
      id: `p_${team.toLowerCase()}_${Date.now()}_${i + 1}`,
      name: `${shortCode} P${i + 1}`,
      role: (rolesList[i] || (isCricket ? "Batsman" : "Forward")) as any,
      isCaptain: i === 0,
      isWicketKeeper: isCricket && i === 2,
    }));

    // 🛡️ অটো-ফিল করলে ওপেনার স্টেট স্বয়ংক্রিয়ভাবে ক্লিন হবে
    if (team === "A") {
      setSetupData((prev) => ({ 
        ...prev, 
        squadA: genericSquad,
        openers: { striker: "", nonStriker: "", bowler: "" }
      }));
      showToast(`${shortCode} স্কোয়াড ১১ জনে পূর্ণ করা হয়েছে!`, "info");
    } else {
      setSetupData((prev) => ({ 
        ...prev, 
        squadB: genericSquad,
        openers: { striker: "", nonStriker: "", bowler: "" }
      }));
      showToast(`${shortCode} স্কোয়াড ১১ জনে পূর্ণ করা হয়েছে!`, "info");
    }
  };

  const removePlayer = (team: "A" | "B", id: string) => {
    setSetupData((prev) => {
      const nextOpeners = { ...prev.openers };
      if (nextOpeners.striker === id) nextOpeners.striker = "";
      if (nextOpeners.nonStriker === id) nextOpeners.nonStriker = "";
      if (nextOpeners.bowler === id) nextOpeners.bowler = "";

      return {
        ...prev,
        openers: nextOpeners,
        squadA: team === "A" ? prev.squadA.filter((p) => p.id !== id) : prev.squadA,
        squadB: team === "B" ? prev.squadB.filter((p) => p.id !== id) : prev.squadB,
      };
    });
  };

  const battingTeamKey = setupData.toss.decision === "bat"
    ? setupData.toss.winner || "teamA"
    : setupData.toss.winner === "teamA"
    ? "teamB"
    : "teamA";
  const bowlingTeamKey = battingTeamKey === "teamA" ? "teamB" : "teamA";
  const battingSquad = battingTeamKey === "teamA" ? setupData.squadA : setupData.squadB;
  const bowlingSquad = bowlingTeamKey === "teamA" ? setupData.squadA : setupData.squadB;

  const handleStartMatch = async () => {
    if (!currentUser) return showToast("ম্যাচ তৈরি করতে লগইন করা আবশ্যক।", "error");

    if (isCricket && !isStep4Valid) {
      if (setupData.openers.striker === setupData.openers.nonStriker) {
        showToast("স্ট্রাইকার ও নন-স্ট্রাইকার ভিন্ন খেলোয়াড় হতে হবে।", "error");
      } else {
        showToast("ওপেনিং ব্যাটসম্যান ও বোলার নির্বাচন করুন।", "error");
      }
      return;
    }

    setLoading(true);
    try {
      const matchId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const matchState: any = {
        meta: {
          sport: setupData.sport,
          status: "live",
          createdBy: currentUser.uid,
          teamA: setupData.teamA.trim(),
          teamB: setupData.teamB.trim(),
          tournament: setupData.tournament.trim() || "Local Tournament",
          venue: setupData.venue.trim() || "",
          activeTheme: setupData.sport === "football" ? "premier" : "sky",
          activeGraphic: "LOWER_THIRD",
          showScoreboard: true,
          showLogo: false,
          customLogoUrl: null,
          customLogoLeftUrl: null,
          currentEvent: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        // 🛡️ প্রেজেন্স নোড ইনিশিয়ালাইজেশন
        presence: {
          lastPing: Date.now(),
        },
      };

      if (isCricket) {
        const striker = battingSquad.find((p) => p.id === setupData.openers.striker);
        const nonStriker = battingSquad.find((p) => p.id === setupData.openers.nonStriker);
        const bowler = bowlingSquad.find((p) => p.id === setupData.openers.bowler);

        if (!striker || !nonStriker || !bowler) {
          showToast("ওপেনার নির্বাচনে সমস্যা রয়েছে। পুনরায় নির্বাচন করুন।", "error");
          setLoading(false);
          return;
        }

        matchState.cricket = {
          maxOvers: setupData.maxOvers || 20,
          toss: setupData.toss,
          squads: { teamA: setupData.squadA, teamB: setupData.squadB },
          currentInnings: 1,
          innings1: {
            battingTeam: battingTeamKey,
            score: 0,
            wickets: 0,
            overs: "0.0",
            runRate: 0,
            extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
            batsmen: [
              { id: striker.id, name: striker.name, runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: true, isOut: false },
              { id: nonStriker.id, name: nonStriker.name, runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: false, isOut: false },
            ],
            bowlers: [{ id: bowler.id, name: bowler.name, overs: "0.0", maidens: 0, runs: 0, wickets: 0, isActive: true }],
            recentBalls: [],
            fallOfWickets: [],
            isCompleted: false,
          },
          innings2: {
            battingTeam: bowlingTeamKey,
            score: 0,
            wickets: 0,
            overs: "0.0",
            runRate: 0,
            extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
            batsmen: [],
            bowlers: [],
            recentBalls: [],
            fallOfWickets: [],
            isCompleted: false,
          },
        };
      } else {
        matchState.football = {
          scoreA: 0,
          scoreB: 0,
          redCardsA: 0,
          redCardsB: 0,
          yellowCardsA: 0,
          yellowCardsB: 0,
          isRunning: false,
          startedAt: null,
          elapsedSeconds: 0,
          half: "1ST HALF",
          currentHalf: 1,
          squads: { teamA: setupData.squadA, teamB: setupData.squadB },
          half1: { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } },
          half2: { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } },
          cards: { teamA: [], teamB: [] },
          substitutions: { teamA: [], teamB: [] },
          events: [],
        };
      }

      await set(ref(rtdb, `matches/${matchId}`), matchState);
      await set(ref(rtdb, `match_actionLogs/${matchId}`), null);
      await set(ref(rtdb, `admin_active_matches/${currentUser.uid}`), matchId);

      showToast("লাইভ ম্যাচ সফলভাবে শুরু হয়েছে!", "success");
      router.push(`/admin/control/${matchId}`);
    } catch (error) {
      console.error("Error starting match:", error);
      showToast("ম্যাচ শুরু করতে সমস্যা হয়েছে।", "error");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-ink p-4 pb-20 text-fg md:p-8">
      <div className="w-full max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="mb-3 flex items-center justify-center gap-2.5 text-2xl font-black uppercase tracking-wider text-fg sm:text-3xl">
            <Trophy className="text-electric" size={26} /> Setup New Match
          </h1>
          <div className="mx-auto flex max-w-xs items-center justify-center gap-2 rounded-full border border-border bg-panel p-1.5 sm:gap-3">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step >= i ? "bg-electric text-white" : "bg-panel-raised text-fg-faint"
                }`}
              >
                {i}
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[480px] overflow-hidden rounded-2xl border border-border bg-panel p-5 shadow-2xl sm:p-6 md:p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-lg font-bold text-fg">1. Teams &amp; Sport</h2>
                  <span className="text-xs font-bold text-crimson">* Required</span>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Select Sport</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleSportChange("cricket")}
                      className={`min-h-[50px] flex-1 rounded-xl border-2 font-bold transition-all ${
                        setupData.sport === "cricket" ? "border-electric bg-electric/20 text-electric" : "border-border bg-ink text-fg-faint"
                      }`}
                    >
                      🏏 CRICKET
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSportChange("football")}
                      className={`min-h-[50px] flex-1 rounded-xl border-2 font-bold transition-all ${
                        setupData.sport === "football" ? "border-pitch-green bg-pitch-green/20 text-pitch-green" : "border-border bg-ink text-fg-faint"
                      }`}
                    >
                      ⚽ FOOTBALL
                    </button>
                  </div>
                </div>
                <div className="space-y-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-fg-muted">Team A Name *</label>
                    <input
                      type="text"
                      value={setupData.teamA}
                      onChange={(e) => setSetupData((prev) => ({ ...prev, teamA: e.target.value }))}
                      placeholder="e.g. Dhaka Titans"
                      className="min-h-[44px] w-full rounded-xl border border-border bg-ink p-3 text-sm text-fg outline-none focus:border-electric"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-fg-muted">Team B Name *</label>
                    <input
                      type="text"
                      value={setupData.teamB}
                      onChange={(e) => setSetupData((prev) => ({ ...prev, teamB: e.target.value }))}
                      placeholder="e.g. Chittagong Kings"
                      className="min-h-[44px] w-full rounded-xl border border-border bg-ink p-3 text-sm text-fg outline-none focus:border-signal-gold"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-fg-muted">Tournament (Optional)</label>
                      <input
                        type="text"
                        value={setupData.tournament}
                        onChange={(e) => setSetupData((prev) => ({ ...prev, tournament: e.target.value }))}
                        placeholder="e.g. Premier League"
                        className="min-h-[44px] w-full rounded-xl border border-border bg-ink p-3 text-sm text-fg outline-none focus:border-electric"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-fg-muted">Ground / Venue (Optional)</label>
                      <input
                        type="text"
                        value={setupData.venue}
                        onChange={(e) => setSetupData((prev) => ({ ...prev, venue: e.target.value }))}
                        placeholder="e.g. Mirpur Stadium"
                        className="min-h-[44px] w-full rounded-xl border border-border bg-ink p-3 text-sm text-fg outline-none focus:border-electric"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SQUAD & ROLES (11 Players Hard Limit) */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-fg">2. Squad &amp; Roles</h2>
                    <p className="text-[11px] text-fg-muted">সর্বোচ্চ ১১ জন খেলোয়াড় যোগ করতে পারবেন।</p>
                  </div>
                  <span className="text-xs font-bold text-crimson">* Min {isCricket ? "2" : "1"} | Max 11</span>
                </div>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {/* Team A squad */}
                  <div className="space-y-4 rounded-2xl border border-border bg-ink/60 p-4 shadow-xl sm:p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-electric">{setupData.teamA || "Team A"}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          setupData.squadA.length === MAX_SQUAD_LIMIT ? "bg-pitch-green/20 text-pitch-green" : "bg-panel text-fg-muted"
                        }`}>
                          {setupData.squadA.length}/{MAX_SQUAD_LIMIT}
                        </span>
                      </div>
                      {setupData.squadA.length < MAX_SQUAD_LIMIT && (
                        <button
                          type="button"
                          onClick={() => handleAutoFillSquad("A")}
                          className="flex items-center gap-1 rounded-lg border border-electric/40 bg-electric/10 px-2 py-1 text-[10px] font-bold text-electric transition-colors hover:bg-electric/20"
                        >
                          <Sparkles size={11} /> Auto-Fill (11)
                        </button>
                      )}
                    </div>

                    {setupData.squadA.length < MAX_SQUAD_LIMIT ? (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={playerInputA.name}
                            onChange={(e) => setPlayerInputA({ ...playerInputA, name: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && addPlayer("A")}
                            placeholder="Player Name"
                            className="min-h-[42px] w-full rounded-xl border border-border bg-panel p-2.5 text-sm text-fg outline-none focus:border-electric"
                          />
                          <select
                            value={playerInputA.role}
                            onChange={(e) => setPlayerInputA({ ...playerInputA, role: e.target.value })}
                            className="min-h-[42px] shrink-0 rounded-xl border border-border bg-panel p-2.5 text-xs text-fg outline-none"
                          >
                            {currentRoles.map((role) => (
                              <option key={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="flex gap-3 text-xs">
                            <label className="flex cursor-pointer items-center gap-1 text-fg-muted hover:text-fg">
                              <input
                                type="checkbox"
                                checked={playerInputA.isCaptain}
                                onChange={(e) => setPlayerInputA({ ...playerInputA, isCaptain: e.target.checked })}
                                className="rounded border-border text-electric"
                              />
                              <Crown size={13} className="text-signal-gold" /> Capt
                            </label>
                            {isCricket && (
                              <label className="flex cursor-pointer items-center gap-1 text-fg-muted hover:text-fg">
                                <input
                                  type="checkbox"
                                  checked={playerInputA.isWicketKeeper}
                                  onChange={(e) => setPlayerInputA({ ...playerInputA, isWicketKeeper: e.target.checked })}
                                  className="rounded border-border text-electric"
                                />
                                <Shield size={13} className="text-pitch-green" /> WK
                              </label>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addPlayer("A")}
                            className="rounded-xl bg-electric px-4 py-2 text-xs font-bold text-white transition-colors hover:opacity-90"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-pitch-green/30 bg-pitch-green/10 p-2.5 text-center text-xs font-bold text-pitch-green">
                        ✓ Squad Complete (11 Players Added)
                      </div>
                    )}

                    <ul className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1 text-xs">
                      {setupData.squadA.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-panel p-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-fg">{p.name}</span>
                            <span className="rounded bg-panel-raised px-1.5 py-0.5 text-[9px] text-fg-muted">{p.role}</span>
                            {p.isCaptain && <span className="text-[10px] font-bold text-signal-gold">(C)</span>}
                            {p.isWicketKeeper && <span className="text-[10px] font-bold text-pitch-green">(WK)</span>}
                          </div>
                          <button onClick={() => removePlayer("A", p.id)} className="p-1 text-crimson hover:opacity-80">
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Team B squad */}
                  <div className="space-y-4 rounded-2xl border border-border bg-ink/60 p-4 shadow-xl sm:p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-signal-gold">{setupData.teamB || "Team B"}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          setupData.squadB.length === MAX_SQUAD_LIMIT ? "bg-pitch-green/20 text-pitch-green" : "bg-panel text-fg-muted"
                        }`}>
                          {setupData.squadB.length}/{MAX_SQUAD_LIMIT}
                        </span>
                      </div>
                      {setupData.squadB.length < MAX_SQUAD_LIMIT && (
                        <button
                          type="button"
                          onClick={() => handleAutoFillSquad("B")}
                          className="flex items-center gap-1 rounded-lg border border-signal-gold/40 bg-signal-gold/10 px-2 py-1 text-[10px] font-bold text-signal-gold transition-colors hover:bg-signal-gold/20"
                        >
                          <Sparkles size={11} /> Auto-Fill (11)
                        </button>
                      )}
                    </div>

                    {setupData.squadB.length < MAX_SQUAD_LIMIT ? (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={playerInputB.name}
                            onChange={(e) => setPlayerInputB({ ...playerInputB, name: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && addPlayer("B")}
                            placeholder="Player Name"
                            className="min-h-[42px] w-full rounded-xl border border-border bg-panel p-2.5 text-sm text-fg outline-none focus:border-signal-gold"
                          />
                          <select
                            value={playerInputB.role}
                            onChange={(e) => setPlayerInputB({ ...playerInputB, role: e.target.value })}
                            className="min-h-[42px] shrink-0 rounded-xl border border-border bg-panel p-2.5 text-xs text-fg outline-none"
                          >
                            {currentRoles.map((role) => (
                              <option key={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="flex gap-3 text-xs">
                            <label className="flex cursor-pointer items-center gap-1 text-fg-muted hover:text-fg">
                              <input
                                type="checkbox"
                                checked={playerInputB.isCaptain}
                                onChange={(e) => setPlayerInputB({ ...playerInputB, isCaptain: e.target.checked })}
                                className="rounded border-border text-signal-gold"
                              />
                              <Crown size={13} className="text-signal-gold" /> Capt
                            </label>
                            {isCricket && (
                              <label className="flex cursor-pointer items-center gap-1 text-fg-muted hover:text-fg">
                                <input
                                  type="checkbox"
                                  checked={playerInputB.isWicketKeeper}
                                  onChange={(e) => setPlayerInputB({ ...playerInputB, isWicketKeeper: e.target.checked })}
                                  className="rounded border-border text-signal-gold"
                                />
                                <Shield size={13} className="text-pitch-green" /> WK
                              </label>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addPlayer("B")}
                            className="rounded-xl bg-signal-gold px-4 py-2 text-xs font-bold text-ink transition-colors hover:opacity-90"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-pitch-green/30 bg-pitch-green/10 p-2.5 text-center text-xs font-bold text-pitch-green">
                        ✓ Squad Complete (11 Players Added)
                      </div>
                    )}

                    <ul className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1 text-xs">
                      {setupData.squadB.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-panel p-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-fg">{p.name}</span>
                            <span className="rounded bg-panel-raised px-1.5 py-0.5 text-[9px] text-fg-muted">{p.role}</span>
                            {p.isCaptain && <span className="text-[10px] font-bold text-signal-gold">(C)</span>}
                            {p.isWicketKeeper && <span className="text-[10px] font-bold text-pitch-green">(WK)</span>}
                          </div>
                          <button onClick={() => removePlayer("B", p.id)} className="p-1 text-crimson hover:opacity-80">
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3 (CRICKET ONLY) */}
            {isCricket && step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-lg font-bold text-fg">3. Match Configuration</h2>
                  <span className="text-xs font-bold text-crimson">* All fields required</span>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-ink p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-fg-muted">
                    Total Overs Per Innings *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OVERS_PRESETS.map((overs) => (
                      <button
                        type="button"
                        key={overs}
                        onClick={() => {
                          setSetupData((prev) => ({ ...prev, maxOvers: overs }));
                          setCustomOvers(false);
                        }}
                        className={`min-h-[42px] flex-1 rounded-lg border font-bold text-xs transition-colors ${
                          !customOvers && setupData.maxOvers === overs
                            ? "border-electric bg-electric text-white shadow-md shadow-electric/25"
                            : "border-border bg-panel text-fg-muted hover:bg-panel-raised"
                        }`}
                      >
                        {overs}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCustomOvers(true)}
                      className={`min-h-[42px] flex-1 rounded-lg border font-bold text-xs transition-colors ${
                        customOvers ? "border-electric bg-electric text-white" : "border-border bg-panel text-fg-muted hover:bg-panel-raised"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  {customOvers && (
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={setupData.maxOvers || ""}
                      onChange={(e) => setSetupData((prev) => ({ ...prev, maxOvers: Number(e.target.value) }))}
                      placeholder="Enter overs (e.g. 8)"
                      className="min-h-[42px] w-full rounded-lg border border-electric/40 bg-panel p-2.5 text-xs text-fg outline-none focus:border-electric"
                    />
                  )}
                </div>

                {/* 🛡️ টস উইনার বদলালে ওপেনার রিসেট */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-fg-muted">
                    Who won the toss? *
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSetupData((prev) => ({ 
                        ...prev, 
                        toss: { ...prev.toss, winner: "teamA" },
                        openers: { striker: "", nonStriker: "", bowler: "" }
                      }))}
                      className={`min-h-[48px] flex-1 rounded-xl border-2 font-bold text-sm transition-all ${
                        setupData.toss.winner === "teamA" ? "border-electric bg-electric/20 text-electric" : "border-border bg-ink text-fg-faint"
                      }`}
                    >
                      {setupData.teamA || "Team A"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupData((prev) => ({ 
                        ...prev, 
                        toss: { ...prev.toss, winner: "teamB" },
                        openers: { striker: "", nonStriker: "", bowler: "" }
                      }))}
                      className={`min-h-[48px] flex-1 rounded-xl border-2 font-bold text-sm transition-all ${
                        setupData.toss.winner === "teamB" ? "border-signal-gold bg-signal-gold/20 text-signal-gold" : "border-border bg-ink text-fg-faint"
                      }`}
                    >
                      {setupData.teamB || "Team B"}
                    </button>
                  </div>
                </div>

                {/* 🛡️ টস ডিসিশন বদলালেও ওপেনার রিসেট */}
                {setupData.toss.winner && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-fg-muted">
                      Decision? *
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setSetupData((prev) => ({ 
                          ...prev, 
                          toss: { ...prev.toss, decision: "bat" },
                          openers: { striker: "", nonStriker: "", bowler: "" }
                        }))}
                        className={`min-h-[48px] flex-1 rounded-xl border-2 font-bold text-sm transition-all ${
                          setupData.toss.decision === "bat" ? "border-signal-gold bg-signal-gold/20 text-signal-gold" : "border-border bg-ink text-fg-faint"
                        }`}
                      >
                        BAT FIRST
                      </button>
                      <button
                        type="button"
                        onClick={() => setSetupData((prev) => ({ 
                          ...prev, 
                          toss: { ...prev.toss, decision: "bowl" },
                          openers: { striker: "", nonStriker: "", bowler: "" }
                        }))}
                        className={`min-h-[48px] flex-1 rounded-xl border-2 font-bold text-sm transition-all ${
                          setupData.toss.decision === "bowl" ? "border-electric bg-electric/20 text-electric" : "border-border bg-ink text-fg-faint"
                        }`}
                      >
                        BOWL FIRST
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 4: SELECT OPENERS */}
            {isCricket && step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-lg font-bold text-fg">4. Select Openers</h2>
                  <span className="text-xs font-bold text-crimson">* Required</span>
                </div>
                <div className="space-y-5">
                  <div className="space-y-3 rounded-xl border border-border bg-ink p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-electric">
                      Batting Team ({battingTeamKey === "teamA" ? setupData.teamA : setupData.teamB})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-fg-faint">Striker *</label>
                        <select
                          value={setupData.openers.striker}
                          onChange={(e) => {
                            const newStriker = e.target.value;
                            setSetupData((prev) => ({
                              ...prev,
                              openers: {
                                ...prev.openers,
                                striker: newStriker,
                                nonStriker: prev.openers.nonStriker === newStriker ? "" : prev.openers.nonStriker,
                              },
                            }));
                          }}
                          className="min-h-[44px] w-full rounded-lg border border-border bg-panel p-2.5 text-xs text-fg outline-none"
                        >
                          <option value="">Select Striker...</option>
                          {battingSquad.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.isCaptain ? "(C)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-fg-faint">Non-Striker *</label>
                        <select
                          value={setupData.openers.nonStriker}
                          onChange={(e) => setSetupData((prev) => ({ ...prev, openers: { ...prev.openers, nonStriker: e.target.value } }))}
                          className="min-h-[44px] w-full rounded-lg border border-border bg-panel p-2.5 text-xs text-fg outline-none"
                        >
                          <option value="">Select Non-Striker...</option>
                          {battingSquad
                            .filter((p) => p.id !== setupData.openers.striker)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.isCaptain ? "(C)" : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-ink p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-signal-gold">
                      Bowling Team ({bowlingTeamKey === "teamA" ? setupData.teamA : setupData.teamB})
                    </h3>
                    <div>
                      <label className="mb-1 block text-xs text-fg-faint">Opening Bowler *</label>
                      <select
                        value={setupData.openers.bowler}
                        onChange={(e) => setSetupData((prev) => ({ ...prev, openers: { ...prev.openers, bowler: e.target.value } }))}
                        className="min-h-[44px] w-full rounded-lg border border-border bg-panel p-2.5 text-xs text-fg outline-none"
                      >
                        <option value="">Select Bowler...</option>
                        {bowlingSquad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.isCaptain ? "(C)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="sticky bottom-0 z-20 mt-6 flex justify-between gap-3 rounded-2xl border border-border/60 bg-ink/90 p-3 shadow-xl backdrop-blur-lg sm:static sm:bg-transparent sm:p-0 sm:border-0">
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-panel px-4 py-2.5 text-xs font-bold text-fg-muted transition-all hover:bg-panel-raised hover:text-fg disabled:opacity-50 sm:min-h-[48px] sm:px-5 sm:py-3"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled()}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-electric px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-electric/20 transition-all hover:opacity-90 disabled:opacity-40 sm:min-h-[48px] sm:px-6 sm:py-3"
            >
              Next Step <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartMatch}
              disabled={loading || isNextDisabled()}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-pitch-green px-6 py-2.5 text-xs font-bold text-ink shadow-lg shadow-pitch-green/20 transition-all hover:opacity-90 disabled:opacity-40 sm:min-h-[48px] sm:px-7 sm:py-3"
            >
              {loading ? "Starting..." : "Start Match"} <Trophy size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}