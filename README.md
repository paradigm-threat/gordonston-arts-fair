This is a [Next.js](https://nextjs.org/) project. Source is on GitLab: [clevertree/gordonston-arts-fair](https://gitlab.com/clevertree/gordonston-arts-fair).

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

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Stripe
```shell
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe
stripe trigger payment_intent.succeeded
```

## Maintenance: Audit and Export Blobs

These tools help reconcile Vercel Blob storage with PostgreSQL records and optionally export blobs locally.

Prerequisites:
- Ensure `.env.local` contains valid database and Vercel Blob credentials. The scripts load `../.env.local` relative to `scripts/`.

Scripts:
- Audit storage vs DB (dry run, no writes):
  ```bash
  npm run audit:blobs -- --preview
  # Scope to a single user id:
  npm run audit:blobs -- --user=123 --preview
  ```
- Audit with inserts enabled (writes missing blobs into DB):
  ```bash
  npm run audit:blobs
  npm run audit:blobs -- --user 123
  ```
- Export all blobs to a local folder `../backup/blobs`:
  ```bash
  npm run export:blobs
  ```

Notes:
- Matching uses normalized pathnames like `uploads/<userId>/<width>-<height>/<filename>`.
- Width/height are parsed from the path when available; otherwise set to `0` for inserted rows.
- Rows that reference missing blobs are reported but not modified.

## Upload flow change (resilience against disappearing images)

To prevent images from “disappearing” when the blob upload succeeds or fails inconsistently, the upload process is now:
1. Create a DB row first with an empty `url` and known `title`, `width`, and `height`.
2. Upload the file to Vercel Blob.
3. Update the DB row with the returned blob `url`.

If an upload fails, the DB row remains with an empty `url`. The UI displays a warning next to that entry: “Upload incomplete — please re-upload this image to finalize it.” Deleting such an entry will skip deleting from blob storage (since there is no URL).
