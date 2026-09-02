// lib/config/site.ts
export const siteConfig = {
  name: "NexScore Engine",
  developer: {
    name: "Asif ul Haque",
    role: "Full-Stack Software Engineer & UI/UX Architect",
    email: process.env.NEXT_PUBLIC_DEV_EMAIL || "asif992088@gmail.com",
    // আপনার আসল ১১ ডিজিটের হোয়াটসঅ্যাপ নম্বর দিন (Country code সহ, যেমন: 88017XXXXXXXX)
    whatsappNumber: process.env.NEXT_PUBLIC_DEV_WHATSAPP || "8801710256453",
    get whatsappUrl() {
      return `https://wa.me/${this.whatsappNumber}`;
    },
  },
  links: {
    streamvex: "https://streamvex-live.vercel.app/",
    twille: "https://twille.vercel.app/",
  },
};