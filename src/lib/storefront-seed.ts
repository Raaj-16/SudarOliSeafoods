import type { PrismaClient } from '@prisma/client';

export const storefrontContent = {
  shippingPaise: 2500,
  businessName: 'Sudar Oli Dry Sea Foods',
  address: "No 38, PH Road - Poonamallee Highway, Nerkundram (Near People's Flat), Chennai, Tamil Nadu - 600107",
  mapUrl: 'https://maps.app.goo.gl/GBzogvaa5pu7QbWu5',
  phoneNumbers: ['+91 63793 86564', '+91 99415 64349', '+91 97909 91369', '+91 72994 19828'],
  email: 'SudaroliDryseafoods@gmail.com',
  hours: 'Mon–Sat, 10 AM – 9 PM',
  whatsappNumber: '+916379386564',
  instagramUrl: 'https://instagram.com/sudaroli_dry_sea_foods?stkn=bWZycHo1ZGV4MzNo',
  facebookUrl: 'https://www.facebook.com/share/1DBvTVbuse/',
  fssaiLicense: '22426246001221',
  heroStats: [
    { value: '25+', label: 'Years of industry experience' },
    { value: '6+', label: 'Varieties in season' },
    { value: '0', label: 'Preservatives added' },
  ],
  trustItems: [
    'Sun-dried on open racks for 3–5 days',
    'Same-day Chennai delivery before 3 PM',
    'WhatsApp enquiry · manual QR payment',
    'FSSAI licensed · 22426246001221',
  ],
};

