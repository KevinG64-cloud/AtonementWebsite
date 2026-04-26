"use client";

import { linkifyText } from "@/lib/linkifyText";
import type { Introduction } from "@/types/research";
import Image from "next/image";

interface WelcomeViewProps {
  introduction: Introduction;
}

export function WelcomeView({ introduction }: WelcomeViewProps) {
  return (
    <div className="fade-in flex h-full flex-col">
      {/* Hero */}
      <div className="px-6 py-8 text-center lg:px-12 lg:py-12">
        <div className="mx-auto  max-w-xs sm:max-w-sm">
          <Image
            src="/cover-image.jpg"
            alt="Atonement and Reconciliation book cover"
            width={768}
            height={1365}
            className="h-auto w-full rounded-xl border"
            style={{
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-panel)",
            }}
            priority
          />
        </div>
        <p
          className="mx-auto mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          {linkifyText(introduction.text)}
        </p>
      </div>
    </div>
  );
}
