// app/apple-icon.tsx
import { ImageResponse } from "@vercel/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#3b82f6",
            }}
          />
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: "white",
              letterSpacing: -1,
            }}
          >
            NS
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
