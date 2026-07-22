import { put } from '@vercel/blob';
import { createHash } from 'crypto';

// Görselleri Vercel Blob'a taşır. Amaç: base64 data-URI'leri HTML'e gömmeyi bırakmak
// (data-URI'ler sayfayı megabaytlarca şişiriyor + cache'lenemiyor). Blob URL'i kısa + CDN-cache'li.
//
// - http(s) URL gelirse: zaten barındırılıyor, olduğu gibi döner.
// - data:image/... gelirse: decode edip Blob'a yükler, public URL döner.
// - Anahtar = içerik SHA-256'sı → AYNI görsel tekrar yüklenmez (dedupe + migration idempotent).
// - Geçersiz/boş → null.

const DATA_RE = /^data:(image\/(?:png|jpe?g|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)$/i;

export function isDataUri(v: string | null | undefined): boolean {
  return !!v && DATA_RE.test(v.trim());
}

export async function persistImage(value: string | null | undefined, prefix: string): Promise<string | null> {
  const v = (value ?? '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v.slice(0, 1000); // zaten barındırılıyor
  const m = DATA_RE.exec(v);
  if (!m) return null;

  const mime = m[1].toLowerCase();
  const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/svg+xml' ? 'svg' : mime.split('/')[1];
  const buf = Buffer.from(m[2], 'base64');
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
  const key = `${prefix}/${hash}.${ext}`;

  const { url } = await put(key, buf, {
    access: 'public',
    contentType: mime,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false, // hash zaten benzersiz → sabit URL, tekrar yüklemede aynı
    allowOverwrite: true,
  });
  return url;
}
