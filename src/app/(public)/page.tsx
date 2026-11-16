import Link from "next/link";
import { ArrowRight, CheckCircle, TrendingUp, Users, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">StreakUp</span>
            </div>

            <div className="hidden items-center gap-8 md:flex">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How it works
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-3.5 w-3.5" />
            Build habits that last
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Build habits.{" "}
            <span className="text-primary">Keep your streak alive.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Turn small daily actions into lifelong habits. Track your progress,
            build streaks, and stay motivated with a community that grows with you.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted-foreground">StreakUp Dashboard</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-secondary p-4">
                <div className="mb-1 text-xs text-muted-foreground">Current Streak</div>
                <div className="text-2xl font-bold text-primary">🔥 12 days</div>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <div className="mb-1 text-xs text-muted-foreground">Today&apos;s Progress</div>
                <div className="text-2xl font-bold text-foreground">3 / 5</div>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <div className="mb-1 text-xs text-muted-foreground">Completion Rate</div>
                <div className="text-2xl font-bold text-success">87%</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { name: "Morning Reading", streak: "12 days", done: true },
                { name: "JavaScript Practice", streak: "8 days", done: true },
                { name: "Exercise", streak: "5 days", done: false },
              ].map((habit) => (
                <div
                  key={habit.name}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border-2 ${
                        habit.done
                          ? "border-primary bg-primary"
                          : "border-border"
                      } flex items-center justify-center`}
                    >
                      {habit.done && (
                        <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        habit.done
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {habit.name}
                    </span>
                  </div>
                  <span className="text-xs text-primary">🔥 {habit.streak}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-secondary/30 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Everything you need to stay consistent
            </h2>
            <p className="text-muted-foreground">
              Powerful features designed to help you build lasting habits.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: CheckCircle,
                title: "Flexible Habit Tracking",
                description:
                  "Track habits by checkbox, count, or duration. Set custom targets for every habit.",
              },
              {
                icon: TrendingUp,
                title: "Smart Streak Tracking",
                description:
                  "Individual streaks for each habit and an overall streak. Accurate scheduling handles weekday-only habits.",
              },
              {
                icon: Calendar,
                title: "Activity Calendar",
                description:
                  "GitHub-style contribution heatmap to visualize your consistency over the year.",
              },
              {
                icon: Users,
                title: "Social Accountability",
                description:
                  "Follow friends, see their achievements, like and comment on activities.",
              },
              {
                icon: Zap,
                title: "Daily Tasks",
                description:
                  "Create one-off tasks for specific dates without affecting your habit streaks.",
              },
              {
                icon: ArrowRight,
                title: "Deep Analytics",
                description:
                  "Weekly and monthly statistics, completion rates, best and worst habits.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              How it works
            </h2>
            <p className="text-muted-foreground">
              Get started in minutes. Build streaks that matter.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "Create your habits",
                description:
                  "Define what you want to do consistently — reading, exercise, coding, or anything else.",
              },
              {
                step: "02",
                title: "Set your daily targets",
                description:
                  "Choose how often and how much. Daily, weekdays, or specific days.",
              },
              {
                step: "03",
                title: "Complete your activities",
                description:
                  "Mark habits as done from the dashboard. Quick, one-tap completion.",
              },
              {
                step: "04",
                title: "Track your streaks",
                description:
                  "Watch your streaks grow. Get milestone notifications at 7, 30, 100 days.",
              },
              {
                step: "05",
                title: "Share your progress",
                description:
                  "Connect with friends, see their progress, and motivate each other.",
              },
            ].map((step, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary">
                  {step.step}
                </div>
                <div className="pt-2">
                  <h3 className="mb-1 font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Start building your streaks today
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join StreakUp and turn your daily habits into a lifelong practice.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">StreakUp</span>
            </div>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">About</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} StreakUp
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
