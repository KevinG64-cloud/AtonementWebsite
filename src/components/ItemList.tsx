"use client";

import type { Article, Resource, SectionEntry } from "@/types/research";
import { useState } from "react";

type ListItem =
  | { kind: "entry"; data: SectionEntry }
  | { kind: "resource"; data: Resource }
  | { kind: "article"; data: Article };

interface ItemListProps {
  items: ListItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  sectionTitle: string;
  sectionType?: string;
}

function getItemTitle(item: ListItem): string {
  switch (item.kind) {
    case "entry":
      return item.data.title;
    case "resource":
      return item.data.text;
    case "article":
      return item.data.title;
  }
}

function getItemSubtitle(item: ListItem): string {
  switch (item.kind) {
    case "entry":
      return item.data.text.slice(0, 120);
    case "resource":
      return `${item.data.type} — ${item.data.author}`;
    case "article":
      return `By ${item.data.author}`;
  }
}

function hasExplanation(item: ListItem): boolean {
  switch (item.kind) {
    case "entry":
      return !!item.data.explanation;
    case "resource":
      return !!item.data.explanation;
    case "article":
      return item.data.article.length > 200;
  }
}

export function ItemList({
  items,
  selectedIndex,
  onSelect,
  sectionTitle,
  sectionType,
}: ItemListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = searchQuery.trim()
    ? items.filter((item) => {
        const q = searchQuery.toLowerCase();
        const title = getItemTitle(item).toLowerCase();
        const subtitle = getItemSubtitle(item).toLowerCase();
        return title.includes(q) || subtitle.includes(q);
      })
    : items;

  return (
    <section className="glass-panel flex h-full flex-col overflow-hidden rounded-2xl">
      {/* Header */}
      <div
        className="border-b px-5 py-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {sectionTitle}
            </h2>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              {filteredItems.length} of {items.length} entries
            </p>
          </div>
          {sectionType && (
            <span
              className={`badge ${
                sectionType === "topic"
                  ? "badge-topic"
                  : sectionType === "resource"
                    ? "badge-resource"
                    : sectionType === "article"
                      ? "badge-article"
                      : "badge-passage"
              }`}
            >
              {sectionType}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-1"
            style={{
              background: "var(--bg-tertiary)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {searchQuery
                ? "No matching entries found."
                : "No entries in this section."}
            </p>
          </div>
        ) : (
          <div>
            {filteredItems.map((item) => {
              const originalIndex = items.indexOf(item);
              const isSelected = originalIndex === selectedIndex;

              return (
                <button
                  key={`${getItemTitle(item)}-${originalIndex}`}
                  type="button"
                  onClick={() => onSelect(originalIndex)}
                  className="block w-full border-b px-5 py-3.5 text-left transition-all"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: isSelected
                      ? "var(--accent-gold-dim)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background =
                        "var(--bg-card-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span
                            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: "var(--accent-gold)" }}
                          />
                        )}
                        <h3
                          className="truncate text-sm font-semibold"
                          style={{
                            color: isSelected
                              ? "var(--text-accent)"
                              : "var(--text-primary)",
                          }}
                        >
                          {getItemTitle(item)}
                        </h3>
                      </div>
                      <p
                        className="mt-1 line-clamp-2 text-[13px] leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {getItemSubtitle(item)}
                      </p>
                    </div>
                    {hasExplanation(item) && (
                      <span
                        className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: "var(--accent-gold-dim)",
                          color: "var(--accent-gold)",
                        }}
                      >
                        Notes
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export type { ListItem };
