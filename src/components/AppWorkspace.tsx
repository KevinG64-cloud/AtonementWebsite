"use client";

import { DetailPanel } from "@/components/DetailPanel";
import { ItemList, type ListItem } from "@/components/ItemList";
import { MetaView } from "@/components/MetaView";
import { Sidebar } from "@/components/Sidebar";
import { WelcomeView } from "@/components/WelcomeView";
import type { ViewerAuthState } from "@/types/auth";
import type { AppData } from "@/types/research";
import { useCallback, useEffect, useMemo, useState } from "react";

type ViewState =
  | { kind: "welcome" }
  | { kind: "section"; sectionId: string }
  | { kind: "resources" }
  | { kind: "articles" }
  | { kind: "meta"; metaType: "app_story" };

type Theme = "dark" | "light";

interface AppWorkspaceProps {
  initialData: AppData;
  authState: ViewerAuthState;
  isAuthConfigured: boolean;
  showEditorAccess: boolean;
}

export function AppWorkspace({
  initialData,
  authState,
  isAuthConfigured,
  showEditorAccess,
}: AppWorkspaceProps) {
  const appData = initialData;
  const [viewState, setViewState] = useState<ViewState>({ kind: "welcome" });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [mobilePanel, setMobilePanel] = useState<"nav" | "list" | "detail">(
    "nav",
  );
  const [theme, setTheme] = useState<Theme>("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Theme ──────────────────────────────────
  useEffect(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("ae-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTimeout(() => setTheme(saved), 0);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const initial = prefersDark ? "dark" : "light";
      setTimeout(() => setTheme(initial), 0);
      document.documentElement.setAttribute("data-theme", initial);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("ae-theme", next);
      return next;
    });
  }, []);

  const getDefaultMobilePanel = useCallback(
    (nextViewState: ViewState, nextSelectedIndex: number = selectedIndex) => {
      if (nextViewState.kind === "welcome" || nextViewState.kind === "meta") {
        return "list";
      }

      return nextSelectedIndex === -1 ? "list" : "detail";
    },
    [selectedIndex],
  );

  const homeNavId = useMemo(() => {
    const homeNav = appData.navigation.find(
      (n) =>
        n.type === "meta" &&
        (n.id.toLowerCase() === "home" ||
          n.title.toLowerCase().includes("home") ||
          n.id.toLowerCase() === "introduction" ||
          n.title.toLowerCase().includes("introduction")),
    );

    return homeNav?.id ?? "";
  }, [appData.navigation]);

  // ── Navigation ─────────────────────────────
  const activeNavId = useMemo(() => {
    switch (viewState.kind) {
      case "welcome":
        return homeNavId;
      case "section":
        return viewState.sectionId;
      case "resources":
        return "resources";
      case "articles":
        return "articles";
      case "meta":
        return viewState.metaType;
    }
  }, [homeNavId, viewState]);

  const handleNavSelect = useCallback(
    (navId: string) => {
      const navItem = appData.navigation.find((n) => n.id === navId);
      if (!navItem) return;

      setSelectedIndex(-1);
      setIsFullscreen(false);
      let nextViewState: ViewState = viewState;

      switch (navItem.type) {
        case "section":
          nextViewState = { kind: "section", sectionId: navId };
          break;
        case "resources":
          nextViewState = { kind: "resources" };
          break;
        case "articles":
          nextViewState = { kind: "articles" };
          break;
        case "meta":
          {
            const lowerId = navItem.id.toLowerCase();
            const lowerTitle = navItem.title.toLowerCase();

            if (
              lowerId === "home" ||
              lowerTitle.includes("home") ||
              lowerId === "introduction" ||
              lowerTitle.includes("introduction")
            ) {
              nextViewState = { kind: "welcome" };
            } else {
              nextViewState = { kind: "meta", metaType: "app_story" };
            }
          }
          break;
      }

      setViewState(nextViewState);
      setMobilePanel(getDefaultMobilePanel(nextViewState, -1));
    },
    [appData, getDefaultMobilePanel, viewState],
  );

  const handleGoHome = useCallback(() => {
    setViewState({ kind: "welcome" });
    setSelectedIndex(-1);
    setIsFullscreen(false);
    setMobilePanel("list");
  }, []);

  // ── List Items ─────────────────────────────
  const { listItems, sectionTitle, sectionType } = useMemo(() => {
    switch (viewState.kind) {
      case "section": {
        const section = appData.sections.find(
          (s) => s.id === viewState.sectionId,
        );
        return {
          listItems: (section?.entries ?? []).map(
            (e) => ({ kind: "entry", data: e }) as ListItem,
          ),
          sectionTitle: section?.title ?? "",
          sectionType: section?.type ?? "passage",
        };
      }
      case "resources":
        return {
          listItems: appData.resources.map(
            (r) => ({ kind: "resource", data: r }) as ListItem,
          ),
          sectionTitle: "Resources",
          sectionType: "resource",
        };
      case "articles":
        return {
          listItems: appData.articles.map(
            (a) => ({ kind: "article", data: a }) as ListItem,
          ),
          sectionTitle: "Articles",
          sectionType: "article",
        };
      default:
        return {
          listItems: [] as ListItem[],
          sectionTitle: "",
          sectionType: "",
        };
    }
  }, [appData, viewState]);

  const selectedItem =
    selectedIndex !== -1 ? (listItems[selectedIndex] ?? null) : null;

  const selectedEntryContext = useMemo(() => {
    if (viewState.kind !== "section" || selectedIndex === -1) {
      return null;
    }

    return {
      sectionId: viewState.sectionId,
      entryIndex: selectedIndex,
    };
  }, [selectedIndex, viewState]);

  const handleNext = useCallback(() => {
    if (selectedIndex !== -1 && selectedIndex < listItems.length - 1) {
      setSelectedIndex((prev) => (prev !== -1 ? prev + 1 : -1));
    }
  }, [listItems.length, selectedIndex]);

  const handlePrev = useCallback(() => {
    if (selectedIndex !== -1 && selectedIndex > 0) {
      setSelectedIndex((prev) => (prev !== -1 ? prev - 1 : -1));
    }
  }, [selectedIndex]);

  const totalEntries = useMemo(() => {
    return (
      appData.sections.reduce((sum, s) => sum + s.entries.length, 0) +
      appData.resources.length +
      appData.articles.length
    );
  }, [appData]);

  // ── Check if we're showing a meta or welcome view ──
  const isFullWidthView =
    viewState.kind === "welcome" || viewState.kind === "meta";

  // ── Render ─────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Mobile Header */}
      <div
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b px-4 py-3 lg:hidden"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-default)",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setMobilePanel((prev) =>
              prev === "nav" ? getDefaultMobilePanel(viewState) : "nav",
            )
          }
          className="rounded-lg px-3 py-1.5 text-sm font-medium"
          style={{
            background:
              mobilePanel === "nav" ? "var(--accent-gold-dim)" : "transparent",
            color:
              mobilePanel === "nav"
                ? "var(--text-accent)"
                : "var(--text-secondary)",
          }}
        >
          ☰ Nav
        </button>
        <button
          type="button"
          onClick={handleGoHome}
          className="rounded-lg px-3 py-1.5 text-sm font-medium"
          style={{
            background:
              viewState.kind === "welcome"
                ? "var(--accent-gold-dim)"
                : "transparent",
            color:
              viewState.kind === "welcome"
                ? "var(--text-accent)"
                : "var(--text-secondary)",
          }}
        >
          Home
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`w-full shrink-0 border-r p-2 lg:w-65 ${
          isFullscreen
            ? "hidden"
            : mobilePanel === "nav"
              ? "block lg:block"
              : "hidden lg:block"
        }`}
        style={{
          borderColor: "var(--border-default)",
          paddingTop: "env(safe-area-inset-top, 0)",
        }}
      >
        <div className="h-full pt-14 lg:pt-0">
          <Sidebar
            navigation={appData.navigation}
            activeNavId={activeNavId}
            onNavSelect={handleNavSelect}
            onGoHome={handleGoHome}
            entryCount={totalEntries}
            theme={theme}
            onToggleTheme={toggleTheme}
            authState={authState}
            isAuthConfigured={isAuthConfigured}
            showEditorAccess={showEditorAccess}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isFullWidthView ? (
        /* ── Full width view (Welcome / Meta) ── */
        <div
          className={`flex-1 overflow-y-auto ${
            mobilePanel === "list" || mobilePanel === "detail"
              ? "block"
              : "hidden lg:block"
          }`}
        >
          <div className="pt-14 lg:pt-0">
            {viewState.kind === "welcome" && (
              <WelcomeView introduction={appData.meta.introduction} />
            )}
            {viewState.kind === "meta" && (
              <div className="mx-auto max-w-3xl px-6 py-8 lg:px-12 lg:py-12">
                <MetaView
                  type={viewState.metaType}
                  introduction={appData.meta.introduction}
                  appStory={appData.meta.appStory}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── 3-panel view (Section / Resources / Articles) ── */
        <>
          {/* Center - Item List */}
          <div
            className={`flex-1 border-r p-2 lg:min-w-0 ${
              selectedIndex === -1 && !isFullscreen
                ? "lg:max-w-none"
                : "lg:max-w-120"
            } ${
              isFullscreen
                ? "hidden"
                : mobilePanel === "list"
                  ? "block lg:block"
                  : "hidden lg:block"
            }`}
            style={{ borderColor: "var(--border-default)" }}
          >
            <div className="h-full pt-14 lg:pt-0">
              <ItemList
                items={listItems}
                selectedIndex={selectedIndex}
                onSelect={(idx) => {
                  setSelectedIndex(idx);
                  setMobilePanel("detail");
                }}
                sectionTitle={sectionTitle}
                sectionType={sectionType}
              />
            </div>
          </div>

          {/* Right - Detail Panel */}
          {selectedIndex !== -1 && (
            <div
              className={`flex-1 p-2 lg:block ${
                mobilePanel === "detail" || isFullscreen ? "block" : "hidden"
              }`}
            >
              <div className="h-full pt-14 lg:pt-0">
                <DetailPanel
                  item={selectedItem}
                  entryContext={selectedEntryContext}
                  entrySectionType={
                    viewState.kind === "section"
                      ? (sectionType as "topic" | "passage")
                      : null
                  }
                  authState={authState}
                  isAuthConfigured={isAuthConfigured}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  hasNext={
                    selectedIndex !== -1 && selectedIndex < listItems.length - 1
                  }
                  hasPrev={selectedIndex !== -1 && selectedIndex > 0}
                  onClose={() => {
                    setSelectedIndex(-1);
                    setIsFullscreen(false);
                    setMobilePanel("list");
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
