// app/opengraph-image.tsx
import { ImageResponse } from "@vercel/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.15), transparent 40%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#3b82f6" }} />
          <div style={{ fontSize: 96, fontWeight: 900, color: "white", letterSpacing: -2 }}>
            NexScore
          </div>
        </div>
        <div style={{ fontSize: 32, color: "#94a3b8", fontWeight: 500 }}>
          Live Sports Broadcasting &amp; Scoring Platform
        </div>
      </div>
    ),
    { ...size }
  );
}
