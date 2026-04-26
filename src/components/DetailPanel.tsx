"use client";

import { updateSectionEntryAction } from "@/actions/sheetMutations";
import type { ListItem } from "@/components/ItemList";
import type { ViewerAuthState } from "@/types/auth";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

interface EntryContext {
  sectionId: string;
  entryIndex: number;
}

interface DetailPanelProps {
  item: ListItem | null;
  entryContext?: EntryContext | null;
  entrySectionType?: "topic" | "passage" | null;
  authState: ViewerAuthState;
  isAuthConfigured: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onClose?: () => void;
}

function isValidLink(link: string): boolean {
  if (!link.trim()) return false;

  try {
    const parsed = new URL(link);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function EntryDetail({
  item,
  entryContext,
  entrySectionType,
  authState,
  isAuthConfigured,
}: {
  item: ListItem & { kind: "entry" };
  entryContext?: EntryContext | null;
  entrySectionType?: "topic" | "passage" | null;
  authState: ViewerAuthState;
  isAuthConfigured: boolean;
}) {
  const { data } = item;
  const entryLabel =
    entrySectionType === "topic" ? "Topic / Title" : "Scripture Passage";
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    title: data.title,
    text: data.text,
    explanation: data.explanation,
    link: data.link,
  });
  const [isPending, startTransition] = useTransition();

  const canSave = useMemo(() => {
    return (
      authState.isEditor &&
      formValues.title.trim().length > 0 &&
      formValues.text.trim().length > 0
    );
  }, [authState.isEditor, formValues.text, formValues.title]);

  const submitChanges = () => {
    startTransition(() => {
      void (async () => {
        if (!entryContext) {
          setStatusMessage("This item cannot be edited in the current view.");
          return;
        }

        const result = await updateSectionEntryAction({
          sectionId: entryContext.sectionId,
          entryIndex: entryContext.entryIndex,
          title: formValues.title,
          text: formValues.text,
          explanation: formValues.explanation,
          link: formValues.link,
        });

        if (!result.ok) {
          setStatusMessage(result.message ?? "Unable to save changes.");
          return;
        }

        setStatusMessage(result.message ?? "Saved successfully.");
        setIsEditing(false);
        router.refresh();
      })();
    });
  };

  return (
    <div className="fade-in space-y-6">
      {/* Title */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {entryLabel}
        </p>
        <h2 className="gold-gradient-text mt-2 text-xl font-bold tracking-tight">
          {isEditing ? (
            <input
              type="text"
              value={formValues.title}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-base outline-none"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          ) : (
            data.title
          )}
        </h2>
      </div>

      {/* Scripture Text */}
      {data.text && (
        <div>
          <h3
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Text
          </h3>
          <div
            className="rounded-xl border p-4"
            style={{
              background: "var(--bg-tertiary)",
              borderColor: "var(--border-default)",
            }}
          >
            {isEditing ? (
              <textarea
                value={formValues.text}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, text: e.target.value }))
                }
                rows={6}
                className="w-full resize-y rounded-lg border px-3 py-2 text-[14px] leading-7 italic outline-none"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            ) : (
              <p
                className="whitespace-pre-wrap text-[14px] leading-7 italic"
                style={{ color: "var(--text-primary)" }}
              >
                {data.text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      {data.explanation && (
        <div>
          <h3
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Explanation
          </h3>
          {isEditing ? (
            <textarea
              value={formValues.explanation}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  explanation: e.target.value,
                }))
              }
              rows={6}
              className="w-full resize-y rounded-lg border px-3 py-2 text-[14px] leading-7 outline-none"
              style={{
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
              }}
            />
          ) : (
            <p
              className="whitespace-pre-wrap text-[14px] leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              {data.explanation}
            </p>
          )}
        </div>
      )}

      {/* Link */}
      {(data.link || isEditing) && (
        <div
          className="border-t pt-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <h3
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Reference
          </h3>
          {isEditing ? (
            <input
              type="url"
              placeholder="https://example.com"
              value={formValues.link}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, link: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          ) : (
            isValidLink(data.link) && (
              <a
                href={data.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-link)",
                  background: "var(--accent-gold-dim)",
                }}
              >
                <span>↗</span>
                <span>View on BibleHub</span>
              </a>
            )
          )}
        </div>
      )}

      {/* <div
        className="flex items-center justify-between gap-3 border-t pt-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div>
          {!authState.isEditor && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {!isAuthConfigured
                ? "Editor authentication is not configured yet."
                : authState.isAuthenticated
                  ? "This account is signed in as read-only. Ask an admin to add editor credentials for you."
                  : "Sign in with approved editor credentials to edit this entry."}
            </p>
          )}
          {statusMessage && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {statusMessage}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setStatusMessage(null);
                  setFormValues({
                    title: data.title,
                    text: data.text,
                    explanation: data.explanation,
                    link: data.link,
                  });
                }}
                disabled={isPending}
                className="rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-secondary)",
                  background: "var(--bg-tertiary)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitChanges}
                disabled={!canSave || isPending}
                className="rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all disabled:opacity-60"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-link)",
                  background: "var(--accent-gold-dim)",
                }}
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setStatusMessage(null);
              }}
              disabled={!entryContext || !authState.isEditor}
              className="rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all disabled:opacity-50"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-link)",
                background: "var(--accent-gold-dim)",
              }}
            >
              {authState.isEditor ? "Edit" : "Editors Only"}
            </button>
          )}
        </div>
      </div> */}
    </div>
  );
}

