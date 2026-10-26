# Storefront, admin sign-in, and WhatsApp enquiries

## Architecture

- Next.js App Router serves the storefront, admin portal, and API routes.
- PostgreSQL is accessed through Prisma. The catalog, pack prices, stock, store settings, enquiries, and audit history live in the database.
- Customers can browse products, save favourites, and build a cart without signing in. The cart is stored in the browser.
- Checkout is a WhatsApp enquiry, not a payment-gateway flow. The shop confirms availability and delivery charges in WhatsApp, then sends its payment QR code manually. Enquiries do not reserve or decrement stock.
- Product uploads use Vercel Blob. Product images included in `public/products` are used to seed new catalog items.

## Environment

Copy `.env.example` to `.env.local` for local development or set equivalent server-side values in the deployment provider:

- `DATABASE_URL`: pooled PostgreSQL connection string for application traffic.
- `DIRECT_URL`: direct PostgreSQL connection string for migrations.
- `ADMIN_EMAILS`: up to three approved administrator Google account email addresses, comma-separated.
- Optional administrator phone sign-in uses `ADMIN_PHONE_NUMBERS` and `ADMIN_PASSWORD`. Set the password to a randomly generated secret of at least 16 characters. There are no built-in/default administrator phone numbers or passwords.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`: Google sign-in configuration for administrator accounts.
- `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, and `AUTH_BASE_URL`: required to register customer email/password accounts, verify email addresses, and send password reset links. The sender must be verified with Resend; `AUTH_BASE_URL` must be the exact public site origin.
- `BLOB_READ_WRITE_TOKEN`: required for administrator image uploads.
- Optional Meta WhatsApp notifications use `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_NOTIFICATION_NUMBER`, an approved submission template, and `NOTIFICATION_DISPATCH_SECRET`.

Never expose secrets through `NEXT_PUBLIC_` variables or commit them to source control. The WhatsApp number used to open customer enquiries is managed separately in Admin → Store settings.

## Database setup

1. Configure the PostgreSQL connection strings.
2. Run `npm run db:generate`.
3. Run `npm run db:deploy` to apply the Prisma migrations.
4. Add each shop owner's Google account email to `ADMIN_EMAILS` to grant admin access.
5. Run `npm run db:seed` to create the initial catalog and default storefront settings. Configured admin emails are synchronized to the allowlist; an empty value preserves any existing allowlist.
6. Review all seeded product prices and set actual pack stock in Admin → Products before accepting enquiries. Seeded stock is zero so the site does not claim unverified availability.

The seed maps the earlier sample catalog to the current Sudar Oli product names and adds the cleaned varieties. Existing pack prices and stock are preserved. Default product photos are refreshed from `public/products`; administrator-uploaded Blob images are preserved.

## Administrator and customer sign-in

Administrators may sign in with an allowlisted Google account or, when configured, a phone number from `ADMIN_PHONE_NUMBERS` and the server-only `ADMIN_PASSWORD`. The admin password must be at least 16 characters; it is never prefilled or included in application code. Remove any old default PINs from environment files. Phone sign-in is denied when the allowlist or password is missing.

Customer accounts are created with an email address, then activated by confirming a single-use email verification link and choosing a password. Passwords are stored as scrypt hashes. Password reset links are single-use and expire after one hour. Sign-in and email requests are rate-limited per account. Google sign-in remains available and creates a customer account for a verified Google email that is not on the administrator allowlist.

Successful sign-in creates a random 30-day HttpOnly session cookie; only its hash is stored in PostgreSQL. Admin pages and APIs validate the database session and admin allowlist. Non-admin users receive a not-found response for protected admin routes.

Authenticated customer submissions are associated with the signed-in account. Customers can view these at **My enquiries** in the storefront header. Anonymous and historical submissions are not automatically linked to accounts; only submissions created while signed in appear in that account's enquiry list.

## Catalog, inventory, and images

The shop and `/api/catalog` read active products, pack prices, and stock from PostgreSQL. Prices are stored in paise; admin product forms accept rupees. Admins can add products, edit product copy and photos, update each pack's price and stock, add or remove pack sizes, hide/show products, and delete duplicates. Product changes are written to the audit log.

Stock is counted in packs for each variant. A pack size with one pack remaining is labelled “Only 250 g left” (or the applicable weight); zero is sold out. An enquiry does not reduce stock: update inventory in Admin after confirming the order.

## WhatsApp enquiries and notifications

The cart refreshes current prices and stock from `/api/catalog` before creating its WhatsApp message. The customer sends the enquiry directly to the store's configured WhatsApp number. The shop confirms availability and shipping, then shares the payment QR manually. No payment gateway is required or invoked.

`POST /api/storefront/enquiry` records the requested products and quantities for Admin → Inquiries. When the customer is signed in, the submission is privately linked to that account for **My enquiries**. The scheduled Meta business-notification dispatcher is currently disabled; the customer WhatsApp enquiry works independently and does not require Meta API credentials.

Contact and bulk-order forms are also recorded for the admin. Review their status and delivery behavior in Admin → Inquiries.

## Local and production checks

Without database credentials, catalog and account APIs remain unavailable; without Google OAuth credentials, Google sign-in is disabled; without `ADMIN_PHONE_NUMBERS` and `ADMIN_PASSWORD`, administrator phone sign-in is disabled; without the Resend settings, customer password registration and recovery are disabled. There is no development admin bypass.

Before launch, run `npm run lint`, `npm run build`, and `npm run db:deploy` against the intended environment. Configure and test the real database, allowlisted Google accounts, image storage, WhatsApp number, and manual QR workflow before inviting customers.
