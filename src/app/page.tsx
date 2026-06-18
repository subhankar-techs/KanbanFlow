"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  LayoutDashboard,
  Users,
  Zap,
  Shield,
  Sparkles,
  GripVertical,
  Clock,
  BarChart3,
  CheckCircle2,
  Star,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Visual Kanban Boards",
    description:
      "Organize your work with intuitive drag-and-drop boards. Create columns, add tasks, and track progress at a glance.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: GripVertical,
    title: "Drag & Drop",
    description:
      "Effortlessly move tasks between columns with smooth, responsive drag-and-drop. Works on desktop and mobile.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite team members, assign tasks, and work together in real-time. Everyone stays on the same page.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Zap,
    title: "Real-Time Sync",
    description:
      "Changes appear instantly across all devices. No refresh needed — everything stays perfectly in sync.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Enterprise-grade security with row-level access control. Your data is encrypted and protected.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Activity Tracking",
    description:
      "Full activity history so you always know who did what and when. Transparent and accountable.",
    gradient: "from-cyan-500 to-blue-500",
  },
];

const stats = [
  { value: "10K+", label: "Tasks Managed" },
  { value: "99.9%", label: "Uptime" },
  { value: "50ms", label: "Sync Speed" },
  { value: "256-bit", label: "Encryption" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { user: isSignedIn } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                KanbanFlow
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isSignedIn ? (
                <Link href={ROUTES.DASHBOARD}>
                  <Button className="text-sm bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25">
                    Dashboard
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={ROUTES.LOGIN}>
                    <Button variant="ghost" className="text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href={ROUTES.SIGNUP}>
                    <Button className="text-sm bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25">
                      Get Started
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-linear-to-br from-indigo-400/20 to-purple-400/20 blur-3xl animate-float" />
          <div className="absolute top-60 -left-40 w-80 h-80 rounded-full bg-linear-to-br from-pink-400/15 to-rose-400/15 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-linear-to-br from-cyan-400/15 to-blue-400/15 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Now with real-time collaboration</span>
            <Star className="h-3.5 w-3.5" />
          </div>

          {/* Heading */}
          <h1
            className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Organize your work
            <br />
            <span className="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              beautifully
            </span>
          </h1>

          {/* Subheading */}
          <p
            className={`text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            A modern Kanban board that helps teams collaborate, track progress,
            and deliver projects faster with intuitive drag-and-drop simplicity.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {isSignedIn ? (
              <Link href={ROUTES.DASHBOARD}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href={ROUTES.SIGNUP}>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
                  >
                    Start Exploring
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={ROUTES.LOGIN}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Hero Image / Board Preview */}
          <div
            className={`relative max-w-4xl mx-auto transition-all duration-1000 delay-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl shadow-indigo-500/10 overflow-hidden">
              {/* Mock Kanban Board */}
              <div className="p-4 border-b border-border/50 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 text-center text-sm text-muted-foreground font-medium">
                  My Project Board
                </div>
              </div>
              <div className="p-6 flex gap-4 overflow-hidden">
                {/* Mock columns */}
                {[
                  {
                    title: "To Do",
                    tasks: [
                      { title: "Design homepage", priority: "high", labels: ["Design"] },
                      { title: "Set up database", priority: "medium", labels: ["Backend"] },
                    ],
                  },
                  {
                    title: "In Progress",
                    tasks: [
                      { title: "Build auth flow", priority: "high", labels: ["Feature"] },
                      { title: "Write API docs", priority: "low", labels: ["Docs"] },
                      { title: "Code review", priority: "medium", labels: [] },
                    ],
                  },
                  {
                    title: "Done",
                    tasks: [
                      { title: "Project setup", priority: "low", labels: ["DevOps"] },
                      { title: "UI mockups", priority: "medium", labels: ["Design"] },
                    ],
                  },
                ].map((col, ci) => (
                  <div
                    key={ci}
                    className="flex-1 min-w-50 rounded-xl bg-muted/50 p-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold">{col.title}</span>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {col.tasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {col.tasks.map((task, ti) => (
                        <div
                          key={ti}
                          className="rounded-lg bg-card p-3 border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <p className="text-sm font-medium mb-2">{task.title}</p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                task.priority === "high"
                                  ? "bg-rose-400/10 text-rose-500"
                                  : task.priority === "medium"
                                  ? "bg-amber-400/10 text-amber-500"
                                  : "bg-emerald-400/10 text-emerald-500"
                              }`}
                            >
                              {task.priority}
                            </span>
                            {task.labels.map((l, li) => (
                              <span
                                key={li}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Glow effect behind card */}
            <div className="absolute -inset-4 bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10 rounded-3xl" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-border/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need to{" "}
              <span className="bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                stay productive
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help teams of all sizes manage work
              efficiently and deliver exceptional results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${feature.gradient} mb-4 shadow-lg`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Get started in{" "}
              <span className="bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create a Board",
                description:
                  "Sign up and create your first board in seconds. Add columns for your workflow stages.",
                icon: LayoutDashboard,
              },
              {
                step: "02",
                title: "Add Your Tasks",
                description:
                  "Create tasks with priorities, due dates, and labels. Organize them across your columns.",
                icon: CheckCircle2,
              },
              {
                step: "03",
                title: "Collaborate & Track",
                description:
                  "Invite your team, drag tasks as they progress, and watch your projects come to life.",
                icon: Clock,
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500/10 to-purple-500/10 border border-primary/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary mb-2">
                  STEP {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative rounded-3xl bg-linear-to-br from-indigo-500 via-purple-600 to-pink-500 p-12 sm:p-16 overflow-hidden">
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to transform your workflow?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join teams who use KanbanFlow to stay organized, meet deadlines,
                and deliver outstanding work.
              </p>
              <Link href={ROUTES.SIGNUP}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base bg-white text-indigo-600 hover:bg-white/90 border-0 shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <LayoutDashboard className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                KanbanFlow
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} KanbanFlow. Built with Next.js &
              Supabase.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
