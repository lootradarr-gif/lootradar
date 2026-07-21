// Oyun kayıtları — ileride DB'den (Prisma) gelecek. Şimdilik seed (mock market + opsiyonel tokenAddress).
// tokenAddress DOLU ise DexScreener'dan CANLI veri gelir ve mock'un üstüne yazılır (mergeMarkets).
import { fetchMarkets, type TokenMarket } from './dexscreener';
import { fetchOnline } from './online';
import { prisma } from './prisma';

export type GameStatus = 'MAINNET' | 'TGE' | 'BETA' | 'PRE-TOKEN';

export interface Game {
  id: string;
  name: string;
  ticker: string;           // $TICKER (baştaki $ olmadan)
  genre: string;
  icon: string;             // emoji (iconUrl yoksa fallback)
  iconUrl?: string;         // proje logosu (http(s) veya data URL) — varsa emoji yerine gösterilir
  bannerUrl?: string;       // kart kapak/arkaplan görseli
  status: GameStatus;
  chain: string;            // 'solana'
  tokenAddress?: string;    // dolu → DexScreener canlı veri
  x?: string;               // X profil url
  site?: string;
  playersOnline: number;    // oyun kendi endpoint'inden (yoksa mock)
  holders: number;
  boosted?: boolean;        // ücretli öne çıkarma
  verified?: boolean;       // admin onaylı "gerçek proje" rozeti
  createdAt?: number;       // listeleme zamanı (New listings için)
  rating: number;           // topluluk puanı (0-100 → K formatında)
  voteCount?: number;       // community günlük oyları
  about?: string;           // uzun Overview metni
  screenshots?: string[];   // oyun-içi görsel galerisi
  onlineApiUrl?: string;    // canlı oyuncu endpoint'i
  discord?: string;
  telegram?: string;
  platforms?: string[];
  // mock market (tokenAddress yoksa gösterilir)
  m: { price: number; mcap: number; vol24h: number; change24h: number };
  desc: string;
}

