// app/icon.tsx
import { ImageResponse } from "@vercel/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// আগে কোনো ব্র্যান্ডেড favicon ছিল না — শুধু ডিফল্ট Next.js আইকন।
// @vercel/og এমনিতেই প্রজেক্টে ডিপেন্ডেন্সি হিসেবে ছিল (scorecard ইমেজের জন্য),
// সেটাই রিইউজ করে কোনো নতুন asset ফাইল ছাড়াই ডাইনামিক আইকন জেনারেট করা হলো।
export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#3b82f6",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
