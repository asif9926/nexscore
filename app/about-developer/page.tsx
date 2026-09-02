import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { siteConfig } from "@/lib/config/site";
import { 
  Code2, 
  Cpu, 
  Layers, 
  Radio, 
  Zap, 
  MessageCircle, 
  Mail, 
  ExternalLink, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Tv,
  Globe
} from "lucide-react";

export const metadata = {
  title: "About Developer — NexScore Engine",
  description: "Meet the architect and full-stack engineer behind the NexScore sports broadcasting engine.",
};

export default function AboutDeveloperPage() {
  const featuredProjects = [
    {
      title: "Streamvex Live",
      category: "International Sports Streaming & Highlights",
      tag: "Live Broadcast",
      tagColor: "bg-crimson/15 text-crimson border-crimson/30",
      description:
        "High-definition live international sports streaming platform featuring real-time video feeds, match highlights, and global sports data center.",
      url: "https://streamvex-live.vercel.app/",
      icon: <Tv size={22} className="text-crimson" />,
      badges: ["HLS Video Streaming", "Next.js", "Sports APIs", "Live TV"],
      buttonText: "Visit Streamvex",
      borderHover: "hover:border-crimson/50",
    },
    {
      title: "Twille E-Commerce",
      category: "Modern High-Performance Online Store",
      tag: "Full-Stack Store",
      tagColor: "bg-electric/15 text-electric border-electric/30",
      description:
        "Premium e-commerce web platform engineered with dynamic product variant selectors, cart synchronization, guest checkout, and secure order processing.",
      url: "https://twille.vercel.app/", // আপনার ই-কমার্স ওয়েবসাইটের আসল লিংক দিন
      icon: <ShoppingBag size={22} className="text-electric" />,
      badges: ["Next.js", "MongoDB", "Cart Sync", "Tailwind CSS"],
      buttonText: "Visit E-Store",
      borderHover: "hover:border-electric/50",
    },
  ];

  const techStack = [
    { name: "Next.js 15 (App Router)", desc: "Server Components & Edge Rendering", icon: <Globe size={18} className="text-electric" /> },
    { name: "Firebase RTDB & Firestore", desc: "Sub-millisecond Real-Time Scoring Sync", icon: <Zap size={18} className="text-signal-gold" /> },
    { name: "OBS Studio Engine", desc: "60 FPS Hardware-Accelerated Overlays", icon: <Radio size={18} className="text-crimson" /> },
    { name: "Tailwind CSS & Motion", desc: "Chyron TV Graphics & Fluid UI Systems", icon: <Layers size={18} className="text-pitch-green" /> },
    { name: "TypeScript Architecture", desc: "End-to-End Type Safety & Data Models", icon: <Code2 size={18} className="text-electric" /> },
    { name: "Edge API & Social OG", desc: "Dynamic 1200x630 Match Cards Generation", icon: <Cpu size={18} className="text-amber-400" /> },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
      <Navbar />

      {/* Ambient Floodlight Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block">
        <div className="absolute left-1/2 top-[-10%] h-96 w-full max-w-5xl -translate-x-1/2 rounded-full bg-electric/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[140px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-4 py-1.5 text-xs font-bold text-fg-muted transition-all hover:border-fg-faint hover:text-fg"
          >
            <ArrowLeft size={14} className="text-electric" /> Back to Live Center
          </Link>
        </div>

        {/* 1. Hero Developer Profile Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-panel p-6 shadow-2xl sm:p-10">
          <div className="absolute right-0 top-0 h-1 w-full bg-gradient-to-r from-electric via-signal-gold to-pitch-green" />

          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-electric via-blue-700 to-indigo-800 font-broadcast text-4xl font-black text-white shadow-xl shadow-electric/25">
              <span>A.H</span>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-panel bg-pitch-green text-ink">
                <Sparkles size={12} />
              </span>
            </div>

            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-pitch-green/30 bg-pitch-green/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pitch-green">
                <span className="h-2 w-2 animate-pulse rounded-full bg-pitch-green" />
                Available for Custom Broadcast & Web Projects
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-fg sm:text-4xl">
                  Asif ul Haque
                </h1>
                <p className="font-mono text-xs font-semibold text-electric sm:text-sm">
                  Full-Stack Software Engineer & UI/UX Architect
                </p>
              </div>

              <p className="max-w-2xl text-xs leading-relaxed text-fg-muted sm:text-sm">
                Passionate about designing real-time, low-latency web platforms, sports broadcast systems, and high-performance interactive architectures. Architected and developed <strong>NexScore</strong> from the ground up to empower local tournaments with international-standard broadcast graphics.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
  <a
    href={siteConfig.developer.whatsappUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex min-h-[42px] items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/15 px-5 py-2 text-xs font-bold text-[#25D366] shadow-sm transition-all hover:bg-[#25D366]/25 hover:text-white"
  >
    <MessageCircle size={16} />
    <span>WhatsApp Message</span>
  </a>

  <a
    href={`mailto:${siteConfig.developer.email}`}
    className="flex min-h-[42px] items-center gap-2 rounded-full border border-border bg-ink px-5 py-2 text-xs font-bold text-fg-muted transition-all hover:border-fg-faint hover:text-fg"
  >
    <Mail size={15} className="text-electric" />
    <span>Send Email</span>
  </a>
</div>

            </div>
          </div>
        </div>

        {/* 2. Featured Ecosystem & Projects */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-fg sm:text-xl">Featured Ecosystem & Platforms</h2>
              <p className="text-xs text-fg-muted">Other active production platforms engineered by the developer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {featuredProjects.map((project, i) => (
              <div
                key={i}
                className={`group flex flex-col justify-between rounded-3xl border border-border bg-panel p-6 shadow-xl transition-all ${project.borderHover} hover:bg-panel-raised/50 sm:p-7`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-ink shadow-inner">
                      {project.icon}
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${project.tagColor}`}>
                      {project.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-fg group-hover:text-white transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs font-medium text-fg-faint mt-0.5">
                      {project.category}
                    </p>
                  </div>

                  <p className="text-xs leading-relaxed text-fg-muted">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.badges.map((badge, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-border/80 bg-ink px-2.5 py-1 text-[10px] font-semibold text-fg-muted"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-ink px-4 py-2.5 text-xs font-bold text-fg shadow-sm transition-all group-hover:border-fg-faint group-hover:bg-panel-raised"
                  >
                    <span>{project.buttonText}</span>
                    <ExternalLink size={14} className="text-fg-faint group-hover:text-fg" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Architecture & Tech Stack */}
        <div className="mt-10 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-fg sm:text-xl">Core Architecture & Tech Stack</h2>
            <p className="text-xs text-fg-muted">Technologies powering the zero-latency NexScore Engine</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech, i) => (
              <div
                key={i}
                className="group space-y-2 rounded-2xl border border-border bg-panel p-5 transition-all hover:border-electric/40 hover:bg-panel-raised/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-ink">
                    {tech.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-fg group-hover:text-electric transition-colors">
                      {tech.name}
                    </h3>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-fg-muted">
                  {tech.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Engineering Mission Card */}
        <div className="mt-10 rounded-3xl border border-border bg-panel p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-2.5 border-b border-border pb-4">
            <ShieldCheck className="h-5 w-5 text-signal-gold" />
            <h2 className="text-base font-bold text-fg sm:text-lg">Engineering NexScore</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 text-xs text-fg-muted sm:grid-cols-3 sm:text-sm">
            <div className="space-y-1.5 rounded-2xl border border-border/60 bg-ink p-4">
              <strong className="block font-bold text-fg">Zero-Delay Pipeline</strong>
              <span>Sub-millisecond data sync between control room and live OBS overlays using RTDB listeners.</span>
            </div>
            <div className="space-y-1.5 rounded-2xl border border-border/60 bg-ink p-4">
              <strong className="block font-bold text-fg">Atomic Event-Sourcing</strong>
              <span>State rollbacks and ball-by-ball recalculation prevent scorer mis-clicks with instant undo.</span>
            </div>
            <div className="space-y-1.5 rounded-2xl border border-border/60 bg-ink p-4">
              <strong className="block font-bold text-fg">Cost-Optimized Scale</strong>
              <span>Finished matches are offloaded to Firestore + ISR cache for zero operational billing spikes.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}