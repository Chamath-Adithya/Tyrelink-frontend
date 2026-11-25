/**
 * Adaptive client-side image compression for low-bandwidth merchant uploads.
 * Resizes proportionally inside maxDimension and iteratively steps quality down
 * until output fits under maxBytes (default 70 KB WebP, JPEG fallback).
 */
export async function compressProductImageFile(
  file: File,
  options: { maxDimension?: number; maxBytes?: number } = {}
): Promise<{ dataUrl: string; byteSize: number; format: 'webp' | 'jpeg' }> {
  const maxDimension = options.maxDimension ?? 720;
  const maxBytes = options.maxBytes ?? 70 * 1024;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.drawImage(bitmap, 0, 0, width, height);

    let dataUrl = '';
    let format: 'webp' | 'jpeg' = 'webp';
    for (const q of [0.82, 0.72, 0.6, 0.48]) {
      dataUrl = canvas.toDataURL('image/webp', q);
      if (!dataUrl.startsWith('data:image/webp')) {
        format = 'jpeg';
        dataUrl = canvas.toDataURL('image/jpeg', q);
      }
      if (dataUrl.length <= maxBytes * 1.37) {
        break;
      }
    }

    const base64Part = dataUrl.split(',')[1] || '';
    const byteSize = Math.floor((base64Part.length * 3) / 4);
    return { dataUrl, byteSize, format };
  } finally {
    bitmap.close?.();
  }
}

