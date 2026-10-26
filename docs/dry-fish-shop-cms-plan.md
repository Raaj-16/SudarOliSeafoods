# Dry Fish Shop CMS: Historical Plan

> This is an earlier architecture plan and is not a specification of the current implementation. The current storefront uses WhatsApp enquiries and manual QR payment; it does not use online checkout or a payment gateway. See [the current setup guide](./storefront-submissions.md) and [production launch checklist](./production-launch-checklist.md) for implemented behavior.

I fetched the reference site, but it's a client-rendered SPA. All I got back was the title ("Sudar Oli Dry Sea Foods — Sun-Dried, Sea to Doorstep") and none of the layout, colors, fonts, or content. So the page structure below follows your requirements, and design fidelity needs one extra input, covered in section 2.

---

## 1. Architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript | Frontend, API routes, and server actions in one codebase |
| Styling | Tailwind CSS | Easy to match the existing design tokens |
| Database | PostgreSQL (Neon or Supabase) + Prisma | Relational fit for stock, orders, and payments; transactions for stock safety |
| Auth | Google OAuth + allowlisted administrator emails | No SMS dependency |
| Cache and rate limits | Upstash Redis | Abuse protection |
| Payments | Razorpay (cards, netbanking, UPI) + COD | Webhooks give reliable confirmation |
| Email | Resend or AWS SES | Optional order notifications |
| WhatsApp | Meta WhatsApp Cloud API (or Gupshup/Interakt) | Business-initiated messages require pre-approved templates |
| Images | Cloudinary or Vercel Blob | Product photos uploaded by admins |
| Background jobs | Inngest or Upstash QStash | Retries for notifications |
| Hosting | Vercel | Same platform as the current site |

---

## 2. Design replication (minimal changes)

Hash routing (`/#/...`) becomes real routes (`/products/...`), which is better for SEO and sharing. To keep the look identical:

1. Best: if you own the current site's source repo, share it. Components, CSS, and assets can be ported almost directly.
2. Otherwise: send screenshots of each page, or run DevTools on the live site and capture the colors, font families, spacing, and image files. I can turn those into a Tailwind theme and component inventory.
3. Build the shared pieces first (navbar, banner, product card, footer), then pages, and compare each side by side with the live site.

---

## 3. Pages and routes

| Page | Route | Rendering |
| --- | --- | --- |
| Home (menu bar, banner, featured items) | `/` | ISR, revalidated on admin edits |
| Item listing / categories | `/items` | ISR |
| PLP (search, filters, sort) | `/products?category=&q=&min=&max=&sort=` | Server-rendered, URL-driven filters |
| PDP | `/products/[slug]` | ISR + tag revalidation |
| How We Dry | `/how-we-dry` | Static (content in `site_content` if you want it editable) |
| Bulk Order | `/bulk-order` | Form to `bulk_inquiries` |
| Contact | `/contact` | Form + click-to-chat WhatsApp link |
| Cart / Checkout / Orders / Favorites | `/cart`, `/checkout`, `/orders`, `/favorites` | Client + server actions |
| Admin | `/admin/*` | Admin-only, returns 404 to everyone else |

### Features

- Search: Postgres `pg_trgm` or full-text search, debounced, with typo tolerance.
- Filters: category, price range, weight/variant, in-stock only, sort by price or newest.
- Cart and favorites: guests use localStorage, which merges into the server on login. Logged-in users persist in the DB.

---

## 4. Authentication: Google sign-in with administrator allowlisting

### Login UI

The current admin login uses Google OAuth. Only approved administrator email addresses receive admin access.

### Flow

1. The administrator signs in through Google OAuth.
2. The callback requires a verified Google email and checks the configured/database allowlist.
3. The server sets an httpOnly, Secure, SameSite=Lax session cookie whose token hash is stored in PostgreSQL.
4. Approved administrators are redirected to `/admin`; other accounts cannot use admin routes.

### Exactly three admins, enforced at the database level

