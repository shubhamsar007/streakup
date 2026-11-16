import { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getFollowingFeed, getDiscoverFeed } from "@/server/services/feedService";
import { CommunityFeed } from "@/features/social/CommunityFeed";
import Link from "next/link";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { tab } = await searchParams;
  const activeTab = tab === "discover" ? "discover" : "following";

  let activities: Awaited<ReturnType<typeof getFollowingFeed>>["activities"] = [];
  let nextCursor: string | null = null;

  if (session) {
    if (activeTab === "following") {
      const result = await getFollowingFeed(session.user.id);
      activities = result.activities;
      nextCursor = result.nextCursor;
    } else {
      const result = await getDiscoverFeed(session.user.id);
      activities = result.activities;
      nextCursor = result.nextCursor;
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See what others are accomplishing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <Link
          href="/community"
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "following"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Following
        </Link>
        <Link
          href="/community?tab=discover"
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "discover"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Discover
        </Link>
      </div>

      {session ? (
        <CommunityFeed
          initialActivities={activities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
          initialNextCursor={nextCursor}
          feedType={activeTab as "following" | "discover"}
          currentUserId={session.user.id}
          emptyMessage={
            activeTab === "following"
              ? "Follow people to see their activity here."
              : "No public activity to discover yet."
          }
        />
      ) : (
        <p className="text-muted-foreground">Sign in to see the community feed.</p>
      )}
    </div>
  );
}
