import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { USER_COOKIE, verifyUserSession } from '@/lib/user-auth';
import { ProfileHeader, type ProfileData } from '@/components/ProfileHeader';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: { wallet: string } }) {
  const wallet = params.wallet;
  const sessionWallet = verifyUserSession(cookies().get(USER_COOKIE)?.value);
  const isOwner = sessionWallet === wallet;

  const user = await prisma.user.findUnique({
    where: { wallet },
    select: { wallet: true, displayName: true, avatarUrl: true, bio: true, xp: true, banned: true, createdAt: true },
  });

  if (user?.banned) {
    return <div className="mx-auto max-w-md pt-24 text-center text-dim">This profile is unavailable.</div>;
  }

  const profile: ProfileData = {
    wallet,
    displayName: user?.displayName ?? null,
    avatarUrl: user?.avatarUrl ?? null,
    bio: user?.bio ?? '',
    xp: user?.xp ?? 0,
    joined: user ? user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
  };

  return (
    <div className="mx-auto max-w-2xl pt-8">
      <ProfileHeader profile={profile} isOwner={isOwner} />
      {/* S2'de: bu kullanıcının postları buraya gelecek */}
      <div className="card mt-4 p-6 text-center text-sm text-faint">
        Posts and activity will appear here soon.
      </div>
    </div>
  );
}