export const catalogProducts = [
  {
    slug: 'nethili-karuvadu',
    legacySlug: 'anchovy',
    categorySlug: 'raw',
    name: 'Nethili Karuvadu',
    localName: 'Dried Anchovy',
    shortDescription: 'Small, crisp and salty — the everyday favourite for kuzhambu and fry.',
    description: 'Small, crisp and salty — the everyday favourite for kuzhambu and fry. Sourced from fishing families along the Rameswaram coast and sun-dried the traditional way.',
    featured: true,
    rating: 4.8,
    images: ['/products/Nethili.jpeg'],
    variants: [{ label: '250 g', pricePaise: 15000, stockQty: 0, sku: 'NETHILI-250' }],
  },
  {
    slug: 'mathi-karuvadu',
    legacySlug: 'sardine',
    categorySlug: 'raw',
    name: 'Mathi Karuvadu',
    localName: 'Dried Sardine',
    shortDescription: 'Rich, oily and full-bodied — lovely shallow-fried or cooked in kuzhambu.',
    description: 'Rich, oily and full-bodied. Best shallow-fried with a chilli-tamarind rub and suitable for kuzhambu. Sourced from fishing families along the Rameswaram coast.',
    featured: true,
    rating: 4.8,
    images: ['/products/Mathi.jpeg'],
    variants: [{ label: '250 g', pricePaise: 10000, stockQty: 0, sku: 'MATHI-250' }],
  },
  {
    slug: 'vanjaram-karuvadu',
    legacySlug: 'vanjaram',
    categorySlug: 'raw',
    name: 'Vanjaram Karuvadu',
    localName: 'Dried Seer Fish',
    shortDescription: 'Premium firm, boneless steaks dried slowly for deeper flavour.',
    description: 'Our premium cut — firm, boneless steaks, dried slower for deeper flavour. Sourced from fishing families along the Rameswaram coast.',
    featured: true,
    rating: 4.9,
    images: ['/products/Vanjaram.jpeg'],
    variants: [{ label: '250 g', pricePaise: 30000, stockQty: 0, sku: 'VANJARAM-KARUVADU-250' }],
  },
  {
    slug: 'vaala-karuvadu',
    categorySlug: 'raw',
    name: 'Vaala Karuvadu',
    localName: 'Dried Ribbon Fish',
    shortDescription: 'Long, silvery cuts with minimal bones — a coastal household staple.',
    description: 'Long, silvery cuts with minimal bones — a coastal household staple. Sourced from fishing families along the Rameswaram coast and sun-dried the traditional way.',
    featured: true,
    rating: 4.8,
    images: ['/products/Vaalai.jpeg'],
    variants: [{ label: '250 g', pricePaise: 15000, stockQty: 0, sku: 'VAALA-250' }],
  },
  {
    slug: 'nagarai-karuvadu',
    legacySlug: 'ray-fish',
    categorySlug: 'raw',
    name: 'Nagarai Karuvadu',
    localName: 'Dried Pink Perch',
    shortDescription: 'Soft, meaty pieces with a clean coastal flavour — ideal for a quick fry or curry.',
    description: 'Soft, meaty pieces with a clean coastal flavour — ideal for a quick fry or curry. Sourced from fishing families along the Rameswaram coast.',
    featured: true,
    rating: 4.8,
    images: ['/products/Nagarai.jpeg'],
    variants: [{ label: '250 g', pricePaise: 12500, stockQty: 0, sku: 'NAGARAI-250' }],
  },
  {
    slug: 'seela-karuvadu',
    categorySlug: 'raw',
    name: 'Seela Karuvadu',
    localName: 'Dried Barracuda',
    shortDescription: 'Delicately salted with a tender bite — delicious pan-fried with onions and chillies.',
    description: 'Delicately salted with a tender bite — delicious pan-fried with onions and chillies. Sourced from fishing families along the Rameswaram coast.',
    featured: true,
    rating: 4.8,
    images: ['/products/Seela.jpeg'],
    variants: [{ label: '250 g', pricePaise: 12500, stockQty: 0, sku: 'SEELA-250' }],
  },
  {
    slug: 'kaana-kaththai-karuvadu',
    legacySlug: 'mackerel',
    categorySlug: 'raw',
    name: 'Kaana Kaththai Karuvadu',
    localName: 'Dried Mackerel',
    shortDescription: 'A flavourful everyday dry fish with a satisfying bite, perfect for kuzhambu.',
    description: 'A flavourful everyday dry fish with a satisfying bite, perfect for kuzhambu. Sourced from fishing families along the Rameswaram coast.',
    featured: false,
    rating: 4.8,
    images: ['/products/Kanakathai.jpeg'],
    variants: [{ label: '250 g', pricePaise: 12500, stockQty: 0, sku: 'KAANA-KATHTHAI-250' }],
  },
  {
    slug: 'chennakunni',
    legacySlug: 'prawns',
    categorySlug: 'raw',
    name: 'Chennakunni',
    localName: 'Dried Baby Shrimp',
    shortDescription: 'Lightly salted and pleasantly mild — a versatile choice for home-style recipes.',
    description: 'Lightly salted and pleasantly mild — a versatile choice for simple home-style recipes. Sourced from fishing families along the Rameswaram coast.',
    featured: false,
    rating: 4.8,
    images: ['/products/Chennanguni.jpeg'],
    variants: [{ label: '250 g', pricePaise: 15000, stockQty: 0, sku: 'CHENNAKUNNI-250' }],
  },
  {
    slug: 'cleaned-nethili-karuvadu',
    categorySlug: 'cleaned',
    name: 'Cleaned Nethili Karuvadu',
    localName: 'Dried Anchovy',
    shortDescription: 'Cleaned, small, crisp and salty — an everyday favourite for kuzhambu and fry.',
    description: 'Small, crisp and salty — the everyday favourite for kuzhambu and fry, cleaned and ready to cook.',
    featured: false,
    rating: 4.8,
    images: ['/products/Nethili.jpeg'],
    variants: [{ label: '250 g', pricePaise: 17000, stockQty: 0, sku: 'CLEANED-NETHILI-250' }],
  },
  {
    slug: 'cleaned-mathi-karuvadu',
    categorySlug: 'cleaned',
    name: 'Cleaned Mathi Karuvadu',
    localName: 'Dried Sardine',
    shortDescription: 'Cleaned, rich and full-bodied — lovely shallow-fried or cooked in kuzhambu.',
    description: 'Rich, oily and full-bodied. Best shallow-fried with a chilli-tamarind rub and suitable for kuzhambu, cleaned and ready to cook.',
    featured: false,
    rating: 4.8,
    images: ['/products/Mathi.jpeg'],
    variants: [{ label: '250 g', pricePaise: 12000, stockQty: 0, sku: 'CLEANED-MATHI-250' }],
  },
  {
    slug: 'cleaned-vanjaram-karuvadu',
    categorySlug: 'cleaned',
    name: 'Cleaned Vanjaram Karuvadu',
    localName: 'Dried Seer Fish',
    shortDescription: 'Cleaned premium cuts — firm, boneless steaks dried slowly for deeper flavour.',
    description: 'Our premium cut — firm, boneless steaks, dried slower for deeper flavour, cleaned and ready to cook.',
    featured: false,
    rating: 4.9,
    images: ['/products/Vanjaram.jpeg'],
    variants: [{ label: '250 g', pricePaise: 32000, stockQty: 0, sku: 'CLEANED-VANJARAM-250' }],
  },
  {
    slug: 'cleaned-vaala-karuvadu',
    categorySlug: 'cleaned',
    name: 'Cleaned Vaala Karuvadu',
    localName: 'Dried Ribbon Fish',
    shortDescription: 'Cleaned, long silvery cuts with minimal bones — a coastal household staple.',
    description: 'Long, silvery cuts with minimal bones — a coastal household staple, cleaned and ready to cook.',
    featured: false,
    rating: 4.8,
    images: ['/products/Vaalai.jpeg'],
    variants: [{ label: '250 g', pricePaise: 17000, stockQty: 0, sku: 'CLEANED-VAALA-250' }],
  },
  {
    slug: 'cleaned-nagarai-karuvadu',
    categorySlug: 'cleaned',
    name: 'Cleaned Nagarai Karuvadu',
    localName: 'Dried Pink Perch',
    shortDescription: 'Cleaned, soft and meaty pieces with a clean coastal flavour — ideal for a fry or curry.',
    description: 'Soft, meaty pieces with a clean coastal flavour — ideal for a quick fry or curry, cleaned and ready to cook.',
    featured: false,
    rating: 4.8,
    images: ['/products/Nagarai.jpeg'],
    variants: [{ label: '250 g', pricePaise: 14500, stockQty: 0, sku: 'CLEANED-NAGARAI-250' }],
  },
  {
    slug: 'cleaned-seela-karuvadu',
    categorySlug: 'cleaned',
    name: 'Cleaned Seela Karuvadu',
    localName: 'Dried Barracuda',
    shortDescription: 'Cleaned and delicately salted with a tender bite — delicious with onions and chillies.',
    description: 'Delicately salted with a tender bite — delicious pan-fried with onions and chillies, cleaned and ready to cook.',
    featured: false,
    rating: 4.8,
    images: ['/products/Seela.jpeg'],
    variants: [{ label: '250 g', pricePaise: 14500, stockQty: 0, sku: 'CLEANED-SEELA-250' }],
  },
  {
    slug: 'cleaned-kaana-kaththai-karuvadu',
    categorySlug: 'cleaned',
    name: 'Cleaned Kaana Kaththai Karuvadu',
    localName: 'Dried Mackerel',
    shortDescription: 'Cleaned everyday dry fish with a satisfying bite, perfect for kuzhambu.',
    description: 'A flavourful everyday dry fish with a satisfying bite, perfect for kuzhambu, cleaned and ready to cook.',
    featured: false,
    rating: 4.8,
    images: ['/products/Kanakathai.jpeg'],
    variants: [{ label: '250 g', pricePaise: 14500, stockQty: 0, sku: 'CLEANED-KAANA-KATHTHAI-250' }],
  },
] as const;

