"use server";

import { postUpdateSectionEntryToAppsScript } from "@/lib/appsScriptMutationClient";
import { getServerAuthSession } from "@/lib/auth";
import { APP_DATA_TAG } from "@/lib/fetchAppData";
import { validateUpdateSectionEntryInput } from "@/lib/mutationValidation";
import type {
  MutationResult,
  UpdateSectionEntryInput,
} from "@/types/mutations";
import { updateTag } from "next/cache";

export async function updateSectionEntryAction(
  input: UpdateSectionEntryInput,
): Promise<MutationResult> {
  const session = await getServerAuthSession();

  if (!session?.user?.isEditor) {
    return {
      ok: false,
      message:
        "You must sign in with an approved editor account to save changes.",
    };
  }

  if (process.env.DISABLE_MUTATIONS === "1") {
    return { ok: false, message: "Mutations are currently disabled." };
  }

  const validationError = validateUpdateSectionEntryInput(input);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  const endpoint =
    process.env.APPS_SCRIPT_URL ??
    "https://script.google.com/macros/s/AKfycbzBiMvQUhD3i1mPRR_J5zgGKD4_PxrRPDmGpM2tnP5QATgko4KpxUmD-UxZ-UzWNSHXEA/exec";
  const secret = process.env.APPS_SCRIPT_SECRET;

  if (!secret) {
    return {
      ok: false,
      message:
        "Missing APPS_SCRIPT_SECRET in environment. Set it before mutating data.",
    };
  }

  try {
    const mutationId = crypto.randomUUID();

    console.log("[sheetMutations] updateSectionEntry requested", {
      mutationId,
      sectionId: input.sectionId,
      entryIndex: input.entryIndex,
    });

    const result = await postUpdateSectionEntryToAppsScript(endpoint, secret, {
      action: "updateSectionEntry",
      payload: input,
    });

    if (!result.ok) {
      return {
        ok: false,
        message: result.message ?? "Apps Script rejected update.",
      };
    }

    updateTag(APP_DATA_TAG);

    console.log("[sheetMutations] updateSectionEntry success", {
      mutationId,
      sectionId: input.sectionId,
      entryIndex: input.entryIndex,
    });

    return { ok: true, message: result.message ?? "Saved successfully." };
  } catch (error) {
    console.error("[sheetMutations] updateSectionEntry failure", error);
    return {
      ok: false,
      message: "Failed to save changes. Please try again.",
    };
  }
}
