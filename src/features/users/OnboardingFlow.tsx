"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TIMEZONES = Intl.supportedValuesOf("timeZone");

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(160, "Bio must be under 160 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface OnboardingFlowProps {
  userId: string;
  userName: string;
}

export function OnboardingFlow({ userId, userName }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  });
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: userName, bio: "" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: userName },
  });

  async function handleProfileSubmit(data: ProfileFormData) {
    setProfileData({ fullName: data.fullName, bio: data.bio || "" });
    setStep(2);
  }

  async function completeOnboarding() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/users/me/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileData.fullName,
          bio: profileData.bio,
          timezone,
          visibility,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary mb-4">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set up your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Just a few steps to get started</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Profile details</h2>
            <p className="mb-6 text-sm text-muted-foreground">Tell us a bit about yourself</p>

            <form onSubmit={handleSubmit(handleProfileSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Your name"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  id="bio"
                  placeholder="A short bio about yourself..."
                  rows={3}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-xs text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: Timezone */}
        {step === 2 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Your timezone</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Accurate timezone ensures your streaks are calculated correctly
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Privacy */}
        {step === 3 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Account privacy</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Control who can see your activity
            </p>

            <div className="space-y-3 mb-6">
              {[
                {
                  value: "PUBLIC" as const,
                  title: "Public account",
                  description: "Anyone can see your profile and habits",
                },
                {
                  value: "PRIVATE" as const,
                  title: "Private account",
                  description: "Only approved followers can see your activity",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    visibility === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full border-2 ${
                        visibility === option.value
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">{option.title}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={completeOnboarding}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
