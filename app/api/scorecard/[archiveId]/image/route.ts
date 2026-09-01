// app/api/scorecard/[archiveId]/image/route.ts
import { ImageResponse } from "@vercel/og";
import { adminFirestore } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ archiveId: string }> }) {
  try {
    const { archiveId } = await params;
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

    // 🛡️ ১. ডেটাবেজে সংরক্ষিত অফিশিয়াল ফাইনাল রেজাল্টকে ১ নম্বর প্রাধান্য দেওয়া
    const savedResult = match.finalResult || match.fullSnapshot?.meta?.finalResult;
    let resultText = savedResult && savedResult !== "Match Completed" ? savedResult : "MATCH COMPLETED";

    let inn1Score = "0/0", inn1Overs = "0.0", inn1Team = teamA;
    let inn2Score = "0/0", inn2Overs = "0.0", inn2Team = teamB;
    let footballScoreA = 0, footballScoreB = 0;

    if (isCricket && cricketSnap) {
      const inn1 = cricketSnap.innings1;
      const inn2 = cricketSnap.innings2;
      const maxOvers = cricketSnap.maxOvers || 20;

      inn1Team = inn1?.battingTeam === "teamA" ? teamA : teamB;
      inn2Team = inn1?.battingTeam === "teamA" ? teamB : teamA;

      inn1Score = `${inn1?.score || 0}/${inn1?.wickets || 0}`;
      inn1Overs = inn1?.overs || "0.0";

      inn2Score = inn2 ? `${inn2.score || 0}/${inn2.wickets || 0}` : "DNB";
      inn2Overs = inn2?.overs || "0.0";

      const targetScore = (inn1?.score || 0) + 1;
      const chasingSquadKey = inn2?.battingTeam || (inn1?.battingTeam === "teamA" ? "teamB" : "teamA");
      const squadCount = cricketSnap.squads?.[chasingSquadKey]?.length || 11;
      const maxWickets = Math.max(1, squadCount - 1);

      // যদি ফায়ারস্টোরে আগে থেকে রেজাল্ট না থাকে, তখন ডায়নামিক ক্যালকুলেট হবে
      if (!savedResult || savedResult === "Match Completed") {
        if (!inn2 || (!inn2.overs && inn2.score === 0) || inn2.overs === "0.0") {
          resultText = `${inn1Team} scored ${inn1?.score || 0}/${inn1?.wickets || 0} (${inn1?.overs || "0.0"} ov) • Match Incomplete`;
        } else if (inn2.score >= targetScore) {
          const wicketsLeft = Math.max(0, maxWickets - (inn2.wickets || 0));
          resultText = `🏆 ${inn2Team.toUpperCase()} WON BY ${wicketsLeft} WICKET${wicketsLeft > 1 ? "S" : ""}`;
        } else {
          const [o] = (inn2.overs || "0.0").split(".").map(Number);
          const isInn2Finished = inn2.isCompleted || o >= maxOvers || (inn2.wickets || 0) >= maxWickets;

          if (isInn2Finished) {
            const runMargin = (inn1?.score || 0) - inn2.score;
            if (runMargin > 0) {
              resultText = `🏆 ${inn1Team.toUpperCase()} WON BY ${runMargin} RUN${runMargin > 1 ? "S" : ""}`;
            } else if (runMargin === 0) {
              resultText = "MATCH TIED (SUPER OVER)";
            }
          }
        }
      }
    } else if (footballSnap) {
      footballScoreA = footballSnap.scoreA || 0;
      footballScoreB = footballSnap.scoreB || 0;
      if (!savedResult || savedResult === "Match Completed") {
        if (footballScoreA > footballScoreB) {
          resultText = `🏆 ${teamA.toUpperCase()} WON THE MATCH`;
        } else if (footballScoreB > footballScoreA) {
          resultText = `🏆 ${teamB.toUpperCase()} WON THE MATCH`;
        } else {
          resultText = "MATCH DRAW";
        }
      }
    }

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
          // Top Header
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

          // Scoreboard Card
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
                      React.createElement("span", { key: "fan", style: { color: "#EAEDF5", fontSize: "36px", fontWeight: "900" } }, teamA),
                    ]
                  ),
                  React.createElement(
                    "div",
                    { key: "fscore", style: { display: "flex", alignItems: "baseline", color: "#17C980", fontSize: "80px", fontWeight: "900" } },
                    `${footballScoreA} - ${footballScoreB}`
                  ),
                  React.createElement(
                    "div",
                    { key: "fb", style: { display: "flex", flexDirection: "column", alignItems: "center", width: "35%" } },
                    [
                      React.createElement("span", { key: "fbn", style: { color: "#EAEDF5", fontSize: "36px", fontWeight: "900" } }, teamB),
                    ]
                  ),
                ]
          ),

          // Result Banner
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
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("OG Image Error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}