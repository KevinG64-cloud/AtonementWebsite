import type { AppData } from "@/types/research";

const FALLBACK_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxm0rnJZbX0c6y9cwjndJmBHaxNxCRdk4rHipVx_1EwwSifD3MdxQN6oNJloCYm1h8XKg/exec";
export const APP_DATA_TAG = "app-data";

/**
 * Fetch data from the Apps Script endpoint.
 * Used server-side in page.tsx so data arrives pre-rendered.
 * Next.js will cache this during build/request based on revalidate.
 */
export async function fetchAppData(): Promise<AppData> {
  const endpoint = process.env.APPS_SCRIPT_URL ?? FALLBACK_APPS_SCRIPT_URL;

  const response = await fetch(endpoint, {
    next: { revalidate: 300, tags: [APP_DATA_TAG] }, // revalidate every 5 minutes
  });

  console.log("Fetching app data from Apps Script...");

  if (!response.ok) {
    throw new Error(`Failed to fetch app data: ${response.status}`);
  }
  return (await response.json()) as AppData;
}
