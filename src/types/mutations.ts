export interface UpdateSectionEntryInput {
  sectionId: string;
  entryIndex: number;
  title: string;
  text: string;
  explanation: string;
  link: string;
}

export interface MutationResult {
  ok: boolean;
  message?: string;
}

export interface AppsScriptMutationResponse {
  ok?: boolean;
  message?: string;
}
