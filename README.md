# Niagara Wedding & Event Rentals

A fully redesigned, self-contained website prepared for GitHub and Vercel. All photography, fonts, branding, product pages and the original hotel setup contract are included locally. Visitors never need to return to the old Squarespace website.

## Upload and deploy

1. Upload **the contents of this folder** to a GitHub repository. Include `public`, `api`, `scripts`, both package files, the `.mjs` source files and `vercel.json`. Do not upload `node_modules`, `dist` or a private `.env` file.
2. In Vercel, import that repository. Choose **Other** as the framework if asked. The included configuration sets the build command to `npm run build` and output directory to `dist`.
3. Use Node.js 22 or newer. Deploy. If this folder is nested inside a larger repository, select it as the Vercel project’s Root Directory.
4. To use a custom domain, add it in Vercel and set `SITE_URL` to its full HTTPS URL, then redeploy. Without this setting, the build uses Vercel’s production URL automatically.

Every page includes the branded logo sharing card, unique title and description, a canonical URL and search-engine metadata. Social apps may cache previews; a newly deployed URL must be publicly accessible to their crawlers. No localhost URL is used in a Vercel production build when its standard system environment variables are exposed.

## Turn on inquiry emails

The site uses a Vercel function and the [Resend email API](https://resend.com/docs/api-reference/emails/send-email). In your own Resend account, verify a sending domain. Add these environment variables in Vercel, then redeploy:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | Your private Resend API key |
| `INQUIRY_FROM` | A verified sender, e.g. `Niagara Events <bookings@your-domain.com>` |
| `INQUIRY_TO` | Defaults to `info@niagaraweddingandeventrentals.com`; set a different business inbox only if intended |
| `SITE_URL` | Optional custom HTTPS origin, no path |

Keys stay on the server. Never put them in the browser code or a public repository.

Until this connection is configured, the form clearly says the inquiry has **not** been sent. It offers a prefilled email draft and a copyable message. Hotel customers can download their signed PDF and attach it to that email themselves. A `mailto:` link cannot attach a file automatically.

After deployment, send one real test inquiry that you authorize and verify receipt, including the attachment for a hotel service. Live email delivery has not been tested here because no email credentials were supplied. No emails were sent during development.

## Hotel contract workflow

- Applies to **Romantic Hotel Room Setup** and **Bridal Getting Ready Hotel Room Package**.
- Triggered by either service selection or either hotel item in the shortlist. Changing the general service dropdown does not bypass the requirement while a hotel item remains selected.
- Shows the original six-page PDF for review and download.
- Requires a typed full legal name and explicit agreement checkbox. Neither is prefilled or prechecked.
- Enforces the requirement in both the browser and Vercel function.
- Fills only the customer name, signature and date fields on page six. The original terms and company representative fields are preserved.
- Appends a signature record with the consent text, contract version, original document hash, event details and submission reference. When delivery succeeds, the customer download matches the server-generated attachment.
- Leaves the company countersignature pending. Inquiries do not confirm bookings or take payment. The business must review the agreement, confirm the quote and collect the deposit.
- No identity verification, cryptographic signing certificate or dedicated e-signature provider is included. This is typed electronic signature capture, not a DocuSign-style verified identity service.
- Signatures are not stored in browser storage. Accepted contracts are delivered as email attachments to the configured business inbox. Set inbox access and retention according to your business’s needs.

The supplied contract specifies **20 helium balloons** for both hotel packages. The old website specified 25; the new descriptions use 20 to match the supplied agreement. Other listed prices were carried over from the source catalogue and remain subject to the business’s quote.

If replacing the contract, replace `public/contracts/hotel-room-setup.pdf`, update `CONTRACT_VERSION` in `public/contract.mjs`, and verify the signature field positions against the new PDF before deployment.

## Local preview

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. The simple local preview serves the complete website. Local email submissions deliberately return an unavailable response so no email is sent. Run `npm run build` after source edits, then refresh the browser. `vercel dev` may be used for live function integration only after you configure your own environment.

## Editing the site

- `site.mjs`: shared layout and homepage.
- `pages.mjs`: collection, rental detail pages, packages, about, FAQs, testimonials, inquiry, privacy and 404 page.
- `catalogue.json`: 29 rental/service entries and source prices.
- `public/style.css`: responsive design.
- `public/app.js`: filters, shortlist, inquiry and customer signature flow.
- `public/contract.mjs`: shared signature rules and PDF generation.
- `api/inquiry.js`: server validation, signed PDF attachment and email delivery.
- `build.mjs`: produces the 38 static pages, metadata, sitemap and locally bundled PDF libraries.
- `vercel.json`: hosting configuration and redirects from former page paths to redesigned pages on the **new host**. These never redirect visitors to the old host.

## Checks completed

`npm run check` verifies all generated internal links/assets, branded share metadata, contract triggers, rejection of unsigned hotel requests, invalid dates and unknown rentals, signed document page count and the mocked email attachment flow. It never sends mail.

Also reviewed in the browser: 1440px desktop and 390px mobile layouts, image loading, rental filtering/search, shortlist persistence/removal, mobile navigation and hotel signature requirements. Both WebMCP shortlist tools were checked with valid and invalid inputs. The PDF signature page and appended record were rendered and visually checked using test data only.

## Asset provenance

Business details and photographs were sourced from the [existing business website](https://www.niagaraweddingandeventrentals.com/) for this requested redesign. They are copied into this project and are not loaded from that website at runtime. The original hotel contract was supplied by the user. Cormorant Garamond and Manrope fonts are bundled locally under their included licenses.

The logo sharing card is `public/og.png` (1730 × 909), generated once with the built-in image generation tool using the existing logo as reference. Prompt: “Elegant wedding editorial landscape social card, warm ivory #f7f5ef, deep olive #343c2f and restrained brass-gold. Preserve the supplied Niagara Wedding & Event Rentals logo and recognizable gold party-popper. Center the logo above the exact headline ‘A little play. A lot of memories.’ and the smaller line ‘Lawn games & thoughtful rentals • Niagara, Ontario’. Plenty of breathing room; no URLs, additional logos, photos, or invented claims.”
