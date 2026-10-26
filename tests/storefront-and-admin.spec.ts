import { test, expect } from '@playwright/test';

test.describe('Sudar Oli Dry Sea Foods - Complete End-to-End Test Suite', () => {

  test('00. Cart and favourite counts start at zero for a new visitor', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('sudaroli-cart');
      localStorage.removeItem('sudaroli-favourites');
    });
    await page.goto('/products');

    const cartBadge = page.locator('header.site a[href="/cart"] .cart-count');
    const favoriteBadge = page.locator('header.site a[href="/favorites"] .cart-count');
    await expect(cartBadge).toHaveCount(0);
    await expect(favoriteBadge).toHaveCount(0);

    const favoriteButton = page.locator('.card-fav').first();
    await favoriteButton.click();
    await expect(favoriteBadge).toHaveText('1');
    await favoriteButton.click();
    await expect(favoriteBadge).toHaveCount(0);
  });

  test('01. Home Page renders signature branding, hero section, and trust strip', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Sudar Oli Dry Sea Foods/i);

    // Header logo & emblem
    const logo = page.locator('header.site .logo');
    await expect(logo).toBeVisible();
    await expect(page.locator('.logo-text .top')).toHaveText('Sudar Oli');
    await expect(page.locator('.logo-text .bottom')).toContainText('Dry Sea Foods');

    // Hero Section
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('h1')).toContainText('Salted by the sea');

    // Trust strip in home landing screen
    const trustStrip = page.locator('.trust-strip');
    await expect(trustStrip).toBeVisible();
    await expect(trustStrip).toContainText('Sun-dried on open racks');
    await expect(trustStrip).toContainText('Same-day Chennai delivery');
    await expect(trustStrip).toContainText('WhatsApp enquiry · manual QR payment');
    await expect(trustStrip).toContainText('FSSAI');

    // Hanging drying line rig
    const lineRig = page.locator('.line-rig');
    await expect(lineRig).toBeVisible();
    const hangCards = page.locator('.hang-card');
    await expect(hangCards.first()).toBeVisible();

    // From the drying yard to your kitchen story
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection).toContainText('From the drying yard to your kitchen');

    // Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('FSSAI Lic. No.');
    await expect(footer.locator('a[href="/login"]')).toHaveText('Login');

    const adminLoginLink = page.locator('header.site a[href="/login"]');
    await expect(adminLoginLink).toHaveText('Login');
    await adminLoginLink.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('h1')).toHaveText('Sign in');
  });

  test('02. Products listing page displays catalog, filters, search, and pending/sold out stock badges', async ({ page }) => {
    await page.goto('/products');

    // Header & Section Head
    await expect(page.locator('#shop h2')).toHaveText("Today's rack");

    // Product cards present
    const cards = page.locator('#shop .card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Verify stock availability badges: "Only ... is pending", "Sold out", etc.
    const badges = page.locator('#shop .card .badge');
    const badgeTexts = await badges.allTextContents();
    console.log('Sample badges found on page:', badgeTexts.slice(0, 5));

    // Verify at least one pending badge (e.g. "Only 250 gms is pending" or "Only 1 kg is pending")
    const hasPendingBadge = badgeTexts.some((b) => /only\s+.*is\s+pending/i.test(b));
    expect(hasPendingBadge).toBeTruthy();

    // Verify at least one "Sold out" badge
    const hasSoldOut = badgeTexts.some((b) => /sold out/i.test(b));
    expect(hasSoldOut).toBeTruthy();

    // Test filter chips: Cleaned fish
    const cleanedChip = page.locator('.chip:has-text("Cleaned fish")');
    await cleanedChip.click();
    await expect(page.locator('.card h3').first()).toContainText('Cleaned');

    // Reset filter to All
    await page.locator('.chip:has-text("All")').click();

    // Test search filter
    const searchInput = page.locator('.search-box input');
    await searchInput.fill('Vanjaram');
    await expect(page.locator('.card h3').first()).toContainText('Vanjaram');
    await searchInput.fill('');
  });

  test('03. Product Description Page handles weight selection, stock status, and WhatsApp enquiry', async ({ page }) => {
    // Navigate to Nethili Karuvadu
    await page.goto('/products/nethili-karuvadu');

    // Basic product details
    await expect(page.locator('.pdp-title')).toHaveText('Nethili Karuvadu');
    await expect(page.locator('.pdp-local')).toBeVisible();

    // Stock panel
    const stockPanel = page.locator('.stock-panel');
    await expect(stockPanel).toBeVisible();

    // Weight selection buttons
    const weightOpts = page.locator('.weight-opts .wopt');
    await expect(weightOpts.first()).toBeVisible();

    // Check if 250 g option shows "Only 250 gms is pending"
    const firstWeightText = await weightOpts.first().innerText();
    expect(firstWeightText).toMatch(/250 g/i);

    // Quantity controls
    const stepper = page.locator('.qty-row .stepper');
    await expect(stepper).toBeVisible();

    // WhatsApp enquiry button
    const waButton = page.locator('a.wa-btn');
    await expect(waButton).toBeVisible();
    const href = await waButton.getAttribute('href');
    expect(href).toContain('wa.me/916379386564');
    expect(href).toContain('Nethili');

    // Accordions
    const accordionHeads = page.locator('.acc-head');
    await expect(accordionHeads.first()).toHaveText(/Storage & shelf life/i);
    await expect(accordionHeads.nth(1)).toHaveText(/Delivery & packaging/i);
  });

  test('04. Liked products (Favourites) heart toggle works and persists across pages', async ({ page }) => {
    await page.goto('/products');

    // Find heart button on first product card
    const firstFavBtn = page.locator('.card-fav').first();
    const firstCardTitle = await page.locator('.card h3').first().innerText();

    // Click heart to favourite
    await firstFavBtn.click();
    await expect(firstFavBtn).toHaveClass(/active/);

    // Header heart counter should show at least 1
    const headerFavBadge = page.locator('header.site a[href="/favorites"] .cart-count');
    await expect(headerFavBadge).toBeVisible();

    // Navigate to Favorites page
    await page.goto('/favorites');
    await expect(page.locator('.section-head h2')).toHaveText('Your favourites');

    // The favorited product should be listed
    const favCardTitle = await page.locator('.card h3').first().innerText();
    expect(favCardTitle).toBe(firstCardTitle);

    // Remove from favourites
    await page.locator('.card-fav').first().click();
    await expect(page.locator('.cart-empty')).toBeVisible();
  });

  test('05. Add to Cart and WhatsApp enquiry order summary workflow', async ({ page }) => {
    // Navigate to Nethili Karuvadu
    await page.goto('/products/nethili-karuvadu');

    // Click Add to cart
    const addToCartBtn = page.locator('button:has-text("Add to cart")');
    await addToCartBtn.click();

    // Notice should appear
    await expect(page.locator('p[role="status"]')).toContainText('added to your cart');

    // Header cart counter should show 1
    const headerCartBadge = page.locator('header.site a[href="/cart"] .cart-count');
    await expect(headerCartBadge).toHaveText('1');

    // Navigate to Cart page
    await page.goto('/cart');
    await expect(page.locator('.section-head h2')).toHaveText('Your cart');

    // Cart item should be listed
    const cartItem = page.locator('.cart-item');
    await expect(cartItem).toBeVisible();
    await expect(cartItem.locator('.ci-name')).toContainText('Nethili Karuvadu');

    // Fill customer details
    const nameInput = page.locator('aside.bulk-side input[placeholder="Your name"]');
    const placeInput = page.locator('aside.bulk-side input[placeholder="e.g. Chennai 600001"]');
    await nameInput.fill('Kavitha');
    await placeInput.fill('Anna Nagar, Chennai');

    // WhatsApp enquiry button
    const sendEnquiryBtn = page.locator('aside.bulk-side a.wa-btn');
    await expect(sendEnquiryBtn).toBeVisible();
    const waLink = await sendEnquiryBtn.getAttribute('href');
    expect(waLink).toContain('wa.me/916379386564');
    expect(waLink).toContain('Kavitha');
    expect(waLink).toContain('Anna%20Nagar');
    expect(waLink).toContain('Please%20confirm%20availability%20and%20send%20the%20payment%20QR');

    // Clear cart
    const clearCartBtn = page.locator('button:has-text("Clear cart")');
    await clearCartBtn.click();
    await expect(page.locator('.cart-empty')).toBeVisible();
  });

  test('06. How We Dry page displays 5 traditional steps and batch explanation', async ({ page }) => {
    await page.goto('/how-we-dry');

    await expect(page.locator('h1')).toContainText('From the boat to the rack');
    const steps = page.locator('.pstep');
    await expect(steps).toHaveCount(5);

    await expect(steps.nth(0)).toContainText('The catch comes in');
    await expect(steps.nth(1)).toContainText('Cleaned within hours');
    await expect(steps.nth(2)).toContainText('Hand-salted');
    await expect(steps.nth(3)).toContainText('Racked in open sun');
    await expect(steps.nth(4)).toContainText('Packed & shipped');

    await expect(page.locator('text=Why stock runs out sometimes')).toBeVisible();
  });

  test('07. Contact page renders store details, clickable phone numbers and submits contact form', async ({ page }) => {
    await page.goto('/contact');

    // Heading
    await expect(page.locator('h1')).toContainText("We're here to help with your order");

    // Address & Phone numbers
    const main = page.getByRole('main');
    await expect(main.getByText('Poonamallee Highway')).toBeVisible();
    await expect(main.locator('a[href="tel:916379386564"]')).toBeVisible();
    await expect(main.locator('a[href="tel:919790991369"]')).toBeVisible();

    // Contact form
    const form = main.locator('form');
    await expect(form).toBeVisible();
    await form.getByLabel('Name').fill('Ramesh');
    await form.getByLabel('Email').fill('ramesh@example.com');
    await form.getByLabel('Phone').fill('+91 98401 23456');
    await form.getByLabel('Message').fill('Hi, I would like to inquire about vanjaram batch delivery to Coimbatore.');
    await form.getByRole('button', { name: 'Send message' }).click();

    // Success response status
    await expect(form.locator('p[role="status"]')).toHaveText('Your message has been received.');
  });

  test('08. Responsive Mobile Menu Drawer appears and toggles on smaller screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Desktop nav should be hidden on mobile
    await expect(page.locator('nav.main-nav')).toBeHidden();

    // Hamburger button should be visible
    const hamburger = page.locator('.hamburger-toggle');
    await expect(hamburger).toBeVisible();

    // Click hamburger to open mobile menu
    await hamburger.click();

    // Mobile menu drawer should now be visible
    const mobileDrawer = page.locator('.mobile-menu-drawer');
    await expect(mobileDrawer).toBeVisible();
    await expect(mobileDrawer.locator('a[href="/products"]')).toContainText("Shop Today's Catch");
    await expect(mobileDrawer.locator('a[href="/how-we-dry"]')).toContainText('How We Dry');
    await expect(mobileDrawer.locator('a[href="/contact"]')).toContainText('Contact Us');
    await expect(mobileDrawer.locator('a[href="/login"]')).toBeVisible();

    // Click close hamburger
    await hamburger.click();
    await expect(mobileDrawer).toBeHidden();
  });

  test('09. Sign-in starts blank and offers customer registration without exposing credentials', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toHaveText('Sign in');
    const identifier = page.locator('input[name="account-identifier"]');
    const password = page.locator('input[name="account-password"]');
    await expect(identifier).toHaveValue('');
    await expect(password).toHaveValue('');
    await expect(identifier).toHaveAttribute('autocomplete', 'off');
    await expect(password).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.getByText(/Default PIN|Quick Fill|My Number|Dad's Number/i)).toHaveCount(0);
    const retiredLoginResponse = await page.request.post('/api/auth/phone', { data: { phone: 'not-a-phone', pin: 'not-a-secret' } });
    expect(retiredLoginResponse.status()).toBe(410);

    await page.route('**/api/auth/register', (route) => route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, message: 'Check your email for a verification link.' }),
    }));
    await page.getByRole('button', { name: 'Create customer account' }).click();
    await page.getByLabel('Name').fill('Test Customer');
    await page.getByLabel('Email').fill('customer@example.com');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.locator('p[role="status"]')).toContainText('verification link');
  });

  test('10. Customer login routes to the storefront with a My Enquiries link', async ({ page }) => {
    await page.goto('/login');

    await page.route('**/api/auth/login', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: { role: 'customer' }, redirectTo: '/' }),
    }));
    await page.route('**/api/auth/session', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: { role: 'customer' } }),
    }));

    await page.getByLabel('Phone number or customer email').fill('customer@example.com');
    await page.getByLabel('Password').fill('a-long-test-password-123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/');
    await expect(page.locator('header.site a[href="/my-inquiries"]')).toHaveText('My enquiries');
  });

});