```sql
CREATE TABLE admin_slots (
  slot       smallint PRIMARY KEY CHECK (slot BETWEEN 1 AND 3),
  user_id    uuid UNIQUE REFERENCES users(id),
  identifier text NOT NULL UNIQUE   -- email or phone allowed to claim the slot
);
```

- A maximum of three rows can ever exist (primary key on 1..3).
- Admins are managed only through a seed/migration script, never through the UI or an API, so a compromised session can't create a fourth admin.
- Role is looked up from the DB on every privileged request, not trusted from a JWT claim. Removing an admin takes effect immediately.

### Keeping the admin side hidden

- No admin links or code in customer pages. The admin UI lives only under `/admin` and is never shipped in the customer bundle.
- Middleware and every admin route handler or server action call `requireAdmin()`. Non-admins get a 404, not a 403, so the route doesn't appear to exist.
- Hiding is cosmetic. The real protection is the server-side check on every admin API call.

---

## 5. Data model (Prisma-style summary)

```prisma
users(id, email?, phone?, name, created_at)
sessions(id, user_id, expires_at)
admin_slots(slot, user_id, identifier)

categories(id, name, slug, sort_order)
products(id, category_id, name, slug, description, is_active, updated_at)
product_variants(id, product_id, label "250g/500g/1kg", price_paise, stock_qty, sku)
product_images(id, product_id, url, sort_order)

favorites(user_id, product_id)
carts(id, user_id) / cart_items(cart_id, variant_id, qty)

orders(id, user_id, status, payment_method, payment_status, subtotal_paise,
       shipping_paise, total_paise, address_json, created_at)
order_items(order_id, variant_id, name_snapshot, price_paise_snapshot, qty)
payments(id, order_id, razorpay_order_id, razorpay_payment_id, status, raw_json)

notification_outbox(id, order_id, channel, recipient, template, status, attempts, last_error)
bulk_inquiries(...), contact_messages(...)
site_content(key, json)          -- banner, how-we-dry text, contact details
audit_log(id, admin_id, entity, entity_id, before_json, after_json, at)
```

- Prices are integers in paise, never floats.
- Order items snapshot name and price, so later price edits don't change past orders.

---

## 6. Admin capabilities and instant updates

### Admin features

- Product CRUD, image upload, and category management.
- A quick-edit table for stock and price with inline editing, so daily updates are fast.
- Active/inactive toggle, which acts as "out of stock" or "hide".
- Order list with status updates (packed, shipped, delivered, cancelled) and refunds.
- Bulk inquiries and contact messages inbox.
- Audit log view.

### How updates show up immediately

1. The admin saves, and a server action runs in a single transaction. It updates the row (old data is overwritten) and writes the before/after to `audit_log`.
2. After commit, the server calls `revalidateTag('products')` and `revalidatePath('/products/[slug]')`.
3. The next customer request gets fresh data.
4. Checkout and cart always re-read price and stock from the DB. The client is never trusted for prices.

---

## 7. Cart, checkout, and stock safety

### Order state machine

`PENDING_PAYMENT → PAID → PACKED → SHIPPED → DELIVERED`, with `CANCELLED` and `REFUNDED` branches. COD orders start at `COD_PLACED`.

### Preventing overselling (atomic decrement)

```sql
UPDATE product_variants
SET stock_qty = stock_qty - $qty
WHERE id = $id AND stock_qty >= $qty;   -- 0 rows affected = out of stock
```

- Online payment: reserve stock when the Razorpay order is created, with a 15-minute expiry job that releases it if unpaid.
- COD: decrement at placement.

---

## 8. Payments

### Razorpay (including UPI)

1. `POST /api/checkout` validates the cart, creates the order, and creates a Razorpay Order with the server-calculated amount.
2. The client opens Razorpay Checkout, which covers cards, netbanking, wallets, and UPI (intent, QR, or collect).
3. The server verifies the payment signature.
4. The webhook is the source of truth (`payment.captured`, `payment.failed`, `order.paid`). It verifies the webhook signature and is idempotent.
5. Admins can issue refunds from the portal through the Razorpay refund API.

