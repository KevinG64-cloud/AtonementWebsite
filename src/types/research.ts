/* ──────────────────────────────────────────────
   Types matching the Apps Script API response
   ────────────────────────────────────────────── */

// ── Navigation ────────────────────────────────

export type NavType = "section" | "resources" | "articles" | "meta";

export interface NavItem {
  id: string;
  title: string;
  type: NavType;
}

// ── Sections (passages & topics) ──────────────

export interface SectionEntry {
  title: string;
  text: string;
  explanation: string;
  link: string;
}

export interface Section {
  id: string;
  title: string;
  type: "passage" | "topic";
  entries: SectionEntry[];
}

// ── Resources ─────────────────────────────────

export interface Resource {
  type: string;
  text: string;
  author: string;
  explanation: string;
  link: string;
}

// ── Articles ──────────────────────────────────

export interface Article {
  title: string;
  author: string;
  article: string;
}

// ── Meta ──────────────────────────────────────

export interface WelcomeMenuItem {
  image: string;
  menuItem: string;
  text: string;
}

export interface Welcome {
  image: string;
  menuItems: WelcomeMenuItem[];
}

export interface Introduction {
  image: string;
  title: string;
  text: string;
}

export interface AppStoryItem {
  title: string;
  text: string;
}

export interface Meta {
  welcome: Welcome;
  introduction: Introduction;
  appStory: AppStoryItem[];
}

// ── Root ──────────────────────────────────────

export interface AppData {
  meta: Meta;
  navigation: NavItem[];
  sections: Section[];
  resources: Resource[];
  articles: Article[];
}