function renderResourceDetail(item: ListItem & { kind: "resource" }) {
  const { data } = item;

  return (
    <div className="fade-in space-y-6">
      <div>
        <span className="badge badge-resource mb-2 inline-block">
          {data.type}
        </span>
        <h2 className="gold-gradient-text mt-2 text-xl font-bold tracking-tight">
          {data.text}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          By {data.author}
        </p>
      </div>

      {data.explanation && (
        <div>
          <h3
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Description
          </h3>
          <p
            className="whitespace-pre-wrap text-[14px] leading-7"
            style={{ color: "var(--text-secondary)" }}
          >
            {data.explanation}
          </p>
        </div>
      )}

      {data.link && (
        <div
          className="border-t pt-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <a
            href={data.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-link)",
              background: "var(--accent-gold-dim)",
            }}
          >
            <span>↗</span>
            <span>View Resource</span>
          </a>
        </div>
      )}
    </div>
  );
}

function renderArticleDetail(item: ListItem & { kind: "article" }) {
  const { data } = item;

  return (
    <div className="fade-in space-y-6">
      <div>
        <span className="badge badge-article mb-2 inline-block">Article</span>
        <h2 className="gold-gradient-text mt-2 text-xl font-bold tracking-tight">
          {data.title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          By {data.author}
        </p>
      </div>

      <div>
        <p
          className="whitespace-pre-wrap text-[14px] leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          {data.article}
        </p>
      </div>
    </div>
  );
}

export function DetailPanel({
  item,
  entryContext,
  entrySectionType,
  authState,
  isAuthConfigured,
  isFullscreen,
  onToggleFullscreen,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  onClose,
}: DetailPanelProps) {
  if (!item) {
    return (
      <aside className="glass-panel flex h-full items-center justify-center rounded-2xl p-8">
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
            style={{ background: "var(--accent-gold-dim)" }}
          >
            📖
          </div>
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Select an Entry
          </h2>
          <p
            className="mt-2 max-w-60 text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Choose an entry from the list to view its full content, explanation,
            and references.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="glass-panel flex h-full flex-col overflow-hidden rounded-2xl">
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: "var(--border-default)" }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Detail View
        </p>
        <div className="flex items-center gap-2">
          {onPrev && (
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="flex h-7 w-7 items-center justify-center rounded-md border transition-all disabled:opacity-30"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                background: "var(--bg-tertiary)",
              }}
              title="Previous item"
            >
              ←
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="flex h-7 w-7 items-center justify-center rounded-md border transition-all disabled:opacity-30"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                background: "var(--bg-tertiary)",
              }}
              title="Next item"
            >
              →
            </button>
          )}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-md border transition-all"
              style={{
                borderColor: "var(--border-default)",
                color: isFullscreen
                  ? "var(--accent-gold)"
                  : "var(--text-secondary)",
                background: "var(--bg-tertiary)",
              }}
              title={isFullscreen ? "Minimize" : "Expand Fullscreen"}
            >
              {isFullscreen ? "⛌" : "⛶"}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-md border transition-all"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                background: "var(--bg-tertiary)",
              }}
              title="Close detail view"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {item.kind === "entry" && (
          <EntryDetail
            key={
              entryContext
                ? `${entryContext.sectionId}-${entryContext.entryIndex}`
                : "entry-detail"
            }
            item={item as ListItem & { kind: "entry" }}
            entryContext={entryContext}
            entrySectionType={entrySectionType}
            authState={authState}
            isAuthConfigured={isAuthConfigured}
          />
        )}
        {item.kind === "resource" &&
          renderResourceDetail(item as ListItem & { kind: "resource" })}
        {item.kind === "article" &&
          renderArticleDetail(item as ListItem & { kind: "article" })}
      </div>
    </aside>
  );
}
