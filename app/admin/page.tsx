// app/admin/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ref, get, set } from "firebase/database";
import { rtdb, auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Trophy, 
  Radio, 
  ArrowRight, 
  Activity, 
  Calendar, 
  Trash2, 
  Eye, 
  Home, 
  RefreshCw,
  UserCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { deleteMatchAction } from "./actions";
import { useToast } from "@/lib/context/ToastContext";

export default function AdminDashboardHome() {
  const { showToast } = useToast();

  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [activeMatch, setActiveMatch] = useState<{ id: string; data: any } | null>(null);
  const [activeMatchLoading, setActiveMatchLoading] = useState(true);

  const [history, setHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentAdmin(user);
      if (user) {
        await checkMyActiveMatch(user.uid);
        await loadMyHistory(user.uid);
      } else {
        setActiveMatchLoading(false);
        setFetchingHistory(false);
      }
    });
    return () => unsub();
  }, []);

  // 🛡️ অ্যাডমিনের অ্যাক্টিভ ম্যাচ চেক ও ডেড-পয়েন্টার অটো-ক্লিনআপ
  const checkMyActiveMatch = async (uid: string) => {
    setActiveMatchLoading(true);
    try {
      const activeMatchRef = ref(rtdb, `admin_active_matches/${uid}`);
      const activeMatchSnap = await get(activeMatchRef);

      if (activeMatchSnap.exists()) {
        const matchId = activeMatchSnap.val();
        if (matchId) {
          const matchDataSnap = await get(ref(rtdb, `matches/${matchId}`));
          if (matchDataSnap.exists() && matchDataSnap.val()?.meta?.status === "live") {
            setActiveMatch({ id: matchId, data: matchDataSnap.val() });
          } else {
            await set(activeMatchRef, null);
            setActiveMatch(null);
          }
        } else {
          setActiveMatch(null);
        }
      } else {
        setActiveMatch(null);
      }
    } catch (e) {
      console.error("Error loading active match:", e);
    } finally {
      setActiveMatchLoading(false);
    }
  };

  const loadMyHistory = async (uid?: string) => {
    const targetUid = uid || currentAdmin?.uid;
    if (!targetUid) return;

    setFetchingHistory(true);
    try {
      const res = await fetch(`/api/match/history?createdBy=${targetUid}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Server Error while loading archives.");
      const data = await res.json();
      if (data.success) {
        setHistory(data.matches || []);
      } else {
        showToast(data.error || "Failed to load archived matches.", "error");
      }
    } catch (err: any) {
      console.error("History fetch error:", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this match record?")) return;
    setDeletingId(id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await deleteMatchAction(id, idToken);
      if (res.success) {
        showToast("Match deleted successfully!", "success");
        setHistory((prev) => prev.filter((m) => m.id !== id));
      } else {
        showToast(res.error || "Failed to delete match.", "error");
      }
    } catch {
      showToast("Failed to delete match.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const isLive = Boolean(activeMatch);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-24 pt-6">
      {/* Header Info */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-electric/30 bg-electric/10 px-3 py-0.5 text-xs font-bold text-electric mb-2">
            <UserCheck size={13} />
            <span>Logged in as: {currentAdmin?.email || "Admin"}</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-fg sm:text-3xl md:text-4xl">
            Admin Control Panel
          </h1>
          <p className="text-xs font-medium text-fg-muted md:text-sm">
            Manage your personal live broadcast and digital scorecards.
          </p>
        </div>

        <a href="/">
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-panel px-5 py-2.5 text-xs font-bold text-fg shadow-md hover:bg-panel-raised sm:w-auto"
          >
            <Home size={16} className="text-electric" /> View Public Home
          </button>
        </a>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Start New Match */}
        <Link 
          href="/admin/setup"
          onClick={(e) => {
            if (isLive) {
              e.preventDefault();
              showToast("Your account already has an active live match! Please end it before starting another.", "error");
            }
          }}
          className="group block"
        >
          <motion.div 
            whileHover={{ y: -4 }}
            className="flex h-full flex-col justify-between rounded-3xl border border-border bg-panel p-6 shadow-md transition-colors group-hover:border-electric/50 sm:p-8"
          >
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-electric/20 bg-electric/10">
                <Trophy size={28} className="text-electric" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-fg">Start New Match</h2>
              <p className="mb-8 text-xs leading-relaxed text-fg-muted sm:text-sm">
                Configure teams, playing XI and match rules to launch your broadcast.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-electric">
              Setup Wizard <ArrowRight size={15} />
            </div>
          </motion.div>
        </Link>

        {/* Card 2: Personal Control Room */}
        <Link 
          href={isLive ? `/admin/control/${activeMatch?.id}` : "#"} 
          onClick={(e) => {
            if (!isLive) {
              e.preventDefault();
              showToast("No active live match found for your account. Please create one.", "info");
            }
          }}
          className={`group block ${!isLive && !activeMatchLoading ? "opacity-75" : ""}`}
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="relative h-full overflow-hidden rounded-3xl border border-border bg-panel p-6 shadow-md transition-all group-hover:border-crimson/50 sm:p-8"
          >
            {isLive && <div className="absolute left-0 top-0 h-1 w-full bg-crimson" />}
            <div className="mb-6 flex items-start justify-between">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isLive ? "bg-crimson/15" : "bg-panel-raised"}`}>
                <Radio size={28} className={isLive ? "text-crimson" : "text-fg-faint"} />
              </div>
              {isLive ? (
                <span className="flex animate-pulse items-center gap-1.5 rounded-full border border-crimson/30 bg-crimson/20 px-2.5 py-1 text-[11px] font-bold uppercase text-crimson">
                  <Activity size={12} /> Your Match is Live
                </span>
              ) : (
                <span className="rounded-full bg-panel-raised px-2.5 py-1 text-[11px] font-bold uppercase text-fg-faint">
                  No Active Match
                </span>
              )}
            </div>
            <h2 className="mb-2 text-xl font-bold text-fg">Your Control Room</h2>
            <p className="mb-6 text-xs text-fg-muted sm:text-sm">
              {isLive 
                ? `Scoring active for ${activeMatch?.data?.meta?.teamA} vs ${activeMatch?.data?.meta?.teamB}`
                : "Manage scoring, wickets, and overlays for your on-air match."}
            </p>
            <div className={`flex items-center gap-2 text-xs font-bold ${isLive ? "text-crimson" : "text-fg-faint"}`}>
              {isLive ? "Enter Control Room" : "No Live Match"} <ArrowRight size={15} />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Archives Section (Only My Matches) */}
      <div className="rounded-2xl border border-border bg-panel p-5 shadow-lg sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-fg sm:text-xl">
              <Calendar size={18} className="text-fg-muted" /> Your Completed Archives
            </h2>
            <p className="text-[11px] text-fg-muted mt-0.5">
              Only matches created and finalized by your account are listed here.
            </p>
          </div>
          <button
            onClick={() => loadMyHistory()}
            disabled={fetchingHistory}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-ink px-3 py-1.5 text-xs font-semibold text-fg-muted hover:text-fg"
          >
            <RefreshCw size={13} className={fetchingHistory ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {fetchingHistory ? (
          <div className="animate-pulse py-10 text-center text-xs text-fg-faint">Loading your archives...</div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-ink/50 py-10 text-center text-xs text-fg-faint">
            You have not finalized any matches yet. Matches you complete will appear here.
          </div>
        ) : (
          <div className="max-h-[450px] space-y-3 overflow-y-auto pr-1">
            {history.map((match) => (
              <div
                key={match.id}
                className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-ink p-4 md:flex-row md:items-center"
              >
                <div>
                  <div className="mb-1 text-xs font-bold text-fg-faint">
                    {new Date(match.completedAt).toLocaleDateString()} • <span className="capitalize text-electric">{match.sport}</span>
                  </div>
                  <div className="text-base font-bold text-fg">
                    {match.teamA} vs {match.teamB}
                  </div>
                  <div className="text-xs text-signal-gold font-medium mt-0.5">
                    {match.finalResult}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link href={`/match-history/${match.id}`} target="_blank">
                    <button className="flex min-h-[38px] items-center gap-1.5 rounded-lg bg-panel-raised px-3 py-1.5 text-xs font-bold text-fg-muted hover:text-fg">
                      <Eye size={14} /> View Scorecard
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(match.id)}
                    disabled={deletingId === match.id}
                    className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-crimson/20 bg-crimson/10 px-3 py-1.5 text-xs font-bold text-crimson hover:bg-crimson/20"
                  >
                    <Trash2 size={14} /> {deletingId === match.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}