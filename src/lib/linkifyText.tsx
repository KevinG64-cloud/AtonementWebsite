import type { ReactNode } from "react";

const LINK_OR_EMAIL_REGEX =
  /((https?:\/\/[^\s]+)|(www\.[^\s]+)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}))/gi;

function trimTrailingPunctuation(value: string): {
  core: string;
  trailing: string;
} {
  let end = value.length;

  while (end > 0 && /[.,!?;:)]/.test(value[end - 1])) {
    end -= 1;
  }

  return {
    core: value.slice(0, end),
    trailing: value.slice(end),
  };
}

function normalizeHref(raw: string): string {
  if (raw.includes("@") && !raw.startsWith("mailto:")) {
    return `mailto:${raw}`;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `https://${raw}`;
}

export function linkifyText(text?: string | null): ReactNode[] {
  const source = String(text ?? "");
  const output: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(LINK_OR_EMAIL_REGEX)) {
    const fullMatch = match[0];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      output.push(source.slice(lastIndex, matchIndex));
    }

    const { core, trailing } = trimTrailingPunctuation(fullMatch);

    if (core.length > 0) {
      output.push(
        <a
          key={`link-${matchIndex}-${core}`}
          href={normalizeHref(core)}
          target="_blank"
          rel="noreferrer"
        >
          {core}
        </a>,
      );
    }

    if (trailing.length > 0) {
      output.push(trailing);
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < source.length) {
    output.push(source.slice(lastIndex));
  }

  return output;
}