### A note on "UPI"

Paying through Razorpay's UPI option gives you confirmation callbacks. A raw `upi://` link or personal UPI QR gives no automatic confirmation, so you'd have to verify payments by hand. I recommend Razorpay UPI only.

### COD

- Phone-verified via OTP (already guaranteed by login).
- Optional controls: a max order value, a pincode serviceability list, and a small COD fee.

---

## 9. Notifications (WhatsApp and email)

### Trigger

Order confirmed, meaning a Razorpay webhook success or a COD placement.

### Pipeline (outbox pattern)

1. In the same DB transaction that confirms the order, insert rows into `notification_outbox`: customer email, customer WhatsApp, shopkeeper email, shopkeeper WhatsApp.
2. A background job (Inngest or QStash) sends each one, retries with backoff, and records the status.
3. A failed send never blocks or fails the order.

### Notes

- WhatsApp: create and get approved templates such as `order_confirmation` and `new_order_alert`. Free-form messages are only allowed inside the 24-hour customer-reply window.
- Collect WhatsApp opt-in at checkout.
- Email uses a React Email template with an order summary.

---

## 10. Security checklist

- Zod validation on every input, both API routes and server actions.
- Origin check or CSRF protection on mutations.
- Rate limiting on OTP, checkout, and contact/bulk forms (CAPTCHA such as Turnstile on the public forms).
- Webhook signature verification and idempotency keys.
- Secrets only in env vars, never in client code.
- Security headers and a CSP.
- Image upload limited by type and size.
- Daily DB backups (Neon and Supabase provide point-in-time restore).

---

## 11. India-specific compliance

- FSSAI license number displayed in the footer and invoices, as this is an online food business.
- Policy pages: Privacy, Terms, Refund/Cancellation, and Shipping. Razorpay requires these to activate the account.
- DLT registration for SMS OTP, which can take days.
- GST details on invoices, if the shop is registered.

---

## 12. Suggested project structure

```text
src/
  app/
    (store)/ page.tsx, items/, products/, products/[slug]/, how-we-dry/,
             bulk-order/, contact/, cart/, checkout/, orders/, favorites/
    admin/   page.tsx, products/, orders/, inquiries/, audit/
    api/     auth/otp/{request,verify}, checkout, webhooks/razorpay, upload
  components/ (ui, store, admin)
  lib/ (db, auth, requireAdmin, razorpay, notify, rateLimit, money)
  jobs/ (sendNotification, releaseStock)
prisma/ schema.prisma, seed.ts   # seed creates the 3 admin slots
```

---

## 13. Delivery phases

| Phase | Scope | Rough effort |
| --- | --- | --- |
| 0 | Design audit, tokens, asset export | 2-3 days |
| 1 | Next.js setup, DB schema, OTP auth, role detection, admin slots | 1 week |
| 2 | Storefront pages, search, filters, PDP, favorites, cart | 1.5-2 weeks |
| 3 | Admin portal, inline stock/price editing, revalidation, audit log | 1-1.5 weeks |
| 4 | Checkout, Razorpay + UPI + COD, webhooks, order states | 1-1.5 weeks |
| 5 | WhatsApp and email notifications, bulk and contact forms | 1 week |
| 6 | Testing (Playwright e2e, Razorpay test mode, webhook replay), security pass, launch | 1 week |

That's roughly 7-9 weeks for one developer working steadily.

---

## 14. Decisions to confirm

1. Do products have weighted variants (250g/500g/1kg), or one price per item? I assumed variants.
2. Should checkout require login, or allow guest checkout with OTP at the end? I assumed login required, since the OTP verifies the phone for WhatsApp and COD.
3. Is there delivery charge logic (flat, free above a threshold, or by pincode)?
4. Which SMS and WhatsApp provider do you prefer? Both have onboarding lead times.

Once you share the reference site's source or screenshots, I can write the Tailwind theme and component inventory next. I can also put this plan into a Markdown or Word file if you'd like it to keep.
