// app/api/scorecard/[archiveId]/image/route.ts
import { ImageResponse } from "next/og";
import { adminFirestore } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";
import React from "react";
import { calculateMatchResult } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ archiveId: string }> }) {
  try {
    const { archiveId } = await params;
    if (!archiveId) {
      return new Response("Missing archiveId parameter", { status: 400 });
    }

    const docRef = await adminFirestore.collection("matches_history").doc(archiveId).get();
    if (!docRef.exists) {
      return new Response("Match archive not found", { status: 404 });
    }

    const match = docRef.data() as any;
    const isCricket = match.sport === "cricket" || match.meta?.sport === "cricket";
    
    const teamA = match.teamA || match.meta?.teamA || "Team A";
    const teamB = match.teamB || match.meta?.teamB || "Team B";
    const tournament = match.tournament || match.meta?.tournament || "Tournament Match";
    const venue = match.venue || match.meta?.venue ? ` • ${match.venue || match.meta?.venue}` : "";

    const cricketSnap = match.cricket || match.fullSnapshot?.cricket;
    const footballSnap = match.football || match.fullSnapshot?.football;

    // 🛡️ Fix #9: সেন্ট্রাল রেজাল্ট ইঞ্জিন ব্যবহার
    const resultText = calculateMatchResult(match.fullSnapshot || match);

    let inn1Score = "0/0", inn1Overs = "0.0", inn1Team = teamA;
    let inn2Score = "0/0", inn2Overs = "0.0", inn2Team = teamB;
    let footballScoreA = 0, footballScoreB = 0;

    if (isCricket && cricketSnap) {
      const inn1 = cricketSnap.innings1;
      const inn2 = cricketSnap.innings2;

      inn1Team = inn1?.battingTeam === "teamA" ? teamA : teamB;
      inn2Team = inn1?.battingTeam === "teamA" ? teamB : teamA;

      inn1Score = `${inn1?.score || 0}/${inn1?.wickets || 0}`;
      inn1Overs = inn1?.overs || "0.0";

      inn2Score = inn2 ? `${inn2.score || 0}/${inn2.wickets || 0}` : "DNB";
      inn2Overs = inn2?.overs || "0.0";
    } else if (footballSnap) {
      footballScoreA = footballSnap.scoreA || 0;
      footballScoreB = footballSnap.scoreB || 0;
    }

    const isMatchCompleted = match.finalResult && match.finalResult !== "Match Completed";
    const cacheHeader = isMatchCompleted
      ? "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable"
      : "public, max-age=60, s-maxage=60, stale-while-revalidate=300";

    return new ImageResponse(
      React.createElement(
        "div",
        {
          style: {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#06080F",
            backgroundImage: "radial-gradient(circle at 15% 15%, rgba(46,143,255,0.18), transparent 45%), radial-gradient(circle at 85% 85%, rgba(255,184,0,0.15), transparent 45%)",
            fontFamily: "sans-serif",
            padding: "50px 60px",
          },
        },
        [
          React.createElement(
            "div",
            { key: "header", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            [
              React.createElement(
                "div",
                { key: "brand", style: { display: "flex", alignItems: "center", gap: "10px" } },
                [
                  React.createElement("div", { key: "dot", style: { width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#2E8FFF" } }),
                  React.createElement("span", { key: "title", style: { color: "#EAEDF5", fontSize: "24px", fontWeight: "900", letterSpacing: "2px" } }, "NEXSCORE"),
                  React.createElement("span", { key: "tag", style: { color: "#8A92A6", fontSize: "16px", fontWeight: "700", marginLeft: "6px" } }, "OFFICIAL RESULT"),
                ]
              ),
              React.createElement(
                "span",
                { key: "tour", style: { color: "#8A92A6", fontSize: "18px", fontWeight: "700", textTransform: "uppercase" } },
                `${tournament}${venue}`
              ),
            ]
          ),

          React.createElement(
            "div",
            {
              key: "scoreboard",
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(16, 21, 34, 0.85)",
                border: "2px solid #1E2536",
                borderRadius: "28px",
                padding: "36px 48px",
              },
            },
            isCricket
              ? [
                  React.createElement(
                    "div",
                    { key: "t1", style: { display: "flex", flexDirection: "column", width: "42%" } },
                    [
                      React.createElement("span", { key: "t1n", style: { color: "#EAEDF5", fontSize: "32px", fontWeight: "900", marginBottom: "8px" } }, inn1Team),
                      React.createElement("span", { key: "t1s", style: { color: "#2E8FFF", fontSize: "64px", fontWeight: "900", lineHeight: 1 } }, inn1Score),
                      React.createElement("span", { key: "t1o", style: { color: "#8A92A6", fontSize: "20px", fontWeight: "700", marginTop: "8px" } }, `(${inn1Overs} Ov)`),
                    ]
                  ),
                  React.createElement(
                    "div",
                    {
                      key: "vs",
                      style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#161C2C",
                        border: "1px solid #1E2536",
                        borderRadius: "50%",
                        width: "60px",
                        height: "60px",
                        color: "#FFB800",
                        fontSize: "20px",
                        fontWeight: "900",
                      },
                    },
                    "VS"
                  ),
                  React.createElement(
                    "div",
                    { key: "t2", style: { display: "flex", flexDirection: "column", alignItems: "flex-end", width: "42%" } },
                    [
                      React.createElement("span", { key: "t2n", style: { color: "#EAEDF5", fontSize: "32px", fontWeight: "900", marginBottom: "8px" } }, inn2Team),
                      React.createElement("span", { key: "t2s", style: { color: "#FFB800", fontSize: "64px", fontWeight: "900", lineHeight: 1 } }, inn2Score),
                      React.createElement("span", { key: "t2o", style: { color: "#8A92A6", fontSize: "20px", fontWeight: "700", marginTop: "8px" } }, `(${inn2Overs} Ov)`),
                    ]
                  ),
                ]
              : [
                  React.createElement(
                    "div",
                    { key: "fa", style: { display: "flex", flexDirection: "column", alignItems: "center", width: "35%" } },
                    [
                      React.createElement("span", { key: "fan", style: { color: "#EAEDF5", fontSize: "36px", fontWeight: "900", textAlign: "center" } }, teamA),
                    ]
                  ),
                  React.createElement(
                    "div",
                    { key: "fscore", style: { display: "flex", alignItems: "baseline", color: "#10b981", fontSize: "80px", fontWeight: "900" } },
                    `${footballScoreA} - ${footballScoreB}`
                  ),
                  React.createElement(
                    "div",
                    { key: "fb", style: { display: "flex", flexDirection: "column", alignItems: "center", width: "35%" } },
                    [
                      React.createElement("span", { key: "fbn", style: { color: "#EAEDF5", fontSize: "36px", fontWeight: "900", textAlign: "center" } }, teamB),
                    ]
                  ),
                ]
          ),

          React.createElement(
            "div",
            {
              key: "result",
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 184, 0, 0.15)",
                border: "2px solid #FFB800",
                borderRadius: "20px",
                padding: "16px 24px",
              },
            },
            React.createElement(
              "span",
              {
                style: {
                  color: "#FFB800",
                  fontSize: "24px",
                  fontWeight: "900",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  textAlign: "center",
                },
              },
              resultText
            )
          ),
        ]
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": cacheHeader,
        },
      }
    );
  } catch (error) {
    console.error("Scorecard Image Route Error:", error);
    return new Response("Failed to generate scorecard image", { status: 500 });
  }
}