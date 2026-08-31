"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMatchData } from "@/lib/context/MatchDataContext";
import { 
  Trophy, 
  Radio, 
  ArrowRight, 
  Activity, 
  Calendar, 
  Trash2, 
  Eye, 
  Home, 
  AlertTriangle, 
  RefreshCw 
} from "lucide-react";
import { useEffect, useState } from "react";
import { deleteMatchAction } from "./actions";
import { useToast } from "@/lib/context/ToastContext";
import { auth } from "@/lib/firebase/client";

export default function AdminDashboardHome() {
  const { matchData, loading } = useMatchData();
  const { showToast } = useToast();
  const isLive = matchData?.meta?.status === "live";

  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      // 🔒 সঠিক পাথ: /api/match/history
      const res = await fetch("/api/match/history", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.matches || []);
      } else {
        setFetchError(data.error || "Failed to load archived matches.");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setFetchError(err?.message || "Network error while loading matches.");
    } finally {
      // লোডিং স্টেট কখনোই আটকে থাকবে না
      setFetching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this match record? This action cannot be undone.")) return;

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

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-24 pt-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-2xl font-black uppercase tracking-wider text-fg sm:text-3xl md:text-4xl">Admin Dashboard</h1>
          <p className="text-sm font-medium text-fg-muted md:text-base">Manage live broadcasts and control match history.</p>
        </div>

        <Link href="/">
          <button className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-panel px-5 py-3 font-bold text-fg shadow-lg shadow-black/10 transition-all hover:bg-panel-raised sm:w-auto">
            <Home size={18} className="text-electric" /> View Public Home
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Start New Match */}
        <Link 
          href="/admin/setup"
          onClick={(e) => {
            if (isLive) {
              e.preventDefault();
              showToast("A match is already live! Please finish it before starting a new one.", "error");
            }
          }}
          className="group block"
        >
          <motion.div 
            whileHover={{ y: -4 }}
            className="flex h-full flex-col justify-between rounded-3xl border border-border bg-panel p-6 shadow-md transition-colors group-hover:border-electric/50 group-hover:shadow-xl group-hover:shadow-electric/10 sm:p-8"
          >
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-electric/20 bg-electric/10 transition-transform group-hover:scale-110 group-hover:bg-electric/20">
                <Trophy size={28} className="text-electric" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-fg">Start New Match</h2>
              <p className="mb-8 text-sm leading-relaxed text-fg-muted">
                Configure teams, playing XI, and rules to launch a new live broadcast.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-electric transition-all group-hover:gap-3">
              Setup Wizard <ArrowRight size={16} />
            </div>
          </motion.div>
        </Link>

        {/* Card 2: Control Room */}
        <Link href="/admin/control" className={`group block ${!isLive && !loading ? "opacity-75" : ""}`}>
          <motion.div
            whileHover={{ y: -5 }}
            className="relative h-full overflow-hidden rounded-2xl border border-border bg-panel p-6 shadow-lg transition-all group-hover:border-crimson/50"
          >
            {isLive && <div className="absolute left-0 top-0 h-1 w-full bg-crimson" />}
            <div className="mb-6 flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                  isLive ? "bg-crimson/15" : "bg-panel-raised"
                }`}
              >
                <Radio size={28} className={isLive ? "text-crimson" : "text-fg-faint"} />
              </div>
              {isLive ? (
                <span className="flex animate-pulse items-center gap-1.5 rounded-full border border-crimson/30 bg-crimson/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-crimson">
                  <Activity size={12} /> Live Now
                </span>
              ) : (
                <span className="rounded-full bg-panel-raised px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-fg-faint">
                  No Active Match
                </span>
              )}
            </div>
            <h2 className="mb-2 text-xl font-bold text-fg">Control Room</h2>
            <p className="mb-6 text-sm text-fg-muted">Manage scoring, wickets, cards, and broadcast overlays for the active match.</p>
            <div className={`flex items-center gap-2 text-sm font-bold transition-all group-hover:gap-3 ${isLive ? "text-crimson" : "text-fg-faint group-hover:text-fg-muted"}`}>
              Enter Control Room <ArrowRight size={16} />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Archived Matches Section */}
      <div className="rounded-2xl border border-border bg-panel p-5 shadow-lg sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-fg">
            <Calendar size={20} className="text-fg-muted" /> Archived Matches
          </h2>
          <button
            onClick={loadHistory}
            disabled={fetching}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-ink px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
          >
            <RefreshCw size={13} className={fetching ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {fetchError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-crimson/40 bg-crimson/10 p-3.5 text-xs text-crimson">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">Failed to load archived matches:</strong>
              <span>{fetchError}</span>
            </div>
          </div>
        )}

        {fetching ? (
          <div className="animate-pulse py-12 text-center font-medium text-fg-faint">Loading archives...</div>
        ) : history.length === 0 && !fetchError ? (
          <div className="rounded-xl border border-border/50 bg-ink/50 py-12 text-center text-fg-faint">
            No completed matches found in database. Complete a match from Control Room to see it here.
          </div>
        ) : (
          <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {history.map((match) => {
              const sport = match.sport || match.meta?.sport || "cricket";
              const teamA = match.teamA || match.meta?.teamA || "Team A";
              const teamB = match.teamB || match.meta?.teamB || "Team B";
              const dateStr = new Date(match.completedAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={match.id}
                  className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-ink p-4 transition-colors hover:border-fg-faint md:flex-row md:items-center"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold text-fg-faint">
                      {dateStr} • <span className="capitalize text-electric">{sport}</span>
                    </div>
                    <div className="text-lg font-bold text-fg">
                      {teamA} <span className="mx-1 font-normal text-fg-faint">vs</span> {teamB}
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-end gap-3 md:w-auto">
                    <Link href={`/match-history/${match.id}`} target="_blank">
                      <button className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-panel-raised px-3 py-1.5 text-xs font-bold text-fg-muted transition-colors hover:text-fg">
                        <Eye size={14} /> View
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(match.id)}
                      disabled={deletingId === match.id}
                      className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-crimson/20 bg-crimson/10 px-3 py-1.5 text-xs font-bold text-crimson transition-colors hover:bg-crimson/20 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> {deletingId === match.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}