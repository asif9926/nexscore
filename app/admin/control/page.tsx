"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { useCricketScoring } from "@/lib/hooks/useCricketScoring";
import { useFootballScoring } from "@/lib/hooks/useFootballScoring";
import { undoLastAction } from "@/lib/firebase/actions";
import { auth } from "@/lib/firebase/client";
import { useToast } from "@/lib/context/ToastContext";
import { 
  RotateCcw, 
  Activity, 
  Goal, 
  Play, 
  Pause, 
  Minus, 
  Target, 
  Gamepad2, 
  Tv2,
  ArrowLeftRight,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import WicketModal from "@/components/admin/WicketModal";
import ExtrasModal from "@/components/admin/ExtrasModal";
import NewBowlerModal from "@/components/admin/NewBowlerModal";
import InningsBreakModal from "@/components/admin/InningsBreakModal";
import FootballGoalModal from "@/components/admin/FootballGoalModal";
import FootballCardModal from "@/components/admin/FootballCardModal";
import BroadcastControls from "@/components/admin/BroadcastControls";
import OverlayLinksCard from "@/components/admin/OverlayLinksCard";
import RecentBallsTimeline from "@/components/public-view/RecentBallsTimeline";

export default function ControlDashboard() {
  const { matchData, loading } = useMatchData();
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"scoring" | "broadcast">("scoring");
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Football Modals State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedFootballTeam, setSelectedFootballTeam] = useState<"A" | "B">("A");
  const [selectedCardType, setSelectedCardType] = useState<"yellow" | "red">("yellow");

  // Scoring Hooks
  const cricketScoring = useCricketScoring(matchData);
  const footballScoring = useFootballScoring(matchData);

  const {
    currentInnings,
    battingTeamKey,
    bowlingTeamKey,
    battingTeamName,
    bowlingTeamName,
    battingSquad,
    bowlingSquad,
    activeBatsmen,
    availableBatsmen,
    activeBowlerObj,
    isWicketModalOpen,
    setIsWicketModalOpen,
    isExtrasModalOpen,
    setIsExtrasModalOpen,
    isNewBowlerModalOpen,
    setIsNewBowlerModalOpen,
    isInningsBreakModalOpen,
    setIsInningsBreakModalOpen,
    handleRuns,
    handleSwapStrike,
    confirmWicket,
    confirmExtras,
    confirmNewBowler,
    startSecondInnings,
  } = cricketScoring;

  const {
    footballClock,
    handleToggleTimer,
    handleHalfChange,
    recordGoalWithDetails,
    recordCardWithDetails,
    handlePossessionAdjust,
  } = footballScoring;

  const isCricketSport = matchData?.meta?.sport === "cricket";
  const isProcessing = isCricketSport ? cricketScoring.isProcessing : footballScoring.isProcessing;

  // Global Keyboard & Numpad Shortcuts Listener
  useEffect(() => {
    const isAnyModalOpen =
      isWicketModalOpen ||
      isExtrasModalOpen ||
      isNewBowlerModalOpen ||
      isInningsBreakModalOpen ||
      isGoalModalOpen ||
      isCardModalOpen;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement).tagName;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(targetTag)) return;

      if (isProcessing) return;

      // Undo shortcut (Ctrl + Z / Cmd + Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoLastAction();
        return;
      }

      // Close modal on Escape
      if (e.key === "Escape") {
        if (isWicketModalOpen) setIsWicketModalOpen(false);
        if (isExtrasModalOpen) setIsExtrasModalOpen(false);
        if (isNewBowlerModalOpen) setIsNewBowlerModalOpen(false);
        if (isGoalModalOpen) setIsGoalModalOpen(false);
        if (isCardModalOpen) setIsCardModalOpen(false);
        return;
      }

      if (isAnyModalOpen || currentInnings?.isCompleted) return;

      // Cricket Scoring Shortcuts
      if (matchData?.meta?.sport === "cricket") {
        if (["0", "1", "2", "3", "4", "5", "6"].includes(e.key)) {
          e.preventDefault();
          handleRuns(Number(e.key));
        } else if (e.key.toLowerCase() === "w") {
          e.preventDefault();
          setIsWicketModalOpen(true);
        } else if (e.key.toLowerCase() === "e") {
          e.preventDefault();
          setIsExtrasModalOpen(true);
        }
      }

      // Football Timer Toggle Shortcut (Spacebar)
      if (matchData?.meta?.sport === "football") {
        if (e.code === "Space") {
          e.preventDefault();
          handleToggleTimer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isProcessing,
    matchData?.meta?.sport,
    currentInnings?.isCompleted,
    isWicketModalOpen,
    isExtrasModalOpen,
    isNewBowlerModalOpen,
    isInningsBreakModalOpen,
    isGoalModalOpen,
    isCardModalOpen,
    handleRuns,
    handleToggleTimer,
    setIsWicketModalOpen,
    setIsExtrasModalOpen,
    setIsNewBowlerModalOpen,
  ]);

  if (loading)
    return <div className="mt-20 animate-pulse text-center text-fg-muted">Loading Live Dashboard...</div>;

  if (!matchData || !matchData.meta)
    return (
      <div className="mt-20 rounded-2xl border border-border bg-panel p-8 text-center text-crimson">
        No active match found. Please start a new match from the Dashboard.
      </div>
    );

  const { meta, cricket, football } = matchData;

  const handleFinalizeMatch = async () => {
    if (!confirm("Are you sure you want to end this match and archive it?")) return;
    setIsFinalizing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        showToast("Session expired. Please log in again.", "error");
        router.push("/admin/login");
        return;
      }

      const res = await fetch("/api/match/finalize", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast("Match archived successfully!", "success");
        router.push("/admin/setup");
      } else {
        showToast(data.error || "Failed to finalize match.", "error");
      }
    } catch {
      showToast("Failed to finalize match.", "error");
    } finally {
      setIsFinalizing(false);
    }
  };

  const oversToDecimal = (oversStr?: string) => {
    if (!oversStr) return 0;
    const [o, b] = oversStr.split(".").map(Number);
    return (o || 0) + (b || 0) / 6;
  };

  const currentRunRate = currentInnings
    ? oversToDecimal(currentInnings.overs) > 0
      ? (currentInnings.score / oversToDecimal(currentInnings.overs)).toFixed(2)
      : "0.00"
    : "0.00";

  const strikerBatsman = activeBatsmen.find((b) => b.onStrike);
  const nonStrikerBatsman = activeBatsmen.find((b) => !b.onStrike);
  const bowlerEconomy = activeBowlerObj
    ? oversToDecimal(activeBowlerObj.overs) > 0
      ? (activeBowlerObj.runs / oversToDecimal(activeBowlerObj.overs)).toFixed(2)
      : "0.00"
    : "0.00";

  const openGoalModal = (team: "A" | "B") => {
    setSelectedFootballTeam(team);
    setIsGoalModalOpen(true);
  };

  const openCardModal = (team: "A" | "B", type: "yellow" | "red") => {
    setSelectedFootballTeam(team);
    setSelectedCardType(type);
    setIsCardModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Cricket Modals */}
      {meta.sport === "cricket" && (
        <>
          <WicketModal
            isOpen={isWicketModalOpen}
            onClose={() => setIsWicketModalOpen(false)}
            onConfirm={confirmWicket}
            activeBatsmen={activeBatsmen}
            availableBatsmen={availableBatsmen}
          />
          <ExtrasModal isOpen={isExtrasModalOpen} onClose={() => setIsExtrasModalOpen(false)} onConfirm={confirmExtras} />
          <NewBowlerModal
            isOpen={isNewBowlerModalOpen}
            onClose={() => setIsNewBowlerModalOpen(false)}
            onConfirm={confirmNewBowler}
            bowlingSquad={bowlingSquad}
            activeBowlerId={activeBowlerObj?.id}
            isMandatory={currentInnings?.overs?.endsWith(".0") && currentInnings?.overs !== "0.0"}
          />
          <InningsBreakModal
            isOpen={isInningsBreakModalOpen}
            targetScore={(currentInnings?.score || 0) + 1}
            chasingTeamName={bowlingTeamKey === "teamA" ? meta.teamA : meta.teamB}
            defendingTeamName={battingTeamKey === "teamA" ? meta.teamA : meta.teamB}
            chasingSquad={bowlingSquad}
            defendingSquad={battingSquad}
            onStartSecondInnings={startSecondInnings}
          />
        </>
      )}

      {/* Football Modals */}
      {meta.sport === "football" && (
        <>
          <FootballGoalModal
            isOpen={isGoalModalOpen}
            onClose={() => setIsGoalModalOpen(false)}
            onConfirm={(details) => recordGoalWithDetails(selectedFootballTeam, details)}
            teamName={selectedFootballTeam === "A" ? meta.teamA : meta.teamB}
            squad={selectedFootballTeam === "A" ? football?.squads?.teamA || [] : football?.squads?.teamB || []}
            currentMinute={footballClock.minute}
          />
          <FootballCardModal
            isOpen={isCardModalOpen}
            onClose={() => setIsCardModalOpen(false)}
            onConfirm={(details) => recordCardWithDetails(selectedFootballTeam, details)}
            teamName={selectedFootballTeam === "A" ? meta.teamA : meta.teamB}
            squad={selectedFootballTeam === "A" ? football?.squads?.teamA || [] : football?.squads?.teamB || []}
            defaultCardType={selectedCardType}
            currentMinute={footballClock.minute}
          />
        </>
      )}

      {/* ================= PERSISTENT LIVE SCORE HEADER ================= */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-4 shadow-lg sm:p-5">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-electric via-pitch-green to-electric" />

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-fg sm:text-xl">
              {meta.teamA} <span className="text-xs text-fg-faint sm:text-sm">vs</span> {meta.teamB}
            </h2>
            {meta.sport === "cricket" && battingTeamName ? (
              <p className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-electric/20 bg-electric/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-electric">
                🏏 {battingTeamName} batting
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-fg-muted">
                <Activity size={12} className="text-pitch-green" />
                <span className="capitalize">{meta.sport}</span>
              </p>
            )}
          </div>

          <div className="flex items-baseline gap-3 shrink-0 text-right">
            {meta.sport === "cricket" ? (
              <div className="flex items-center gap-3">
                <div className="font-score text-3xl font-black text-fg sm:text-5xl">
                  {currentInnings?.score || 0}
                  <span className="mx-0.5 text-xl text-fg-faint">/</span>
                  {currentInnings?.wickets || 0}
                </div>
                <div className="text-left border-l border-border pl-2.5 text-xs">
                  <div className="font-bold text-fg">
                    {currentInnings?.overs || "0.0"}{" "}
                    <span className="text-[10px] text-fg-faint font-normal">/ {cricket?.maxOvers} ov</span>
                  </div>
                  <div className="text-[10px] font-semibold text-fg-muted">CRR {currentRunRate}</div>
                  {cricket?.currentInnings === 2 && currentInnings?.target && (
                    <div className="text-[10px] font-bold text-signal-gold">Target: {currentInnings.target}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="font-score text-3xl font-black text-fg sm:text-5xl">
                  {football?.scoreA || 0} - {football?.scoreB || 0}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-pitch-green">{football?.half || "1ST HALF"}</span>
                  <button
                    onClick={handleToggleTimer}
                    disabled={isProcessing}
                    className={`mt-0.5 flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs font-bold transition-colors ${
                      football?.isRunning
                        ? "border border-pitch-green/40 bg-pitch-green/20 text-pitch-green"
                        : "border border-border bg-ink text-fg"
                    }`}
                  >
                    {football?.isRunning ? <Pause size={10} /> : <Play size={10} />}
                    {footballClock.display}'
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Striker / Non-Striker Row with Strike Swap */}
        {meta.sport === "cricket" && (strikerBatsman || nonStrikerBatsman) && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-ink/60 p-2 text-xs">
            <div className="truncate flex-1">
              <span className="text-electric font-black">▶</span>{" "}
              <span className="font-bold text-fg">{strikerBatsman?.name || "—"}</span>
              <span className="ml-1 text-fg-muted">{strikerBatsman ? `${strikerBatsman.runs}*(${strikerBatsman.balls})` : ""}</span>
            </div>

            <button
              onClick={handleSwapStrike}
              disabled={isProcessing || activeBatsmen.length < 2}
              title="Swap Strike (ম্যানুয়ালি স্ট্রাইক অদলবদল)"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-[11px] font-bold text-signal-gold transition-all hover:bg-panel-raised active:scale-95 disabled:opacity-40"
            >
              <ArrowLeftRight size={12} />
              <span>Swap</span>
            </button>

            <div className="truncate flex-1 text-right">
              <span className="font-medium text-fg">{nonStrikerBatsman?.name || "—"}</span>
              <span className="ml-1 text-fg-muted">{nonStrikerBatsman ? `${nonStrikerBatsman.runs}(${nonStrikerBatsman.balls})` : ""}</span>
            </div>
          </div>
        )}

        {meta.sport === "cricket" && currentInnings?.recentBalls && currentInnings.recentBalls.length > 0 && (
          <div className="border-t border-border/60 pt-2.5 mt-2.5">
            <RecentBallsTimeline
              balls={currentInnings.recentBalls}
              overs={currentInnings.overs || "0.0"}
            />
          </div>
        )}
      </div>

      {/* ================= SEGMENTED TAB SWITCHER ================= */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-panel p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab("scoring")}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "scoring"
              ? "bg-electric text-white shadow-md shadow-electric/25"
              : "text-fg-muted hover:text-fg hover:bg-panel-raised"
          }`}
        >
          <Gamepad2 size={16} />
          <span>Scorer Console</span>
          {meta.sport === "cricket" && (
            <span className={`hidden sm:inline rounded px-1.5 py-0.5 text-[9px] font-mono ${
              activeTab === "scoring" ? "bg-white/20 text-white" : "bg-ink text-fg-faint"
            }`}>
              Hotkeys Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("broadcast")}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "broadcast"
              ? "bg-signal-gold text-ink shadow-md shadow-signal-gold/25"
              : "text-fg-muted hover:text-fg hover:bg-panel-raised"
          }`}
        >
          <Tv2 size={16} />
          <span>Broadcast &amp; OBS</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
            activeTab === "broadcast" ? "bg-ink text-signal-gold" : "border border-signal-gold/30 text-signal-gold"
          }`}>
            PCR
          </span>
        </button>
      </div>

      {/* ================= TAB CONTENT ================= */}
      <AnimatePresence mode="wait">
        {/* TAB 1: SCORER CONSOLE */}
        {activeTab === "scoring" && (
          <motion.div
            key="tab-scoring"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border bg-panel p-4 shadow-lg sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-fg">Fast Actions</h3>
                  <span className="hidden rounded border border-border/80 bg-ink px-1.5 py-0.5 text-[10px] font-medium text-fg-faint sm:inline">
                    Numpad [0-6]
                  </span>
                </div>
                <button
                  onClick={undoLastAction}
                  disabled={isProcessing}
                  className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-border bg-ink px-3 py-1.5 text-xs font-semibold text-fg-muted hover:bg-panel-raised disabled:opacity-50"
                >
                  <RotateCcw size={14} /> Undo <kbd className="hidden font-mono text-[9px] text-fg-faint sm:inline">[Ctrl+Z]</kbd>
                </button>
              </div>

              {meta.sport === "cricket" ? (
                <>
                  <div className="mb-3 grid grid-cols-4 gap-2.5 sm:grid-cols-7">
                    {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                      <button
                        key={run}
                        onClick={() => handleRuns(run)}
                        disabled={isProcessing || currentInnings?.isCompleted}
                        className="relative min-h-[52px] rounded-xl border border-border bg-ink font-score text-2xl text-fg transition-all active:scale-90 active:bg-electric/20 disabled:opacity-50 hover:border-electric/40"
                      >
                        {run}
                        <span className="absolute bottom-1 right-1.5 hidden font-sans text-[9px] font-bold text-fg-faint sm:inline">
                          [{run}]
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsWicketModalOpen(true)}
                      disabled={isProcessing || currentInnings?.isCompleted}
                      className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-crimson/40 bg-crimson/15 text-sm font-bold text-crimson transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span>WICKET (OUT)</span>
                      <kbd className="hidden rounded bg-crimson/20 px-1.5 py-0.5 text-[10px] font-mono sm:inline">[W]</kbd>
                    </button>
                    <button
                      onClick={() => setIsExtrasModalOpen(true)}
                      disabled={isProcessing || currentInnings?.isCompleted}
                      className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-electric/40 bg-electric/15 text-sm font-bold text-electric transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span>EXTRAS</span>
                      <kbd className="hidden rounded bg-electric/20 px-1.5 py-0.5 text-[10px] font-mono sm:inline">[E]</kbd>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-center gap-2 rounded-xl border border-border bg-ink p-2">
                    {["1ST HALF", "HALF TIME", "2ND HALF", "FULL TIME"].map((half) => (
                      <button
                        key={half}
                        onClick={() => handleHalfChange(half)}
                        className={`min-h-[38px] flex-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                          football?.half === half
                            ? "bg-pitch-green text-ink shadow-md shadow-pitch-green/20"
                            : "bg-panel text-fg-muted hover:text-fg"
                        }`}
                      >
                        {half}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Team A Actions */}
                    <div className="space-y-2.5 rounded-xl border border-border bg-ink/40 p-3.5">
                      <div className="text-center text-xs font-bold uppercase tracking-wider text-electric">{meta.teamA}</div>
                      <button
                        onClick={() => openGoalModal("A")}
                        disabled={isProcessing}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-pitch-green/50 bg-pitch-green/20 text-base font-bold text-pitch-green active:scale-95 disabled:opacity-50"
                      >
                        <Goal size={20} /> GOAL (+)
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCardModal("A", "yellow")}
                          disabled={isProcessing}
                          className="min-h-[38px] flex-1 rounded-lg border border-signal-gold/30 bg-signal-gold/10 text-xs font-bold text-signal-gold"
                        >
                          Yellow
                        </button>
                        <button
                          onClick={() => openCardModal("A", "red")}
                          disabled={isProcessing}
                          className="min-h-[38px] flex-1 rounded-lg border border-crimson/30 bg-crimson/10 text-xs font-bold text-crimson"
                        >
                          Red
                        </button>
                      </div>
                    </div>

                    {/* Team B Actions */}
                    <div className="space-y-2.5 rounded-xl border border-border bg-ink/40 p-3.5">
                      <div className="text-center text-xs font-bold uppercase tracking-wider text-pitch-green">{meta.teamB}</div>
                      <button
                        onClick={() => openGoalModal("B")}
                        disabled={isProcessing}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-pitch-green/50 bg-pitch-green/20 text-base font-bold text-pitch-green active:scale-95 disabled:opacity-50"
                      >
                        <Goal size={20} /> GOAL (+)
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCardModal("B", "yellow")}
                          disabled={isProcessing}
                          className="min-h-[38px] flex-1 rounded-lg border border-signal-gold/30 bg-signal-gold/10 text-xs font-bold text-signal-gold"
                        >
                          Yellow
                        </button>
                        <button
                          onClick={() => openCardModal("B", "red")}
                          disabled={isProcessing}
                          className="min-h-[38px] flex-1 rounded-lg border border-crimson/30 bg-crimson/10 text-xs font-bold text-crimson"
                        >
                          Red
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Bowler Card with Quick Change Button */}
            {meta.sport === "cricket" ? (
              <div className="rounded-2xl border border-border bg-panel p-4 shadow-lg sm:p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-faint">
                    <Target size={13} /> Active Bowler ({bowlingTeamName})
                  </h3>
                  <button
                    onClick={() => setIsNewBowlerModalOpen(true)}
                    className="flex items-center gap-1 rounded-lg border border-electric/40 bg-electric/10 px-2 py-1 text-[10px] font-bold text-electric hover:bg-electric/20"
                  >
                    <UserPlus size={12} />
                    <span>Change Bowler</span>
                  </button>
                </div>

                {activeBowlerObj ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="truncate text-base font-bold text-fg">{activeBowlerObj.name}</div>
                      <div className="mt-0.5 text-xs text-fg-muted">
                        Econ {bowlerEconomy} • Maidens: {activeBowlerObj.maidens || 0}
                      </div>
                    </div>
                    <div className="font-score text-2xl font-bold text-pitch-green">
                      {activeBowlerObj.wickets}-{activeBowlerObj.runs}{" "}
                      <span className="font-sans text-xs text-fg-muted">({activeBowlerObj.overs} ov)</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-fg-muted">কোনো বোলার সিলেক্ট করা নেই।</p>
                )}
              </div>
            ) : (
              football && (
                <div className="rounded-xl border border-border bg-panel p-4 shadow-lg">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-fg-faint">
                    <span>Possession</span>
                    <span>{football.currentHalf === 2 ? "2nd Half" : "1st Half"}</span>
                  </div>
                  {(() => {
                    const halfData = football.currentHalf === 2 ? football.half2 : football.half1;
                    const possession = halfData?.possession || { teamA: 50, teamB: 50 };
                    return (
                      <>
                        <div className="mb-2 flex items-center gap-2">
                          <button
                            onClick={() => handlePossessionAdjust("A", -5)}
                            disabled={isProcessing}
                            className="min-h-[34px] min-w-[34px] rounded-md bg-ink p-1 text-fg-muted"
                          >
                            <Minus size={12} />
                          </button>
                          <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-ink">
                            <div className="h-full bg-pitch-green transition-all" style={{ width: `${possession.teamA}%` }} />
                            <div className="h-full bg-electric transition-all" style={{ width: `${possession.teamB}%` }} />
                          </div>
                          <button
                            onClick={() => handlePossessionAdjust("B", -5)}
                            disabled={isProcessing}
                            className="min-h-[34px] min-w-[34px] rounded-md bg-ink p-1 text-fg-muted"
                          >
                            <Minus size={12} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-pitch-green">{meta.teamA}: {possession.teamA}%</span>
                          <span className="text-electric">{meta.teamB}: {possession.teamB}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )
            )}

            {/* END MATCH & ARCHIVE BUTTON INSIDE SCORER CONSOLE */}
            <div className="rounded-2xl border border-border bg-panel p-4 shadow-lg">
              <button
                onClick={handleFinalizeMatch}
                disabled={isFinalizing || isProcessing}
                className="min-h-[48px] w-full rounded-xl border border-crimson/50 bg-crimson/20 py-3 text-xs font-bold uppercase tracking-widest text-crimson transition-all hover:bg-crimson/30 disabled:opacity-50"
              >
                {isFinalizing ? "Archiving Match..." : "End Match & Archive"}
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 2: BROADCAST & OBS */}
        {activeTab === "broadcast" && (
          <motion.div
            key="tab-broadcast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <BroadcastControls
              sport={meta.sport}
              showScoreboard={meta.showScoreboard !== false}
              showLogo={meta.showLogo !== false}
              activeGraphic={meta.activeGraphic || "LOWER_THIRD"}
              activeTheme={meta.activeTheme}
              customLogoUrl={meta.customLogoUrl}
            />

            <OverlayLinksCard sport={meta.sport} theme={meta.activeTheme} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}