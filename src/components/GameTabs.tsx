'use client';
import { useState, type ReactNode } from 'react';

type TabKey = 'overview' | 'token' | 'charts' | 'social' | 'activity';

// Oyun detay sekmeleri — aktif sekmeyi mount eder (iframe/social gereksiz yüklenmez).
export function GameTabs({
  overview, token, charts, social, activity, socialCount = 0, activityCount = 0,
}: {
  overview: ReactNode; token: ReactNode; charts: ReactNode; social: ReactNode; activity: ReactNode;
  socialCount?: number; activityCount?: number;
}) {
  const [tab, setTab] = useState<TabKey>('overview');
  const tabs: { k: TabKey; label: string; badge?: number }[] = [
    { k: 'overview', label: 'Overview' },
    { k: 'token', label: 'Token' },
    { k: 'charts', label: 'Charts' },
    { k: 'social', label: 'Social', badge: socialCount },
    { k: 'activity', label: 'Activity', badge: activityCount },
  ];

  return (
    <div className="mt-6">
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(({ k, label, badge }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === k ? 'border-acc text-ink' : 'border-transparent text-dim hover:text-ink'
            }`}
          >
            {label}
            {badge ? <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === k ? 'bg-accSoft text-acc' : 'bg-panel2 text-faint'}`}>{badge}</span> : null}
          </button>
        ))}
      </div>
      <div className="pt-5">
        {tab === 'overview' && overview}
        {tab === 'token' && token}
        {tab === 'charts' && charts}
        {tab === 'social' && social}
        {tab === 'activity' && activity}
      </div>
    </div>
  );
}
