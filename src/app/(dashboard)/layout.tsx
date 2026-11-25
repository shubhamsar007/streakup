import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { prisma } from "@/lib/prisma";
import { getUnreadCount } from "@/server/services/notificationService";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Fetch profile and unread notification count for the header
  const [profile, unreadCount] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    getUnreadCount(session.user.id),
  ]);

  const headerUser = {
    name: profile?.fullName || session.user.name,
    username: session.user.username as string | undefined,
    avatarUrl: profile?.avatarUrl,
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar unreadCount={unreadCount} />
      <div className="lg:pl-60">
        <AppHeader user={headerUser} unreadCount={unreadCount} />
        <main className="pb-24 lg:pb-6">{children}</main>
      </div>
      <MobileNavigation />
      <PWAInstallPrompt />
    </div>
  );
}