// ── SEED (mock) — gerçek token adresi eklenince o satır CANLI olur ──
// ── GERÇEK Solana oyunları (mint'ler DexScreener'da doğrulandı; tokenAddress → canlı fiyat/chart/logo) ──
export const GAMES: Game[] = [
  { id: 'kintara', name: 'Kintara', ticker: 'KINS', genre: 'mmo', icon: '⚔️', bannerUrl: '/games/kintara.png', status: 'MAINNET', chain: 'solana', tokenAddress: 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump', x: 'https://x.com/PlayKintara', site: 'https://kintara.com/', playersOnline: 0, holders: 4200, rating: 18600, m: { price: 0.005046, mcap: 5_050_000, vol24h: 263_400, change24h: 1.6 }, desc: 'Isometric play-to-earn MMO on Solana — gather, fight, trade and cash out in $KINS.', about: 'Kintara is a browser-based isometric play-to-earn MMO on Solana. Move across a tile map, gather resources, fight monsters, complete quests, trade with other players and explore connected realms — all from one shared character. Sign in with a Solana wallet; the economy is driven by real in-game activity, not speculation alone.' },
  { id: 'pawtato', name: 'Pawtato', ticker: 'TATO', genre: 'rpg', icon: '🥔', bannerUrl: '/games/pawtato.png', status: 'MAINNET', chain: 'solana', tokenAddress: 'pawTUoFAzJt2e6vuqyZ3MwaGKPLuVFDp2CctWAEtato', x: 'https://x.com/PawtatoFinance', site: 'https://pawtato.gg', playersOnline: 0, holders: 3100, rating: 50900, m: { price: 0.007447, mcap: 2_030_000, vol24h: 29_000, change24h: -1.2 }, desc: 'Cozy creature-collecting RPG with a player-driven $TATO economy.', about: 'Pawtato is a cozy creature-collecting RPG on Solana. Raise and evolve companions, take on adventures and earn $TATO through play. A relaxed, approachable on-chain game with a lively community and a real token economy.' },
  { id: 'afkheroes', name: 'AFK Heroes', ticker: 'AFKHERO', genre: 'idle-rpg', icon: '🛡️', bannerUrl: '/games/afkheroes.png', status: 'MAINNET', chain: 'solana', tokenAddress: '9kwT8gUEMKQhnmc4mVb2iUAybfjzvVMM5LwffKFcpump', x: 'https://x.com/AFKHeroesXYZ', site: 'https://afkheroes.xyz/', playersOnline: 0, holders: 900, rating: 3300, m: { price: 0.000075, mcap: 71_100, vol24h: 8_500, change24h: -9.7 }, desc: 'Idle RPG — your heroes farm loot and $AFKHERO while you are away.', about: 'AFK Heroes is an idle RPG on Solana. Assemble a party, send them on auto-battles and collect rewards even while offline. Progress your heroes, climb the stages and earn $AFKHERO — the game keeps playing when you do not.' },
  { id: 'tidefall', name: 'Tidefall', ticker: 'TIDE', genre: 'survival', icon: '🌊', bannerUrl: '/games/tidefall.png', status: 'MAINNET', chain: 'solana', tokenAddress: 'utP3y4LCfPtGSBNDE96fz7CWH6AZe2whU2yVmMWpump', x: 'https://x.com/playtidefall', site: 'https://tidefall.online/', playersOnline: 0, holders: 640, boosted: true, rating: 11400, m: { price: 0.000108, mcap: 108_000, vol24h: 24_100, change24h: 12.4 }, desc: 'Hardcore top-down extraction survival on Solana — raid, loot, extract alive or lose it all.', about: 'Tidefall is a hardcore top-down extraction survival game on Solana. Drop into contested zones, scavenge for loot, fight other players and try to extract alive — die and you drop everything. High-risk, high-reward gameplay with an on-chain $TIDE economy.' },
  { id: 'staratlas', name: 'Star Atlas', ticker: 'ATLAS', genre: 'mmo', icon: '🚀', iconUrl: '/games/staratlas-icon.jpg', bannerUrl: '/games/staratlas.png', status: 'MAINNET', chain: 'solana', tokenAddress: 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx', x: 'https://x.com/staratlas', site: 'https://staratlas.com/', playersOnline: 0, holders: 25000, rating: 40000, m: { price: 0.0024, mcap: 7_060_000, vol24h: 120_000, change24h: -2.1 }, desc: 'Grand-strategy space MMO — conquer, trade and build across a vast metaverse.', about: 'Star Atlas is a grand-strategy space exploration MMO on Solana. Command fleets, mine resources, trade across star systems and battle for territory in a sprawling sci-fi metaverse powered by the $ATLAS and $POLIS tokens.' },
  { id: 'genopets', name: 'Genopets', ticker: 'GENE', genre: 'rpg', icon: '🧬', iconUrl: '/games/genopets-icon.jpg', bannerUrl: '/games/genopets.png', status: 'MAINNET', chain: 'solana', tokenAddress: 'GENEtH5amGSi8kHAtQoezp1XEXwZJ8vcuePYnXdKrMYz', x: 'https://x.com/genopets', site: 'https://www.genopets.me/', playersOnline: 0, holders: 9000, rating: 15000, m: { price: 0.012, mcap: 321_000, vol24h: 6_400, change24h: -1.8 }, desc: 'Move-to-earn RPG — turn your daily steps into a living, evolving Genopet.', about: 'Genopets is a move-to-earn NFT RPG on Solana. Your real-world steps power a living digital pet — a Genopet — that you nurture, evolve and battle. Craft, explore the habitat world and earn $GENE and $KI through active play.' },
  { id: 'honeyland', name: 'Honeyland', ticker: 'HXD', genre: 'strategy', icon: '🍯', iconUrl: '/games/honeyland-icon.jpg', bannerUrl: '/games/honeyland.png', status: 'MAINNET', chain: 'solana', tokenAddress: '3dgCCb15HMQSA4Pn3Tfii5vRk7aRqTH95LJjxzsG2Mug', x: 'https://x.com/Honeyland_Game', site: 'https://www.honey.land/', playersOnline: 0, holders: 5000, rating: 8000, m: { price: 0.0004, mcap: 36_200, vol24h: 5_900, change24h: -14.3 }, desc: 'Strategy land-management game — harvest honey, raise bees and battle for territory.', about: 'Honeyland is a mobile strategy game on Solana where you manage plots of land, raise bees, harvest honey and compete for territory. A polished, accessible P2E title with a large mobile player base and the $HXD / $HONEY economy.' },
  { id: 'rekto', name: 'RektoFun', ticker: 'REKTO', genre: 'shooter', icon: '💥', bannerUrl: '/games/rekto.png', status: 'MAINNET', chain: 'solana', tokenAddress: '13QUwwFK5bMTrxZ9xhYpD8oEVizRSFk79nTQqtvFEASY', x: 'https://x.com/Rektofun', site: 'https://www.rekto.fun/', playersOnline: 0, holders: 720, rating: 6600, m: { price: 0.00018, mcap: 18_500, vol24h: 13_800, change24h: 6.2 }, desc: 'Fast, degen PvP arena on Solana — get rekt or get paid.', about: 'RektoFun is a fast-paced PvP arena game on Solana built for the trenches. Jump into quick matches, wager and win, and climb the leaderboards. Lightweight, degen-friendly and fully on-chain around the $REKTO token.' },
  { id: 'pumpchess', name: 'Pump Chess', ticker: 'CHESS', genre: 'strategy', icon: '♟️', bannerUrl: '/games/pumpchess.png', status: 'MAINNET', chain: 'solana', tokenAddress: '95DkBPaKpUMPFkK5AJd9SfjcnuTCHNDLpwiUon3ppump', x: 'https://x.com/pumpchess', site: 'https://www.playpumpchess.com/', playersOnline: 0, holders: 480, rating: 4100, m: { price: 0.000016, mcap: 16_600, vol24h: 10_700, change24h: -3.1 }, desc: 'On-chain chess with wagered matches and collectible meme piece sets.', about: 'Pump Chess brings chess on-chain on Solana. Play ranked or wagered matches, collect themed and meme chess piece sets, and earn as you win. Familiar gameplay with a crypto-native twist around the $CHESS token.' },
  { id: 'chainera', name: 'Chainera', ticker: 'CERA', genre: 'rpg', icon: '🗡️', bannerUrl: '/games/chainera.png', status: 'MAINNET', chain: 'solana', tokenAddress: 'Fbeo1oQ6v4AtErAuSeAPfCy69vo1Rq1voE6uMGhNpump', x: 'https://x.com/playchainera', site: 'https://chainera.fun', playersOnline: 0, holders: 330, rating: 3900, m: { price: 0.00003, mcap: 31_900, vol24h: 6_100, change24h: 4.5 }, desc: 'On-chain RPG adventure — quest, level up and earn across a living world.', about: 'Chainera is an on-chain RPG adventure on Solana. Create a hero, take on quests, battle enemies and progress through a persistent world where your actions and items live on-chain, powered by the $CERA token.' },
];

// Canlı market verisi → oyun listesine bindir (adres varsa DexScreener kazanır).
export interface GameWithMarket extends Game {
  live: boolean;
  market: { price: number; mcap: number; vol24h: number; change24h: number };
  dexUrl: string | null;
  pairAddress: string | null;
  createdAt: number; // ms — "Newest" sıralaması için
}

// DB enum (PRE_TOKEN) → görüntü statüsü ('PRE-TOKEN')
function dbStatus(s: string): GameStatus {
  return s === 'PRE_TOKEN' ? 'PRE-TOKEN' : (s as GameStatus);
}

// CANLI KAYNAK: onaylı oyunları Neon DB'den çeker; tokenAddress varsa DexScreener canlı verisi bindirilir.
export async function getGamesWithMarkets(): Promise<GameWithMarket[]> {
  const rows = await prisma.game.findMany({
    where: { reviewStatus: 'APPROVED' },
    orderBy: [{ featured: 'desc' }, { sortWeight: 'desc' }, { createdAt: 'asc' }],
  });
  const addrs = rows.map((r) => r.tokenAddress).filter(Boolean) as string[];
  let live: Record<string, TokenMarket> = {};
  try { live = await fetchMarkets(addrs); } catch { /* dış API hatası → mock kalır */ }

  // canlı oyuncu sayıları — kendi endpoint'i olan oyunlar için paralel çek (hata → stored)
  const onlinePairs = await Promise.all(
    rows.map(async (r) => [r.slug, r.onlineApiUrl ? await fetchOnline(r.onlineApiUrl) : null] as const),
  );
  const online: Record<string, number | null> = Object.fromEntries(onlinePairs);

  return rows.map((r) => {
    const lm = r.tokenAddress ? live[r.tokenAddress] : undefined;
    const liveOnline = online[r.slug];
    return {
      id: r.slug,
      name: r.name,
      ticker: r.ticker,
      genre: r.genre,
      icon: r.icon,
      // iconUrl boşsa DexScreener token logosunu kullan (gerçek logo, bedava)
      iconUrl: r.iconUrl ?? lm?.imageUrl ?? undefined,
      bannerUrl: r.bannerUrl ?? undefined,
      status: dbStatus(r.status),
      chain: r.chain,
      tokenAddress: r.tokenAddress ?? undefined,
      x: r.x ?? undefined,
      site: r.site ?? undefined,
      playersOnline: liveOnline ?? r.playersOnline,
      holders: r.holders,
      rating: r.rating,
      voteCount: r.voteCount,
      about: r.about || undefined,
      screenshots: r.screenshots ?? [],
      onlineApiUrl: r.onlineApiUrl ?? undefined,
      discord: r.discord ?? undefined,
      telegram: r.telegram ?? undefined,
      platforms: r.platforms ?? [],
      // boost aktif mi: featured + (süresiz VEYA bitiş gelecekte)
      boosted: r.featured && (!r.featuredUntil || r.featuredUntil > new Date()),
      verified: r.verified,
      createdAt: r.createdAt.getTime(),
      desc: r.desc,
      m: { price: r.mockPrice ?? 0, mcap: r.mockMcap ?? 0, vol24h: r.mockVol24h ?? 0, change24h: r.mockChange24h ?? 0 },
      live: !!lm,
      market: lm
        ? { price: lm.priceUsd, mcap: lm.marketCap, vol24h: lm.volume24h, change24h: lm.change24h }
        : { price: r.mockPrice ?? 0, mcap: r.mockMcap ?? 0, vol24h: r.mockVol24h ?? 0, change24h: r.mockChange24h ?? 0 },
      dexUrl: lm?.dexUrl ?? null,
      pairAddress: lm?.pairAddress ?? null,
    };
  });
}

// Toplam istatistikler
export function totals(games: GameWithMarket[]) {
  const mcap = games.reduce((s, g) => s + g.market.mcap, 0);
  const vol = games.reduce((s, g) => s + g.market.vol24h, 0);
  const reach = games.reduce((s, g) => s + g.rating, 0);
  return { count: games.length, mcap, vol, reach };
}
