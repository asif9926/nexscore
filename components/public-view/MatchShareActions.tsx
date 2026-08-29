"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Info, X, Download, Smartphone, Sparkles } from "lucide-react";

interface Props {
  archiveId: string;
}

export default function MatchShareActions({ archiveId }: Props) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-border bg-panel p-3 sm:px-5 sm:py-3.5">
        {/* Back Link */}
        <Link
          href="/match-history"
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border bg-ink px-3.5 py-1.5 text-xs font-bold text-fg transition-all hover:bg-panel-raised sm:min-h-[44px] sm:px-4 sm:py-2"
        >
          <ArrowLeft size={15} className="text-electric" />
          <span>Archives</span>
        </Link>

        {/* Action Buttons: Share Graphic + Info (i) */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/scorecard/${archiveId}/image`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-electric px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-electric/20 transition-all hover:scale-105 active:scale-95 sm:min-h-[44px] sm:px-5 sm:py-2"
          >
            <Share2 size={15} />
            <span>Share Graphic</span>
          </a>

          {/* Small (i) Instruction Trigger */}
          <button
            onClick={() => setShowInfoModal(true)}
            aria-label="How to share instruction"
            className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-border bg-ink text-fg-muted transition-all hover:border-signal-gold/50 hover:bg-signal-gold/10 hover:text-signal-gold active:scale-95"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Instruction Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-panel p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal-gold/15 text-signal-gold">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-fg">How to Share Match Card</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="rounded-lg p-1 text-fg-muted hover:bg-panel-raised hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-3 text-xs leading-relaxed text-fg-muted sm:text-sm">
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-ink p-3">
                <Download size={18} className="text-electric shrink-0 mt-0.5" />
                <div>
                  <strong className="text-fg block text-xs sm:text-sm mb-0.5">১. ইমেজ ওপেন ও সেভ</strong>
                  <span>'Share Graphic' বাটনে চাপ দিলে নতুন ট্যাবে ১২০০x৬৩০ এইচডি কার্ড ওপেন হবে। মোবাইলে ইমেজের উপর চেপে ধরে (Long Press) <b>Download Image</b> করুন।</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-ink p-3">
                <Smartphone size={18} className="text-pitch-green shrink-0 mt-0.5" />
                <div>
                  <strong className="text-fg block text-xs sm:text-sm mb-0.5">২. সোশ্যাল মিডিয়ায় পোস্ট</strong>
                  <span>ডাউনলোড করা ছবিটি সরাসরি Facebook, WhatsApp বা Messenger স্টোরিতে পোস্ট করে টুর্নামেন্টের ফলাফল শেয়ার করুন।</span>
                </div>
              </div>
            </div>

            {/* Close CTA */}
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full rounded-xl bg-panel-raised py-2.5 text-xs font-bold text-fg transition-colors hover:bg-border"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}