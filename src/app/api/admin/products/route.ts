import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Database is not configured.' }, { status: 503 });
  const user = await getAuthenticatedUser();
  if (!user?.isAdmin) return NextResponse.json({ ok: false, message: 'Not found.' }, { status: 404 });
  const [products, categories] = await Promise.all([prisma.product.findMany({
    include: { category: true, variants: { orderBy: { pricePaise: 'asc' } }, images: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
  }), prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })]);
  return NextResponse.json({ ok: true, categories, products: products.map((product) => ({
    id: product.id,
    name: product.name,
    localName: product.localName,
    slug: product.slug,
    category: product.category.name,
    image: product.images[0]?.url ?? '',
    isActive: product.isActive,
    featured: product.featured,
    categorySlug: product.category.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    variants: product.variants.map((variant) => ({ id: variant.id, label: variant.label, price: variant.pricePaise / 100, stock: variant.stockQty })),
  })) });
}

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Database is not configured.' }, { status: 503 });
  const user = await getAuthenticatedUser();
  if (!user?.isAdmin) return NextResponse.json({ ok: false, message: 'Not found.' }, { status: 404 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : '';
  const localName = typeof body?.localName === 'string' ? body.localName.trim().slice(0, 120) : '';
  const slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 140) : '';
  const categorySlug = typeof body?.categorySlug === 'string' ? body.categorySlug.trim().toLowerCase() : '';
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 2000) : '';
  const shortDescription = typeof body?.shortDescription === 'string' ? body.shortDescription.trim().slice(0, 300) : '';
  const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 32) : '';
  const price = Number(body?.price);
  const stock = Number(body?.stock);
  const image = typeof body?.image === 'string' ? body.image.trim().slice(0, 1000) : '';
  if (!name || !localName || !slug || !description || !shortDescription || !label || !Number.isSafeInteger(price) || price < 1 || price > 1_000_000 || !Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000) {
    return NextResponse.json({ ok: false, message: 'Complete product, pack, price and stock fields with valid values.' }, { status: 400 });
  }
  if (image && !(image.startsWith('/') && !image.startsWith('//')) && !/^https:\/\//i.test(image)) {
    return NextResponse.json({ ok: false, message: 'Product image must be a local path or HTTPS URL.' }, { status: 400 });
  }
  try {
    const created = await prisma.$transaction(async (transaction) => {
      const category = await transaction.category.findUnique({ where: { slug: categorySlug } });
      if (!category) return null;
      const product = await transaction.product.create({
        data: {
          name, localName, slug, description, shortDescription, categoryId: category.id,
          variants: { create: { label, pricePaise: price * 100, stockQty: stock, sku: `${slug}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` } },
          images: image ? { create: { url: image, sortOrder: 0 } } : undefined,
        },
        include: { variants: true },
      });
      await transaction.auditLog.create({ data: { adminId: user.id, entity: 'Product', entityId: product.id, afterJson: { name, slug, category: category.name, variant: label, pricePaise: price * 100, stockQty: stock } } });
      return product;
    });
    if (!created) return NextResponse.json({ ok: false, message: 'Choose a category that exists in the database.' }, { status: 400 });
    return NextResponse.json({ ok: true, productId: created.id, slug: created.slug }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return NextResponse.json({ ok: false, message: 'That product slug or pack SKU already exists.' }, { status: 409 });
    console.error('Admin product creation failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'Could not create the product. Try again.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Database is not configured.' }, { status: 503 });
  const user = await getAuthenticatedUser();
  if (!user?.isAdmin) return NextResponse.json({ ok: false, message: 'Not found.' }, { status: 404 });
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === 'string' ? body.productId : '';
  const validMoney = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 1 && (value as number) <= 1_000_000;
  const validStock = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 1_000_000;

  // Save every pack size of one product in one go (price + stock).
  if (productId && Array.isArray(body?.variants)) {
    const rows = (body.variants as Array<{ variantId?: unknown; price?: unknown; stock?: unknown }>).slice(0, 20);
    if (!rows.length || rows.some((row) => typeof row.variantId !== 'string' || !validMoney(row.price) || !validStock(row.stock))) {
      return NextResponse.json({ ok: false, message: 'Enter a valid price and stock for every pack size.' }, { status: 400 });
    }
    try {
      await prisma.$transaction(async (transaction) => {
        for (const row of rows) {
          const current = await transaction.productVariant.findFirst({ where: { id: row.variantId as string, productId } });
          if (!current) throw new Error('VARIANT_MISSING');
          const pricePaise = (row.price as number) * 100;
          const stockQty = row.stock as number;
          if (current.pricePaise === pricePaise && current.stockQty === stockQty) continue;
          await transaction.productVariant.update({ where: { id: current.id }, data: { pricePaise, stockQty } });
          await transaction.auditLog.create({ data: { adminId: user.id, entity: 'ProductVariant', entityId: current.id, beforeJson: { label: current.label, pricePaise: current.pricePaise, stockQty: current.stockQty }, afterJson: { label: current.label, pricePaise, stockQty } } });
        }
        await transaction.product.update({ where: { id: productId }, data: { updatedAt: new Date() } });
      });
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'VARIANT_MISSING') return NextResponse.json({ ok: false, message: 'A pack size no longer exists. Refresh and try again.' }, { status: 404 });
      console.error('Admin bulk variant update failed:', error instanceof Error ? error.message : 'unknown error');
      return NextResponse.json({ ok: false, message: 'Could not save prices. Try again.' }, { status: 500 });
    }
  }

  // Edit the text details of a product (the page address stays the same so old links keep working).
  if (productId && body?.details && typeof body.details === 'object') {
    const details = body.details as Record<string, unknown>;
    const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
    const name = clean(details.name, 120);
    const localName = clean(details.localName, 120);
    const shortDescription = clean(details.shortDescription, 300);
    const description = clean(details.description, 2000);
    const categorySlug = clean(details.categorySlug, 80).toLowerCase();
    if (!name || !localName || !shortDescription || !description || !categorySlug) {
      return NextResponse.json({ ok: false, message: 'Fill in name, local name, category and both descriptions.' }, { status: 400 });
    }
    try {
      const result = await prisma.$transaction(async (transaction) => {
        const current = await transaction.product.findUnique({ where: { id: productId } });
        const category = await transaction.category.findUnique({ where: { slug: categorySlug } });
        if (!current || !category) return null;
        const data = { name, localName, shortDescription, description, categoryId: category.id, featured: typeof details.featured === 'boolean' ? details.featured : current.featured };
        await transaction.product.update({ where: { id: productId }, data });
        await transaction.auditLog.create({ data: { adminId: user.id, entity: 'Product', entityId: productId, beforeJson: { name: current.name, localName: current.localName, shortDescription: current.shortDescription, featured: current.featured }, afterJson: { name, localName, shortDescription, featured: data.featured } } });
        return true;
      });
      if (!result) return NextResponse.json({ ok: false, message: 'Product or category was not found.' }, { status: 404 });
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('Admin product details update failed:', error instanceof Error ? error.message : 'unknown error');
      return NextResponse.json({ ok: false, message: 'Could not save product details.' }, { status: 500 });
    }
  }

  // Add a new pack size (e.g. 1 kg) to an existing product.
  if (productId && body?.addVariant && typeof body.addVariant === 'object') {
    const input = body.addVariant as Record<string, unknown>;
    const label = typeof input.label === 'string' ? input.label.trim().slice(0, 32) : '';
    if (!label || !validMoney(input.price) || !validStock(input.stock)) {
      return NextResponse.json({ ok: false, message: 'Enter a pack label (like 1 kg), a price and a stock quantity.' }, { status: 400 });
    }
    try {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return NextResponse.json({ ok: false, message: 'Product was not found.' }, { status: 404 });
      const sku = `${product.slug}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      const created = await prisma.productVariant.create({ data: { productId, label, sku, pricePaise: (input.price as number) * 100, stockQty: input.stock as number } });
      await prisma.auditLog.create({ data: { adminId: user.id, entity: 'ProductVariant', entityId: created.id, afterJson: { productName: product.name, label, pricePaise: created.pricePaise, stockQty: created.stockQty } } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return NextResponse.json({ ok: false, message: 'This product already has that pack size.' }, { status: 409 });
      console.error('Admin add variant failed:', error instanceof Error ? error.message : 'unknown error');
      return NextResponse.json({ ok: false, message: 'Could not add the pack size.' }, { status: 500 });
    }
  }

  // Remove a pack size. If past orders used it, keep it but set stock to 0 so history is not lost.
  if (typeof body?.removeVariantId === 'string') {
    try {
      const current = await prisma.productVariant.findUnique({ where: { id: body.removeVariantId }, include: { product: { include: { variants: true } }, _count: { select: { orderItems: true } } } });
      if (!current) return NextResponse.json({ ok: false, message: 'Pack size was not found.' }, { status: 404 });
      if (current._count.orderItems > 0) {
        await prisma.productVariant.update({ where: { id: current.id }, data: { stockQty: 0 } });
        await prisma.auditLog.create({ data: { adminId: user.id, entity: 'ProductVariant', entityId: current.id, beforeJson: { label: current.label, stockQty: current.stockQty }, afterJson: { label: current.label, stockQty: 0, note: 'has order history; marked sold out instead of deleted' } } });
        return NextResponse.json({ ok: true, archived: true, message: 'This pack size is used by past orders, so it was marked sold out instead of deleted.' });
      }
      await prisma.productVariant.delete({ where: { id: current.id } });
      await prisma.auditLog.create({ data: { adminId: user.id, entity: 'ProductVariant', entityId: current.id, beforeJson: { productName: current.product.name, label: current.label, pricePaise: current.pricePaise, stockQty: current.stockQty }, afterJson: { deleted: true } } });
      return NextResponse.json({ ok: true, archived: false });
    } catch (error) {
      console.error('Admin remove variant failed:', error instanceof Error ? error.message : 'unknown error');
      return NextResponse.json({ ok: false, message: 'Could not remove the pack size.' }, { status: 500 });
    }
  }

  if (productId && typeof body?.image === 'string') {
    const rawImage = body.image.trim();
    const isValidLocal = rawImage.startsWith('/') && !rawImage.startsWith('//');
    const isValidHttps = /^https:\/\/[^\s]+$/i.test(rawImage);
    if (!isValidLocal && !isValidHttps) {
      return NextResponse.json({ ok: false, message: 'Product image must be a valid local path or HTTPS URL.' }, { status: 400 });
    }
    const finalImageUrl = rawImage;
    try {
      const result = await prisma.$transaction(async (transaction) => {
        const product = await transaction.product.findUnique({ where: { id: productId }, include: { images: true } });
        if (!product) return null;
        await transaction.productImage.deleteMany({ where: { productId } });
        await transaction.productImage.create({ data: { productId, url: finalImageUrl, sortOrder: 0 } });
        await transaction.auditLog.create({
          data: {
            adminId: user.id,
            entity: 'ProductImage',
            entityId: productId,
            beforeJson: { url: product.images[0]?.url ?? null },
            afterJson: { url: finalImageUrl },
          },
        });
        return { productId };
      });
      if (!result) return NextResponse.json({ ok: false, message: 'Product was not found.' }, { status: 404 });
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('Product image update failed:', error instanceof Error ? error.message : 'unknown error');
      return NextResponse.json({ ok: false, message: 'Could not save the product image.' }, { status: 500 });
    }
  }
  if (productId && typeof body?.isActive === 'boolean') {
    try {
      const result = await prisma.$transaction(async (transaction) => {
        const current = await transaction.product.findUnique({ where: { id: productId } });
        if (!current) return null;
        const updated = await transaction.product.update({ where: { id: productId }, data: { isActive: body.isActive, updatedAt: new Date() } });
        await transaction.auditLog.create({
          data: {
            adminId: user.id,
            entity: 'Product',
            entityId: productId,
            beforeJson: { name: current.name, isActive: current.isActive },
            afterJson: { name: updated.name, isActive: updated.isActive },
          },
        });
        return { id: updated.id, isActive: updated.isActive };
      });
      if (!result) return NextResponse.json({ ok: false, message: 'Product was not found.' }, { status: 404 });
      return NextResponse.json({ ok: true, product: result });
    } catch (error) {
      console.error('Admin product status update failed:', error instanceof Error ? error.message : 'unknown error');
      return NextResponse.json({ ok: false, message: 'Could not update product availability.' }, { status: 500 });
    }
  }

  const variantId = typeof body?.variantId === 'string' ? body.variantId : '';
  const price = Number(body?.price);
  const stock = Number(body?.stock);
  if (!variantId || !Number.isSafeInteger(price) || price < 1 || price > 1_000_000 || !Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000) {
    return NextResponse.json({ ok: false, message: 'Enter a valid price and stock quantity.' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const current = await transaction.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
      if (!current) return null;
      const updated = await transaction.productVariant.update({ where: { id: current.id }, data: { pricePaise: price * 100, stockQty: stock } });
      await transaction.product.update({ where: { id: current.productId }, data: { updatedAt: new Date() } });
      await transaction.auditLog.create({
        data: {
          adminId: user.id,
          entity: 'ProductVariant',
          entityId: current.id,
          beforeJson: { productName: current.product.name, label: current.label, pricePaise: current.pricePaise, stockQty: current.stockQty },
          afterJson: { productName: current.product.name, label: updated.label, pricePaise: updated.pricePaise, stockQty: updated.stockQty },
        },
      });
      return { price: updated.pricePaise / 100, stock: updated.stockQty };
    });
    if (!result) return NextResponse.json({ ok: false, message: 'Product variant was not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, variant: result });
  } catch (error) {
    console.error('Admin product update failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'Could not update the product. Try again.' }, { status: 500 });
  }
}

// Permanently delete a product (used to remove duplicates). Products that appear in past orders
// are hidden instead so order history stays intact.
export async function DELETE(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Database is not configured.' }, { status: 503 });
  const user = await getAuthenticatedUser();
  if (!user?.isAdmin) return NextResponse.json({ ok: false, message: 'Not found.' }, { status: 404 });
  const productId = new URL(request.url).searchParams.get('productId') ?? '';
  if (!productId) return NextResponse.json({ ok: false, message: 'Missing product.' }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({ where: { id: productId }, include: { variants: { select: { id: true } } } });
      if (!product) return { kind: 'missing' as const };
      const usedInOrders = await transaction.orderItem.count({ where: { variantId: { in: product.variants.map((variant) => variant.id) } } });
      if (usedInOrders > 0) {
        await transaction.product.update({ where: { id: productId }, data: { isActive: false } });
        await transaction.auditLog.create({ data: { adminId: user.id, entity: 'Product', entityId: productId, beforeJson: { name: product.name, isActive: product.isActive }, afterJson: { name: product.name, isActive: false, note: 'has order history; hidden instead of deleted' } } });
        return { kind: 'hidden' as const };
      }
      await transaction.productImage.deleteMany({ where: { productId } });
      await transaction.productVariant.deleteMany({ where: { productId } });
      await transaction.product.delete({ where: { id: productId } });
      await transaction.auditLog.create({ data: { adminId: user.id, entity: 'Product', entityId: productId, beforeJson: { name: product.name, slug: product.slug }, afterJson: { deleted: true } } });
      return { kind: 'deleted' as const };
    });
    if (result.kind === 'missing') return NextResponse.json({ ok: false, message: 'Product was not found.' }, { status: 404 });
    if (result.kind === 'hidden') return NextResponse.json({ ok: true, deleted: false, message: 'This product appears in past orders, so it was hidden from the shop instead of deleted.' });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error('Admin product delete failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'Could not delete the product. Try again.' }, { status: 500 });
  }
}
