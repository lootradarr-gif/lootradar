// Feed + Events + Community — ileride DB'den. Şimdilik seed.

export interface EventItem { id: string; game: string; title: string; at: number; }
export interface FeedPost { id: string; author: string; game?: string; text: string; url?: string; votes: number; comments: number; at: number; }

const h = (n: number) => Date.now() - n * 3600_000;

export const EVENTS: EventItem[] = [
  { id: 'e1', game: 'Rekto', title: 'RektoFun mainnet is officially LIVE', at: h(1) },
  { id: 'e2', game: 'Ocean Hunter', title: '$PEARL TGE is live — token trading on Solana', at: h(2) },
  { id: 'e3', game: 'World of Claudecraft', title: 'Steam listing teased', at: h(4) },
  { id: 'e4', game: 'AFK Heroes', title: 'Founder Pack presale — 500 ever, pay in $AFKHERO for 10% off', at: h(6) },
  { id: 'e5', game: 'Chainera', title: 'Crosses 100 concurrent online players', at: h(5) },
  { id: 'e6', game: 'Ocean Hunter', title: 'Team cuts Hold-to-Activate costs after Day-1 backlash', at: h(5) },
  { id: 'e7', game: 'Tidefall', title: 'Teases earnings boost + contested airdrops', at: h(8) },
  { id: 'e8', game: 'Pump Chess', title: 'Limited meme-themed chess piece set launched', at: h(1) },
];

export const FEED: FeedPost[] = [
  { id: 'f1', author: 'DZ5C…KVXd', text: 'New fishing event just dropped, rewards are actually good', url: 'https://x.com/pearlharvest', votes: 4, comments: 1, at: h(24) },
  { id: 'f2', author: '35c6…pHhd', text: 'get rekt season is heating up 🔥', url: 'https://x.com/playgetrekt', votes: 2, comments: 1, at: h(26) },
  { id: 'f3', author: 'B8ub…nVQa', game: 'SolValleys', text: 'games actually good i want to boost it, please review 🙏', url: 'https://x.com/SolValleys', votes: 6, comments: 3, at: h(48) },
];
