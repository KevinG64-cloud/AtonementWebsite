# Atonement Examination

A lightweight Next.js scaffold for a Google Sheets-driven research interface.

## What is in place

- App Router with TypeScript and Tailwind.
- A three-pane workspace shell with chapter navigation, item list, and detail panel.
- A normalization layer that maps inconsistent sheet rows to a stable UI shape.
- A live Google Sheets loader that can read a public sheet link immediately and can also use the official Sheets API when an API key is provided.

## Data shape

The current normalization follows this pattern:

- `title = row.passage || row.topic || "Untitled"`
- `text = row.text || ""`
- `explanation = row.explanation || null`
- `link = row.link || null`

## Next integration step

Configure these environment variables if you want to point the app at a different spreadsheet or use the official Sheets API:

- `NEXT_PUBLIC_GOOGLE_SHEET_URL`
- `NEXT_PUBLIC_GOOGLE_SHEET_ID`
- `NEXT_PUBLIC_GOOGLE_SHEET_GID`
- `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY`

If the sheet is public, the app can read the tab from the provided link without an API key. If you want all tabs as chapters, add the API key so the app can read spreadsheet metadata and enumerate the sheet tabs.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
