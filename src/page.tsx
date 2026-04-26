import { AppWorkspace } from "@/components/AppWorkspace";
import { getViewerAuthState, isAuthConfigured } from "@/lib/auth";
import { fetchAppData } from "@/lib/fetchAppData";

export default async function Home() {
  const [appData, authState] = await Promise.all([
    fetchAppData(),
    getViewerAuthState(),
  ]);
  const showEditorAccess = process.env.NEXT_PUBLIC_SHOW_EDITOR_ACCESS === "1";

  return (
    <AppWorkspace
      initialData={appData}
      authState={authState}
      isAuthConfigured={isAuthConfigured}
      showEditorAccess={showEditorAccess}
    />
  );
}
