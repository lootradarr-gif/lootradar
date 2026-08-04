// X (Twitter) PAYLAŞIM DOĞRULAMA — API anahtarı olmadan.
//
// NEDEN BÖYLE: X API'nin ücretli katmanı ($100/ay) bu iş için gereksiz. X'in kendi
// gömme (embed) altyapısı olan syndication ucu, herkese açık bir tweet'in metnini,
// yazarını ve tarihini kimlik doğrulaması olmadan döner — gömülü tweet'ler zaten bunu
// kullanıyor. Biz de aynı ucu kullanıp tweet'i SUNUCUDA doğruluyoruz.
//
// GÜVEN MODELİ — üç katman, üçü de sunucu tarafında:
//   1. HESAP BAĞLAMA: kullanıcı, cüzdanına özel tek kullanımlık bir kodu tweetler.
//      Kodu ancak hesabın gerçek sahibi atabilir → handle ↔ cüzdan bağı kanıtlanır.
//   2. YAZAR EŞLEŞMESİ: XP veren her tweet, bağlı handle'a ait OLMAK ZORUNDA.
//      Başkasının tweet'ini yapıştırmak işe yaramaz.
//   3. TEKRAR KORUMASI: tweetId veritabanında @unique → aynı tweet iki kez sayılmaz.
const OFFICIAL = 'lootradario';

/** X'in gömme ucunun beklediği türetilmiş token — sabit bir sır değil, id'den hesaplanır. */
function synToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
}

/** URL'den tweet id'sini çıkar. x.com, twitter.com ve mobile.* biçimlerini kabul eder. */
export function tweetIdFrom(url: string): string | null {
  const m = String(url).match(/(?:twitter|x)\.com\/[^/]+\/status(?:es)?\/(\d{5,25})/i);
  return m ? m[1] : null;
}

export interface Tweet {
  id: string;
  handle: string;        // küçük harfe indirgenmiş screen_name
  name: string;
  text: string;          // t.co linkleri genişletilmiş hâliyle
  createdAt: Date;
}

/**
 * Tweet'i çek. Bulunamazsa / özel hesapsa / silinmişse null.
 * Metne entities.urls içindeki GENİŞLETİLMİŞ adresleri de ekliyoruz; ham `text`
 * alanında linkler t.co kısaltması olarak durur ve "lootradar.io geçiyor mu"
 * kontrolü aksi hâlde her zaman başarısız olurdu.
 */
export async function fetchTweet(id: string): Promise<Tweet | null> {
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${synToken(id)}`;
  try {
    const r = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; LootRadar/1.0)' },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    if (!j?.id_str || !j?.user?.screen_name) return null;

    const expanded: string[] = [
      ...(j.entities?.urls ?? []).map((u: any) => u.expanded_url || ''),
      j.card?.binding_values?.card_url?.string_value || '',
    ].filter(Boolean);

    return {
      id: String(j.id_str),
      handle: String(j.user.screen_name).toLowerCase(),
      name: String(j.user.name || j.user.screen_name),
      text: `${j.text || ''} ${expanded.join(' ')}`.trim(),
      createdAt: new Date(j.created_at || Date.now()),
    };
  } catch {
    return null;
  }
}

/**
 * Cüzdana özel bağlama kodu. Deterministik ve tahmin edilemez olmalı:
 * kullanıcı tweetleyene kadar kodu bilen tek taraf sunucu + cüzdan sahibi.
 */
export function linkCode(wallet: string): string {
  // Oturum imzalamada kullanılan sırrın aynısı — prod'da kesin tanımlı.
  const secret = process.env.LOOTRADAR_ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'loot-x-dev';
  // crypto senkron kullanılabilir; bu fonksiyon sadece sunucuda çağrılır
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHmac } = require('crypto') as typeof import('crypto');
  return createHmac('sha256', secret).update(`xlink:${wallet}`).digest('hex').slice(0, 8).toUpperCase();
}

/** Bağlama tweet'i geçerli mi — kodu içermeli. */
export function checksLinkCode(t: Tweet, wallet: string): boolean {
  return t.text.toUpperCase().includes(linkCode(wallet));
}

/**
 * XP verilecek paylaşım geçerli mi?
 * Aranan: siteden bahsetmiş olmak (link ya da resmî hesabın etiketi) + yeterli emek.
 */
export function checkShare(t: Tweet): { ok: true } | { ok: false; reason: string } {
  const low = t.text.toLowerCase();
  const mentions = low.includes('lootradar.io') || low.includes(`@${OFFICIAL}`) || low.includes('$loot');
  if (!mentions) return { ok: false, reason: 'Your post must mention lootradar.io, @LootRadario or $LOOT.' };

  // 7 günden eski gönderiler sayılmaz — arşiv taramasıyla toplu XP alınmasın.
  const ageDays = (Date.now() - t.createdAt.getTime()) / 86_400_000;
  if (ageDays > 7) return { ok: false, reason: 'That post is older than 7 days.' };
  if (ageDays < -0.1) return { ok: false, reason: 'Invalid post date.' };

  // Sadece link atıp geçmek olmaz; birkaç kelime yazılmış olsun.
  const words = t.text.replace(/https?:\/\/\S+/g, '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 4) return { ok: false, reason: 'Write at least a few words about the game or the site.' };

  return { ok: true };
}

export const OFFICIAL_HANDLE = OFFICIAL;