export async function seedStorefrontData(prismaClient: PrismaClient) {
  for (const product of catalogProducts) {
    const category = await prismaClient.category.upsert({
      where: { slug: product.categorySlug },
      update: { name: product.categorySlug === 'raw' ? 'Raw' : 'Cleaned', sortOrder: product.categorySlug === 'raw' ? 0 : 1 },
      create: { name: product.categorySlug === 'raw' ? 'Raw' : 'Cleaned', slug: product.categorySlug, sortOrder: product.categorySlug === 'raw' ? 0 : 1 },
    });

    const existingProduct = await prismaClient.product.findFirst({
      where: { slug: { in: [product.slug, ...('legacySlug' in product ? [product.legacySlug] : [])] } },
    });
    const productData = {
        categoryId: category.id,
        name: product.name,
        localName: product.localName,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        rating: product.rating,
        featured: product.featured,
    };
    const createdProduct = existingProduct
      ? await prismaClient.product.update({ where: { id: existingProduct.id }, data: productData })
      : await prismaClient.product.create({ data: { ...productData, isActive: true } });

    for (const variant of product.variants) {
      await prismaClient.productVariant.upsert({
        where: { sku: variant.sku },
        update: {
          productId: createdProduct.id,
          label: variant.label,
        },
        create: {
          productId: createdProduct.id,
          label: variant.label,
          pricePaise: variant.pricePaise,
          stockQty: variant.stockQty,
          sku: variant.sku,
        },
      });
    }

    const existingImages = await prismaClient.productImage.findMany({ where: { productId: createdProduct.id } });
    if (!existingImages.length || existingImages.every((image) => image.url.startsWith('/products/'))) {
      await prismaClient.productImage.deleteMany({ where: { productId: createdProduct.id } });
      for (const [index, url] of product.images.entries()) {
        await prismaClient.productImage.create({ data: { productId: createdProduct.id, url, sortOrder: index } });
      }
    }
  }

  await prismaClient.siteContent.upsert({
    where: { key: 'storefront' },
    update: {},
    create: { key: 'storefront', json: storefrontContent },
  });
}
