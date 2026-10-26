import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasDatabaseConfig } from '@/lib/prisma';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function imageExtension(contentType: string, bytes: Uint8Array) {
  if (contentType === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (contentType === 'image/png' && bytes.subarray(0, 8).join(',') === '137,80,78,71,13,10,26,10') return 'png';
  if (contentType === 'image/webp' && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return 'webp';
  return null;
}

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Database is not configured.' }, { status: 503 });
  const user = await getAuthenticatedUser();
  if (!user?.isAdmin) return NextResponse.json({ ok: false, message: 'Not found.' }, { status: 404 });

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES + 64 * 1024) {
    return NextResponse.json({ ok: false, message: 'Image must be smaller than 4 MB.' }, { status: 413 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: 'Choose an image to upload.' }, { status: 400 });
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) return NextResponse.json({ ok: false, message: 'Image must be smaller than 4 MB.' }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(file.type, bytes);
  if (!extension) return NextResponse.json({ ok: false, message: 'Use a valid JPEG, PNG, or WebP image.' }, { status: 415 });

  const filename = `${randomUUID()}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`product-images/${filename}`, new Blob([bytes], { type: file.type }), {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.type,
        cacheControlMaxAge: 31536000,
      });
      return NextResponse.json({ ok: true, url: blob.url }, { status: 201 });
    } catch (error) {
      console.error('Vercel Blob upload failed:', error instanceof Error ? error.message : 'unknown error');
      // Fall through to local save if blob failed
    }
  }

  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));
    return NextResponse.json({ ok: true, url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error('Product image local save failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'Image upload failed. Try again.' }, { status: 502 });
  }
}