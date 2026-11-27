import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPublicProfile } from "@/server/services/profileService";
import { FollowButton } from "@/features/social/FollowButton";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { prisma } from "@/lib/prisma";
import { Flame, Users, Trophy, Lock, Settings, CheckCircle, Hash, Timer } from "lucide-react";
import { format } from "date-fns";

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLast49Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]!);
  }
  return days;
}

function getTrackingIcon(type: string) {
  if (type === "COUNT") return <Hash className="h-3 w-3" />;
  if (type === "DURATION") return <Timer className="h-3 w-3" />;
  return <CheckCircle className="h-3 w-3" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const todayStr = new Date().toISOString().split("T")[0]!;

  // Completion dot data — last 49 days
  let completionSet = new Set<string>();
  if (profile.canViewContent) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 48);
    startDate.setHours(0, 0, 0, 0);

    const completions = await prisma.habitCompletion.findMany({
      where: {
        habit: { userId: profile.id },
        localDate: { gte: startDate },
      },
      select: { localDate: true },
    });

    completionSet = new Set(
      completions.map((c) => new Date(c.localDate).toISOString().split("T")[0]!)
    );
  }

  const last49Days = getLast49Days();

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4 sm:px-6">
        {/* Avatar + Name row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-20 w-20 rounded-full bg-secondary shrink-0 overflow-hidden ring-2 ring-border">
            {profile.profile?.avatarUrl ? (
              <img
                src={profile.profile.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground leading-tight truncate">
              {displayName}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile.habits.length} active habit{profile.habits.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Settings link — own profile only */}
          {profile.isOwnProfile && (
            <Link
              href="/settings"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Settings className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Streak line */}
        {profile.canViewContent && (
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-primary shrink-0" />
            <span className="text-[15px] font-semibold text-foreground">
              {profile.currentStreak} day streak
            </span>
            {profile.currentStreak > 0 && (
              <span className="text-xs text-muted-foreground">· best {profile.longestStreak} days</span>
            )}
          </div>
        )}

        {/* Followers line */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Users className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{profile.followersCount}</strong> followers
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">{profile.followingCount}</strong> following
          </span>
          <span>·</span>
          <span>Joined {joinedDate}</span>
        </div>

        {/* Bio */}
        {profile.profile?.bio && (
          <p className="text-sm text-foreground/80 mb-4">{profile.profile.bio}</p>
        )}

        {/* Action buttons */}
        {profile.isOwnProfile ? (
          <div className="flex gap-3">
            <Link
              href="/settings"
              className="flex-1 flex items-center justify-center rounded-xl border border-border bg-secondary py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70 transition-colors"
            >
              Edit Profile
            </Link>
            <div className="flex-1">
              <LogoutButton />
            </div>
          </div>
        ) : (
          session && (
            <FollowButton
              userId={profile.id}
              initialStatus={profile.followStatus}
            />
          )
        )}
      </div>

      {/* ── Private gate ───────────────────────────────────────────────── */}
      {!profile.canViewContent && (
        <div className="mx-4 rounded-2xl border border-border bg-card p-10 flex flex-col items-center gap-3 text-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">This account is private</p>
          <p className="text-sm text-muted-foreground">
            Follow {displayName} to see their habits and activity.
          </p>
        </div>
      )}

      {profile.canViewContent && (
        <div className="space-y-3 pb-4">
          {/* ── Streak card with dot grid ───────────────────────────────── */}
          <div className="mx-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Streak</span>
              <span className="text-xs text-muted-foreground">Last 7 weeks</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Left: big flame + number */}
              <div className="flex flex-col items-center shrink-0 w-20">
                <Flame className="h-10 w-10 text-primary mb-1" />
                <span className="text-3xl font-bold text-foreground leading-none">
                  {profile.currentStreak}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">days</span>
              </div>

              {/* Right: dot grid (7 cols × 7 rows) */}
              <div className="flex-1">
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
                >
                  {last49Days.map((dateStr) => {
                    const isCompleted = completionSet.has(dateStr);
                    const isToday = dateStr === todayStr;
                    return (
                      <div
                        key={dateStr}
                        title={dateStr}
                        className={`aspect-square rounded-full transition-colors ${
                          isCompleted
                            ? "bg-primary"
                            : isToday
                            ? "border-2 border-primary/60 bg-transparent"
                            : "bg-secondary"
                        }`}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
                    Completed
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-secondary border border-border inline-block" />
                    Missed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats row ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 mx-4">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{profile.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <Trophy className="h-5 w-5 text-warning mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{profile.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Best</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <CheckCircle className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{profile.habits.length}</p>
              <p className="text-xs text-muted-foreground">Habits</p>
            </div>
          </div>

          {/* ── Active habits ───────────────────────────────────────────── */}
          {profile.habits.length > 0 && (
            <div className="mx-4 rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">Active Habits</h2>
              <div className="space-y-2.5">
                {profile.habits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {getTrackingIcon(habit.trackingType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{habit.name}</p>
                      <p className="text-xs text-muted-foreground">{habit.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
