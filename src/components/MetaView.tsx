"use client";

import { linkifyText } from "@/lib/linkifyText";
import type { AppStoryItem, Introduction as IntroData } from "@/types/research";

interface MetaViewProps {
  type: "introduction" | "app_story";
  introduction?: IntroData;
  appStory?: AppStoryItem[];
}

export function MetaView({ type, introduction, appStory }: MetaViewProps) {
  if (type === "introduction" && introduction) {
    return (
      <div className="fade-in space-y-6">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Introduction
          </p>
          <h2 className="gold-gradient-text mt-2 text-2xl font-bold tracking-tight">
            {introduction.title}
          </h2>
        </div>
        <p
          className="whitespace-pre-wrap text-[14px] leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          {linkifyText(introduction.text)}
        </p>
      </div>
    );
  }

  if (type === "app_story" && appStory) {
    return (
      <div className="fade-in space-y-8">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          This App&apos;s Story
        </p>
        {appStory.map((story, index) => (
          <div key={`story-${index}`} className="space-y-3">
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-accent)" }}
            >
              {story.title}
            </h3>
            <p
              className="whitespace-pre-wrap text-[14px] leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              {linkifyText(story.text)}
            </p>
            {index < appStory.length - 1 && (
              <hr
                className="my-4"
                style={{ borderColor: "var(--border-default)" }}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
