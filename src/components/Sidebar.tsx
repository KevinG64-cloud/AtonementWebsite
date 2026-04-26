"use client";

import { AuthControls } from "@/components/AuthControls";
import type { ViewerAuthState } from "@/types/auth";
import type { NavItem } from "@/types/research";

interface SidebarProps {
  navigation: NavItem[];
  activeNavId: string;
  onNavSelect: (navId: string) => void;
  onGoHome: () => void;
  entryCount?: number;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  authState: ViewerAuthState;
  isAuthConfigured: boolean;
  showEditorAccess: boolean;
}

// const NAV_GROUPS: { label: string; types: NavItem["type"][] }[] = [
//   { label: "Passages", types: ["section"] },
//   { label: "Other", types: ["resources", "articles", "meta"] },
// ];

function getNavIcon(type: NavItem["type"], title: string): string {
  if (type === "resources") return "📚";
  if (type === "articles") return "📝";
  if (type === "meta") {
    if (title.toLowerCase().includes("home")) return "🏠";
    if (title.toLowerCase().includes("introduction")) return "📖";
    return "💡";
  }
  if (title.toLowerCase().includes("ot ")) return "📜";
  if (title.toLowerCase().includes("nt ")) return "✝️";
  if (title.toLowerCase().includes("psa problem")) return "⚠️";
  if (title.toLowerCase().includes("refut")) return "🛡️";
  if (title.toLowerCase().includes("bad")) return "🔍";
  if (title.toLowerCase().includes("alternative")) return "🔄";
  if (title.toLowerCase().includes("topic")) return "💬";
  return "📄";
}

export function Sidebar({
  navigation,
  activeNavId,
  onNavSelect,
  onGoHome,
  entryCount,
  theme,
  onToggleTheme,
  authState,
  isAuthConfigured,
  showEditorAccess,
}: SidebarProps) {
  const homeItem =
    navigation.find(
      (n) =>
        n.type === "meta" &&
        (n.id.toLowerCase() === "home" ||
          n.id.toLowerCase() === "introduction" ||
          n.title.toLowerCase().includes("home") ||
          n.title.toLowerCase().includes("introduction")),
    ) ?? null;

  const orderedItems = navigation.filter((n) => n.id !== homeItem?.id);
  const activeItem = navigation.find((n) => n.id === activeNavId) ?? null;

  return (
    <nav className="glass-panel-strong flex h-full flex-col overflow-hidden rounded-2xl">
      {/* Header */}
      <div
        className="border-b px-4 py-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg font-bold tracking-tighter"
            style={{
              background: "var(--accent-gold-dim)",
              color: "var(--accent-gold)",
              fontSize: "15px",
            }}
          >
            AE
          </div>
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Atonement
            </h2>
            <p
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Examination
            </p>
          </div>
        </div>
        <div
          className="mt-3 flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          <button
            type="button"
            onClick={onGoHome}
            className="rounded px-1 py-0.5 transition-colors cursor-pointer"
            style={{ color: "var(--text-accent)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-gold-dim)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Home
          </button>
          <span>/</span>
          <span className="truncate" style={{ color: "var(--text-secondary)" }}>
            {activeItem?.title ?? "Welcome"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          {orderedItems.map((item) => {
            const isActive = item.id === activeNavId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavSelect(item.id)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all"
                style={{
                  background: isActive ? "var(--bg-active)" : "transparent",
                  color: isActive
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--bg-card-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span className="text-sm leading-none">
                  {getNavIcon(item.type, item.title)}
                </span>
                <span className="flex-1 truncate text-[13px] font-medium">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="border-t px-4 py-3"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="space-y-3">
          {showEditorAccess && (
            <AuthControls
              authState={authState}
              isAuthConfigured={isAuthConfigured}
            />
          )}
          <div className="flex items-center justify-between">
            {entryCount !== undefined && (
              <p
                className="text-[11px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                <span style={{ color: "var(--accent-gold)" }}>
                  {entryCount}
                </span>{" "}
                entries
              </p>
            )}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="theme-toggle"
                aria-label="Toggle theme"
                title={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
