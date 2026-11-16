import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingFlow } from "@/features/users/OnboardingFlow";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Skip onboarding if already done
  if ((session.user as { onboardingDone?: boolean }).onboardingDone) {
    redirect("/dashboard");
  }

  return <OnboardingFlow userId={session.user.id} userName={session.user.name || ""} />;
}
