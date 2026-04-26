import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      isEditor: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isEditor?: boolean;
  }
}
