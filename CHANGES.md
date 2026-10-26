# Changes in this update

## Ordering is now a WhatsApp enquiry (no login, no payment gateway)
- Cart no longer needs sign-in. "Send enquiry on WhatsApp" opens WhatsApp with the cart pre-written
  (items, pack sizes, quantities, subtotal). You reply with the total and the payment QR.
- Stock is NOT reduced when a customer enquires. You change stock in Admin after you confirm.
- Each enquiry is logged to Admin -> Inquiries (kind "enquiry"). Product pages also have
  "Enquire about this on WhatsApp".
- The WhatsApp number comes from Admin -> Store settings (digits only, e.g. 916379386564).
- /api/checkout (old order + Razorpay flow) is no longer used by the storefront. Left in place, unused.

## Stock messages
- One pack left of a size -> card badge says "Only 250 g left" (or 500 g / 1 kg). Two sizes -> "Only 250 g & 1 kg left".
- Every card lists its pack sizes: "250 g · last pack", "500 g · sold out".
- All sizes at 0 -> "Sold out". 2 to 5 packs -> "Few left".
- Wording lives in src/lib/availability.ts.

## Admin portal (Admin -> Products)
- Edit price and stock for all packs of a product, one Save button.
- "Today's price for 1 kg" fills 250 g / 500 g prices automatically.
- Edit name, local name, category, descriptions, home-page toggle.
- Add or remove a pack size. Replace the photo.
- Delete a product (duplicates are flagged). If it appears in past orders it is hidden instead.

## Bug fixes
- Cart/search crashed when a product had no photo.
- Product page opened on a sold-out size; quantity could exceed stock; heart never showed as saved.
- Cart quantity could be raised past available stock.
- "From" price could show a sold-out pack's price.
- Google sign-in had no CSRF `state` check; added.

## Needs your action
- Set GOOGLE_REDIRECT_URI to https://<your-domain>/api/auth/google/callback in Vercel (default is localhost).
- Set BLOB_READ_WRITE_TOKEN or photo upload will not work.
- Admin sign-in is Google (ADMIN_EMAILS). Phone-number login was already disabled in the code.
- Not built or run here (no node_modules, no network). Run: npm install, npm run build, then test locally.

## Round 2
- Bulk orders now end in WhatsApp too (a copy is still saved to Admin -> Inquiries).
- Removed unused order code: /api/checkout, /api/payments, /api/webhooks/razorpay, the expire-pending-orders job
  and its cron. Old orders stay visible in Admin -> Orders.
- Header no longer shows a customer "Login" button; admins sign in from the footer "Admin login" link
  (/login). Admins see an "Admin" button once signed in.
