import type {
  AppsScriptMutationResponse,
  UpdateSectionEntryInput,
} from "@/types/mutations";

interface UpdateSectionEntryPayload {
  action: "updateSectionEntry";
  payload: UpdateSectionEntryInput;
}

export async function postUpdateSectionEntryToAppsScript(
  endpoint: string,
  secret: string,
  payload: UpdateSectionEntryPayload,
): Promise<AppsScriptMutationResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Apps-Script-Secret": secret,
    },
    body: JSON.stringify({
      ...payload,
      secret,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Apps Script mutation failed: ${response.status}`);
  }

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (
    responseText.trim().startsWith("<!DOCTYPE") ||
    responseText.trim().startsWith("<html")
  ) {
    throw new Error(
      "Apps Script returned HTML instead of JSON. Recheck the deployed Web App URL (/exec), deployment access, and that the doPost handler is in the deployed version.",
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `Apps Script returned a non-JSON response (${contentType || "unknown content-type"}). Body: ${responseText.slice(0, 200)}`,
    );
  }

  try {
    return JSON.parse(responseText) as AppsScriptMutationResponse;
  } catch {
    throw new Error(
      `Apps Script returned invalid JSON. Body: ${responseText.slice(0, 200)}`,
    );
  }
}
