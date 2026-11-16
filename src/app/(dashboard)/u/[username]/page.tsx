import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPublicProfile } from "@/server/services/profileService";
import { FollowButton } from "@/features/social/FollowButton";
import { ActivityCard } from "@/features/social/ActivityCard";
import { Flame, Users, Trophy, Lock, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const profile = await getPublicProfile(username, session?.user.id);

  if (!profile) notFound();

  const displayName = profile.profile?.fullName ?? profile.username;
  const joinedDate = format(new Date(profile.createdAt), "MMMM yyyy");

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-secondary flex-shrink-0 overflow-hidden">
            {profile.profile?.avatarUrl ? (
              <img
                src={profile.profile.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              {!profile.isOwnProfile && session && (
                <FollowButton
                  userId={profile.id}
                  initialStatus={profile.followStatus}
                />
              )}
            </div>
            {profile.profile?.bio && (
              <p className="mt-2 text-sm text-foreground/80">{profile.profile.bio}</p>
            )}
            <div className="mt-3 flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <strong className="text-foreground">{profile.followersCount}</strong> followers
              </span>
              <span className="flex items-center gap-1">
                <strong className="text-foreground">{profile.followingCount}</strong> following
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined {joinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Private profile gate */}
      {!profile.canViewContent && (
        <div className="rounded-xl border border-border bg-card p-10 flex flex-col items-center gap-3 text-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">This account is private</p>
          <p className="text-sm text-muted-foreground">
            Follow {displayName} to see their habits and activity.
          </p>
        </div>
      )}

      {profile.canViewContent && (
        <>
          {/* Streak stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="h-4 w-4 text-warning" />
              </div>
              <p className="text-2xl font-bold">{profile.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Current streak</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{profile.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Best streak</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{profile.habits.length}</p>
              <p className="text-xs text-muted-foreground">Active habits</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{profile.recentActivities.length}</p>
              <p className="text-xs text-muted-foreground">Recent activities</p>
            </div>
          </div>

          {/* Habits */}
          {profile.habits.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Habits
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.habits.map((habit) => (
                  <span
                    key={habit.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs"
                  >
                    <Flame className="h-3 w-3 text-warning" />
                    {habit.name}
                    <span className="text-muted-foreground capitalize">
                      · {habit.category.toLowerCase()}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          {profile.recentActivities.length > 0 && session && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Recent Activity
              </h2>
              {profile.recentActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={{
                    id: activity.id,
                    type: activity.type,
                    createdAt: activity.createdAt.toISOString(),
                    likeCount: activity.likeCount,
                    commentCount: activity.commentCount,
                    isLiked: activity.isLiked,
                    user: {
                      id: profile.id,
                      username: profile.username,
                      profile: profile.profile
                        ? { fullName: profile.profile.fullName, avatarUrl: profile.profile.avatarUrl }
                        : null,
                    },
                    habit: activity.habit
                      ? { id: activity.habit.id, name: activity.habit.name, category: "GENERAL" }
                      : null,
                    metadata: activity.metadata as {
                      habitName?: string;
                      completedValue?: number | null;
                      unit?: string | null;
                    } | null,
                  }}
                  currentUserId={session.user.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
