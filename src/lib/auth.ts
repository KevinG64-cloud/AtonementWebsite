import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { ViewerAuthState } from "@/types/auth";

interface EditorAccount {
  email: string;
  passwordHash: string;
  passwordHashBase64?: string;
  name?: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getConfiguredEditorAccounts(): EditorAccount[] {
  const raw = process.env.EDITOR_CREDENTIALS_JSON ?? "";

  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const accounts: EditorAccount[] = [];

    for (const value of parsed) {
      if (!value || typeof value !== "object") continue;

      const account = value as Partial<EditorAccount>;
      const email = typeof account.email === "string" ? account.email : "";
        const passwordHash =
          typeof account.passwordHash === "string" ? account.passwordHash : "";
        const passwordHashBase64 =
          typeof account.passwordHashBase64 === "string"
            ? account.passwordHashBase64
            : "";
        const name = typeof account.name === "string" ? account.name : undefined;

      if (!email.trim() || (!passwordHash.trim() && !passwordHashBase64.trim())) {
        continue;
      }

      accounts.push({
        email: normalizeEmail(email),
        passwordHash: passwordHashBase64.trim()
          ? Buffer.from(passwordHashBase64, "base64").toString("utf8")
          : passwordHash,
        name,
      });
    }

    return accounts;
  } catch (error) {
    console.error("[auth] Failed to parse EDITOR_CREDENTIALS_JSON", error);
    return [];
  }
}

function getEditorEmails(): string[] {
  const fromAccounts = getConfiguredEditorAccounts().map((account) => account.email);
  const fromAllowlist = (
    process.env.EDITOR_EMAILS ??
    process.env.AUTHORIZED_EDITOR_EMAILS ??
    ""
  )
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  return [...new Set([...fromAccounts, ...fromAllowlist])];
}

function findEditorAccount(email: string): EditorAccount | null {
  const normalizedEmail = normalizeEmail(email);

  return (
    getConfiguredEditorAccounts().find(
      (account) => account.email === normalizedEmail,
    ) ?? null
  );
}

export function isEditorEmail(email?: string | null): boolean {
  if (!email) return false;
  return getEditorEmails().includes(normalizeEmail(email));
}

export const isAuthConfigured = Boolean(
  process.env.AUTH_SECRET && getConfiguredEditorAccounts().length > 0,
);

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: isAuthConfigured
    ? [
        CredentialsProvider({
          name: "Editor Login",
          credentials: {
            email: {
              label: "Email",
              type: "email",
            },
            password: {
              label: "Password",
              type: "password",
            },
          },
          async authorize(credentials) {
            const email =
              typeof credentials?.email === "string" ? credentials.email : "";
            const password =
              typeof credentials?.password === "string"
                ? credentials.password
                : "";

            if (!email.trim() || !password) {
              return null;
            }

            const account = findEditorAccount(email);
            if (!account) {
              return null;
            }

            const isValidPassword = await compare(
              password,
              account.passwordHash,
            );

            if (!isValidPassword) {
              return null;
            }

            return {
              id: account.email,
              email: account.email,
              name: account.name ?? account.email,
            };
          },
        }),
      ]
    : [],
  callbacks: {
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      token.isEditor = isEditorEmail(email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isEditor = Boolean(token.isEditor);
        if (!session.user.email && typeof token.email === "string") {
          session.user.email = token.email;
        }
      }

      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function getViewerAuthState(): Promise<ViewerAuthState> {
  const session = await getServerAuthSession();
  const email = session?.user?.email ?? null;

  return {
    isAuthenticated: Boolean(session?.user),
    isEditor: Boolean(session?.user?.isEditor),
    email,
  };
}
