import type { UpdateSectionEntryInput } from "@/types/mutations";

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 10000;
const MAX_EXPLANATION_LENGTH = 12000;

function isValidHttpUrl(value: string): boolean {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateUpdateSectionEntryInput(
  input: UpdateSectionEntryInput,
): string | null {
  if (!input.sectionId.trim()) return "Section ID is required.";
  if (!Number.isInteger(input.entryIndex) || input.entryIndex < 0) {
    return "Entry index must be a non-negative integer.";
  }

  if (!input.title.trim()) return "Title is required.";
  if (input.title.length > MAX_TITLE_LENGTH) {
    return `Title is too long (max ${MAX_TITLE_LENGTH} characters).`;
  }

  if (!input.text.trim()) return "Text is required.";
  if (input.text.length > MAX_TEXT_LENGTH) {
    return `Text is too long (max ${MAX_TEXT_LENGTH} characters).`;
  }

  if (input.explanation.length > MAX_EXPLANATION_LENGTH) {
    return `Explanation is too long (max ${MAX_EXPLANATION_LENGTH} characters).`;
  }

  if (!isValidHttpUrl(input.link)) {
    return "Link must be a valid http(s) URL or left empty.";
  }

  return null;
}
