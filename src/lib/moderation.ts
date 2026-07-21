// İçerik moderasyonu — post/yorumda: kontrat adresi (CA), link, scam kalıpları, küfür engeli.
// Sunucu tarafında zorunlu. Amaç: shill/scam/spam ve taciz önlemek.

const CA_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/;              // Solana adresi / kontrat
const URL_RE = /(https?:\/\/|www\.|\b\w+\.(io|xyz|fun|com|net|app|gg|to|me|link)\b|t\.me\/|discord\.(gg|com)|@\w+)/i;
const SCAM_RE = [
  /air\s*drop.{0,20}(claim|now|live|free)/i, /claim.{0,20}air\s*drop/i,
  /free\s*(mint|sol|nft|tokens?)/i, /connect.{0,15}wallet.{0,15}(here|now|to)/i,
  /1000\s*x/i, /100\s*x/i, /guaranteed/i, /giveaway/i, /dm\s*(me|for)/i,
  /pre\s*sale/i, /whitelist.{0,10}(spot|now)/i, /send.{0,10}sol/i, /pump.{0,10}now/i,
];
// modest çok-dilli küfür listesi (EN + TR) — link/CA engeli asıl scam korumasını yapar.
const PROFANITY = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'faggot', 'nigger', 'retard', 'whore', 'slut',
  'amk', 'aq', 'orospu', 'piç', 'pic ', 'yavşak', 'göt', 'sik', 'sikeyim', 'siktir', 'oç', 'gavat', 'ibne', 'pezevenk', 'yarrak', 'amcık',
];

// opts: sahip başvurusunda (admin onaylı) About için adres/link serbest bırakılabilir.
export function moderate(input: string, opts: { allowAddresses?: boolean; allowLinks?: boolean } = {}): { ok: boolean; reason?: string } {
  const text = (input || '').trim();
  if (!text) return { ok: false, reason: 'Say something first.' };
  if (!opts.allowAddresses && CA_RE.test(text)) return { ok: false, reason: 'Contract addresses / wallet addresses aren’t allowed.' };
  if (!opts.allowLinks && URL_RE.test(text)) return { ok: false, reason: 'Links, handles and domains aren’t allowed in posts.' };
  for (const r of SCAM_RE) if (r.test(text)) return { ok: false, reason: 'This looks like spam or a scam.' };
  const low = ` ${text.toLowerCase()} `;
  for (const w of PROFANITY) if (low.includes(w)) return { ok: false, reason: 'Please keep it clean — no profanity.' };
  return { ok: true };
}
