"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-xl border border-destructive/30 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
