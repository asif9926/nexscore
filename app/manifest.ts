import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexScore — Live Sports Broadcasting",
    short_name: "NexScore",
    description: "Real-time cricket & football scoring with OBS-ready broadcast overlays.",
    start_url: "/",
    display: "standalone",
    background_color: "#06080F",
    theme_color: "#06080F",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
