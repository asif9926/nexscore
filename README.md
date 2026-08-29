# 🏏 NexScore — Live Sports Broadcasting & Real-Time Scoring Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase%20RTDB%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![OBS Studio](https://img.shields.io/badge/OBS_Studio-302E31?style=for-the-badge&logo=obsstudio&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

<p align="center">
  <b>NexScore</b> is a production-grade sports broadcasting engine engineered to turn regional cricket and football matches into international television-standard broadcasts with zero-delay live scoring and 60 FPS hardware-accelerated OBS overlays.
</p>

[Live Demo](https://nexscore.vercel.app) • [Report Bug](https://github.com/your-username/nexscore/issues) • [Request Feature](https://github.com/your-username/nexscore/issues)

</div>

---

## ⚡ Key Highlights

- **Cricbuzz-Style Public Match Center**: Real-time ball-by-ball commentary, full scorecards, live run rate equations, worm graphs, and team playing XI rosters.
- **60 FPS Hardware-Accelerated OBS Overlays**: Transparent, zero-scrollbar TV graphics and event banners (FOUR, SIX, WICKET, GOAL, Red Card, Innings Break, and Champions Poster).
- **TV Director (PCR) Admin Control Room**: Fast scoring interface with keyboard/numpad shortcuts, overlay theme switcher, and instant event triggers.
- **Atomic Undo & Rollback Engine**: One-click undo (`Ctrl + Z`) backed by an atomic action log to prevent scorer mis-clicks without corrupting the state.
- **Automated Match Archiving & Social Cards**: Edge-rendered 1200x630 dynamic scorecards (`@vercel/og`) generated on-demand for social media sharing.

---

## 🎨 Overlay Themes Included

| Sport | Themes Available |
| :--- | :--- |
| **Cricket (6 Themes)** | Sky Sports, Ultra Dark Matrix, PSL Cyber Neon, Fox Sports, IPL Neon Chyron, Minimal Compact Bar |
| **Football (5 Themes)** | Premier League, UEFA Champions League, FIFA World Cup, La Liga Cyber, Classic Center TV |

---

## 🛠️ Architecture & Tech Stack

```text
 ┌───────────────────────────┐         ┌──────────────────────────┐
 │ Admin Control Room (PCR)  │ ──────> │   Firebase RTDB (Node)   │
 │ • Numpad Scoring Engine   │ Atomic  │ • Sub-millisecond sync   │
 │ • TV Director Switcher    │ Updates │ • Realtime state tree    │
 └───────────────────────────┘         └──────────────────────────┘
               │                                     │
               │ (Match Finalize)                    ├──────────────────────────┐
               ▼                                     ▼                          ▼
 ┌───────────────────────────┐         ┌──────────────────────────┐ ┌──────────────────────────┐
 │ Firebase Firestore Engine │         │  OBS Studio 60FPS Stream │ │ Public Live Match Center │
 │ • Permanent JSON Archive  │         │ • Transparent Chyrons    │ │ • Ball-by-Ball Timelines │
 │ • Historical Scorecards   │         │ • Animated Event Popups  │ │ • Run Rate Graphs & XI   │
 └───────────────────────────┘         └──────────────────────────┘ └──────────────────────────┘