# Production launch checklist

Complete these steps before accepting customer enquiries.

## 1. Database and catalog

- In the production deployment environment, set `DATABASE_URL` for pooled PostgreSQL traffic and `DIRECT_URL` for migrations. Never copy credentials into source control or send them in chat.
- Run `npm run db:generate`, `npm run db:deploy`, and `npm run db:seed`.
- Verify `/api/health` reports a connected database and `/api/catalog` returns the expected catalog and WhatsApp number.
- In the database provider, confirm automated backups or point-in-time recovery are enabled and record how to restore a backup before accepting orders.
- In Admin → Products, confirm every product name, pack size, price, photo, and stock count. Seeded stock is zero by design; set actual availability before opening the shop.
- Confirm the listed contact address, phone numbers, map, operating hours, FSSAI license number, and delivery information with the business owner.

## 2. Administrator access

- Set `ADMIN_EMAILS` in the production deployment environment to only the shop owners' approved Google account email addresses. The seed script synchronizes these addresses to the database admin allowlist.
- Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in the production deployment environment. Use the exact HTTPS callback URL `https://<production-domain>/api/auth/google/callback` and register the same URL in Google Cloud Console → OAuth client → Authorized redirect URIs. Production sign-in intentionally fails closed if the redirect URI is missing or invalid.
- Configure `AUTH_BASE_URL` as the production HTTPS origin. For customer registration and password recovery, also set `RESEND_API_KEY` and `AUTH_EMAIL_FROM` to a verified sender in Resend; if these are unset, email-based account flows remain unavailable.
- In Google Cloud Console, review the OAuth consent screen, authorized domains, and published/test-user status. Do not treat a successful local OAuth flow as proof that production sign-in is configured.
- Test sign-in for each approved account. Confirm an unapproved account cannot access `/admin/products` or `/api/admin/*`.
- Test that non-admin accounts cannot access `/admin/*` pages or `/api/admin/*` endpoints.

## 3. Storefront and manual payment flow

- Set the WhatsApp business number in Admin → Store settings and confirm it opens the correct `wa.me` chat from both a product page and the cart.
- Add a product to the cart, change its quantity, and verify the enquiry message includes the current product, pack, quantity, and price.
- Confirm out-of-stock packs cannot be added, and that one remaining pack shows its weight in the availability message.
- Confirm submitting a WhatsApp enquiry does not decrement stock. The shop owner should confirm availability and delivery charges, send the QR code manually, and update stock after confirming the order.
- No payment gateway credentials, checkout callback, or payment webhook are needed for this workflow.

## 4. Admin operations

- Upload and replace a product photo after setting `BLOB_READ_WRITE_TOKEN`.
- Create a product, edit its content and pack prices, update stock, add/remove a pack size, hide/show a listing, and delete a duplicate.
- Confirm products with order history are hidden rather than permanently deleted, and that edits create audit log entries.
- Submit a test contact form and bulk enquiry; confirm both appear in Admin → Inquiries.
- The scheduled Meta business-notification dispatcher is currently disabled. Do not rely on automated notifications; the customer WhatsApp enquiry itself opens a direct conversation with the shop.

## 5. Policies and release

- Review `/privacy`, `/terms`, `/shipping`, and `/refunds` with the business owner. Ensure the pages describe enquiry-based ordering and manual QR payment rather than online checkout.
- Run `npm run lint` and `npm run build`; run the Playwright suite if browser tests are configured.
- Repeat the storefront and admin checks on desktop and mobile.
- Configure database backups, production monitoring, and an incident contact before launch.
- In the deployment provider, verify production environment variables are scoped to Production, redeploy after changing them, and confirm the deployed `/api/health` and `/api/catalog` responses. Record the production URL, deployment identifier, backup restore procedure, monitoring alert destination, and incident contact. Do not run load tests against production without an agreed low-impact limit.

## Vercel setup

1. In Vercel, open the project’s **Settings → Environment Variables** and add the required values below with the **Production** environment selected. Keep credentials in Vercel; do not paste them into source files, commits, or chat.
   - Required for the database-backed app: `DATABASE_URL`, `DIRECT_URL`, `ADMIN_EMAILS`.
   - Required for administrator Google sign-in: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
   - Required for customer email verification and password recovery: `AUTH_BASE_URL`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`.
   - Required only if administrators upload product images: `BLOB_READ_WRITE_TOKEN`.
   - Optional: `CRON_SECRET` for Vercel Cron authorization; `NOTIFICATION_DISPATCH_SECRET` for manual dispatcher POST requests. Automated WhatsApp notifications are disabled in this project and are not required for customer enquiries.
2. Add the Vercel production domain under **Settings → Domains** and complete Vercel’s DNS instructions. Use the resulting canonical HTTPS origin (no path or trailing slash) for `AUTH_BASE_URL`.
3. In Google Cloud Console, add the exact URL `https://<production-domain>/api/auth/google/callback` to the OAuth client’s **Authorized redirect URIs**. Set that exact value as Vercel’s `GOOGLE_REDIRECT_URI`; use the same OAuth client ID and secret from Google Cloud Console. Do not use `localhost` or a preview domain for production sign-in.
4. For Resend, verify the sending domain and configure an approved sender address for `AUTH_EMAIL_FROM`. Test verification and password recovery only with a mailbox you control.
5. In Neon (or the actual PostgreSQL provider), verify automatic backups or point-in-time recovery, retention, and a documented restore procedure. Confirm the production database is separate from development data, then run migrations and seed only the intended production catalog/admin allowlist.
6. In Vercel, configure deployment/runtime monitoring and an alert destination; confirm the database provider also alerts on connection, storage, and backup failures. Redeploy after environment-variable changes, then run the checks and record evidence described in sections 1, 2, and 5 above.

## Current environment limitations

This workspace can verify only the local configuration. It cannot verify production provider settings, live environment-variable values, backup restoration, monitoring, or OAuth consent/redirect registration. Configure and verify these in the deployment provider and Google Cloud Console, preferably in staging; do not assume a successful production connection from a local build.
