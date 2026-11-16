# StreakUp — Development Progress

## Phase 0: Project Foundation ✅ COMPLETE

**Completed:**
- Next.js 16 app with App Router and TypeScript
- Tailwind CSS v4 with StreakUp dark design system
- shadcn-compatible UI components (Button, Input, Label, Card, Badge, Avatar, Progress, Skeleton, Separator, Textarea)
- Prisma v5 with full database schema
- better-auth v1 configured for email/password auth
- Full folder structure per spec
- Route proxy middleware (auth protection)
- Landing page

**Notes:**
- Downgraded from Prisma v7 to v5 — Prisma v7 has incompatible API (url no longer in schema.prisma)
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- Tailwind v4: no `tailwind.config.ts` needed; uses `@theme` directive in CSS

## Phase 1: Authentication and Profiles 🚧 IN PROGRESS

**Completed:**
- Login page + LoginForm
- Register page + RegisterForm
- Forgot password page + ForgotPasswordForm
- Onboarding flow (3 steps: profile, timezone, privacy)
- Dashboard layout (AppSidebar, MobileNavigation, AppHeader)
- Dashboard placeholder page
- Stub pages for all dashboard routes
- Onboarding API endpoint (`POST /api/v1/users/me/onboarding`)

**Remaining:**
- Database migration (needs PostgreSQL connection)
- Profile page (view/edit own profile)
- Settings pages (account, privacy, notifications)
- Reset password page
- Public profile page `/u/[username]`

## Phase 2: Habit Management ✅ COMPLETE

**Completed:**
- `src/server/validators/habitValidators.ts` — createHabitSchema, updateHabitSchema (Zod v4)
- `src/server/repositories/habitRepository.ts` — all DB operations
- `src/server/services/habitService.ts` — createHabit, updateHabit (versioned schedules), pauseHabit, resumeHabit, archiveHabit, completeHabit (upsert + Activity), undoCompletion, getHabitsForDate, getHabitsList, isHabitScheduledOnDate
- API: GET/POST `/habits`, GET/PATCH/DELETE `/habits/[id]`, POST pause/resume, POST/DELETE completions, GET `/dashboard/today`
- Components: HabitForm (create/edit), HabitCard (list), HabitCompletionButton (checkbox/count/duration), WeekdaySelector
- Pages: /habits (list+filters), /habits/new, /habits/[id] (detail+30-day grid), /habits/[id]/edit
- Dashboard updated with real today's habits + completion buttons

## Phase 3: Daily Task Management ✅ COMPLETE

**Completed:**
- `src/server/validators/taskValidators.ts` — createTaskSchema, updateTaskSchema
- `src/server/services/taskService.ts` — getTasksForDate, createTask, updateTask, completeTask, undoCompleteTask, deleteTask, getTaskStats
- API: GET/POST `/daily-tasks`, PATCH/DELETE `/daily-tasks/[id]`, PATCH `/daily-tasks/[id]/complete` (toggle with undo flag)
- Components: DailyTaskCard (complete/undo/edit/delete), TaskForm (create+edit), TasksView (full client with date navigator)
- `/tasks` page — date navigator (prev/next day), progress bar, pending/completed sections, inline add/edit form
- Dashboard updated with today's tasks section (read-only preview, links to /tasks)

## Phase 4: Dashboard — NOT STARTED

## Phase 5: Streak Engine — NOT STARTED

## Phase 6: Calendar and Statistics — NOT STARTED

## Phase 7: Social Functionality — NOT STARTED

## Phase 8: Notifications — NOT STARTED

## Phase 9: Admin and Security — NOT STARTED

## Phase 10: PWA and Deployment — NOT STARTED

---

## Database Migrations

No migrations applied yet. Run after connecting PostgreSQL:
```bash
npx prisma migrate dev --name init
```

## Known Issues / Decisions

- `better-auth` `forgetPassword` method name may vary by version — cast to unknown in ForgotPasswordForm
- CSS warnings about `@theme` and `@custom-variant` are PostCSS warnings only; Turbopack handles these natively
- Dev server: `npm run dev` → http://localhost:3000
