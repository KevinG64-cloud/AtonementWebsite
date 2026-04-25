# Change Playbook (One Page)

## Purpose

This app is designed so most updates happen in Google Sheets, without code changes.
Use this guide to decide what can be changed by content editors vs. what needs a developer.

## 1) Fast Path: No Code Changes (Autopilot)

Use Google Sheets for:

- Passage/topic text updates
- Explanation and link updates
- Resource and article content updates
- Home/introduction/welcome copy updates

If your update is content-only, edit the sheet and refresh the app.

## 2) When To Edit Code (and Where)

### SEO and page metadata

- File: src/app/layout.tsx
- Use for: title, description, keywords, social metadata

### Search engine indexing

- File: src/app/robots.ts
- Use for: crawl allow/disallow rules
- File: src/app/sitemap.ts
- Use for: pages included in sitemap.xml

### Authentication / editor access

- File: src/lib/auth.ts
- File: src/app/api/auth/[...nextauth]/route.ts
- Use for: who can log in, credential handling, auth behavior

### Data read/write integration

- File: src/lib/fetchAppData.ts
- Use for: read endpoint and cache behavior
- File: src/actions/sheetMutations.ts
- Use for: server-side write actions and permission checks
- File: apps-script/Code.gs
- Use for: sheet parsing and mutation logic in Google Apps Script

### UI/layout changes

- Files in: src/components/
- Use for: visual layout, interactions, and component behavior

## 3) Environment Variables (Deployment)

Reference file: .env.example

Required for production:

- AUTH_SECRET
- EDITOR_CREDENTIALS_JSON
- APPS_SCRIPT_URL
- APPS_SCRIPT_SECRET

Optional:

- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_SHOW_EDITOR_ACCESS
- EDITOR_EMAILS
- AUTHORIZED_EDITOR_EMAILS
- DISABLE_MUTATIONS

## 4) Safe Release Checklist (10 minutes)

1. Confirm environment variables are set in hosting.
2. Run: npm run lint
3. Run: npm run build
4. Validate key user flows:
   - Home renders
   - Navigation opens sections/resources/articles
   - Editor sign-in works
   - Save/update works (if mutations enabled)
5. Spot-check robots.txt and sitemap.xml endpoints.

## 5) How To Roll Back Quickly

- Content issue: revert the Google Sheet row/tab change.
- Deployment issue: redeploy previous stable commit.
- Emergency freeze of edits: set DISABLE_MUTATIONS=1.

## 6) Current Limitation and Autopilot Upgrade

### Current limitation

New content tabs are currently hard-coded in Apps Script (SECTION_SHEETS), so adding a brand-new tab may require Apps Script update.

### Recommended upgrade

Implement dynamic section discovery in Apps Script:

- Read all tabs in the spreadsheet
- Ignore reserved meta tabs (Welcome, Home, This APPs Story, Resources, Articles)
- Auto-include any remaining tab that has expected headers (title/topic/passage + text + explanation + link)
- Keep section type auto-detected from headers or tab name

Result:

- Client can create a new valid tab and it appears automatically in app navigation, with no code change.

---

If a requested change is unclear, first ask: "Is this content-only or behavior/feature change?"
That single question usually routes the task to the right workflow.
