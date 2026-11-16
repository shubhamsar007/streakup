# STREAKUP — MASTER PRODUCT REQUIREMENTS & DEVELOPMENT SPECIFICATION

**Project:** StreakUp  
**Product type:** Social Habit Tracking & Personal Productivity Platform  
**Version:** 1.0 — MVP  
**Primary platform:** Responsive Web Application / PWA  
**Future platform:** Android APK (private distribution)  
**Design:** Premium Dark Theme  
**Architecture:** Modular Full-Stack Application  
**Primary objective:** Help people build consistency through recurring habits, daily tasks, streak tracking, and social accountability.

---

## PART 1 — PRODUCT VISION AND OBJECTIVES

### 1.1 Product Overview

StreakUp is a multi-user social habit-tracking application inspired by Strava.

Instead of tracking running, cycling, and physical activities, StreakUp allows users to track any personal activity they want to perform consistently.

**Examples:**
- Read 10 pages of a book every day.
- Practice English speaking for 15 minutes.
- Learn JavaScript for 30 minutes.
- Exercise for 20 minutes.
- Solve five programming problems.
- Meditate for 10 minutes.

Users can create their own habits, define their targets, select the days they want to perform them, and track their completion streaks.

Users can also create temporary tasks that only need to be completed on a particular date.

The platform includes social functionality so users can follow other people, see their public activities, like achievements, and encourage each other.

### 1.2 Core Product Philosophy

StreakUp should be:
- Simple to use.
- Fast to interact with.
- Focused on consistency rather than complicated productivity management.
- Social but privacy-conscious.
- Suitable for beginners and advanced users.
- Scalable to support multiple users.
- Designed for mobile and desktop.

### 1.3 Main Product Features

The MVP must include:
- Authentication and registration.
- User onboarding.
- User profiles.
- Habit creation and management.
- Flexible habit scheduling.
- Daily task management.
- Individual habit streaks.
- Overall user streak.
- Activity calendar.
- Statistics and analytics.
- Social profiles.
- Following and followers.
- Community activity feed.
- Likes and comments.
- In-app notifications.
- Privacy settings.
- Responsive PWA support.

---

## PART 2 — USER ROLES AND PERMISSIONS

The application initially has two types of users.

### 2.1 Registered User

Every registered user can:
- Create and manage their profile.
- Create unlimited habits, subject to reasonable application limits.
- Create daily tasks.
- Track personal streaks.
- View personal statistics.
- Follow other users.
- View permitted public activities.
- Like and comment on activities.
- Manage privacy settings.

### 2.2 Platform Administrator

The administrator is responsible for platform management.

For the initial MVP, implement a basic admin role with the ability to:
- View registered users.
- View basic platform statistics.
- Disable or suspend accounts.
- Review reported activities or comments.
- Manage reported users.
- Remove inappropriate content.

Do not build a complicated admin dashboard initially. Basic administrative functionality can be implemented after the core application.

### 2.3 Permission Rules

| Action | Owner | Other users |
|--------|-------|-------------|
| View private profile | Yes | No |
| View public profile | Yes | Yes |
| Edit own habits | Yes | No |
| View public habit activity | Yes | Yes |
| View private habit activity | Yes | No |
| Complete own habits | Yes | No |
| Like permitted activity | Yes | Yes |
| Comment on permitted activity | Yes | Yes |
| Edit own comments | Yes | No |
| Delete own activities | Yes | No |

The backend must enforce all permissions. Hiding buttons in the frontend is not sufficient security.

---

## PART 3 — APPLICATION STRUCTURE AND NAVIGATION

### 3.1 Main Navigation

**Desktop sidebar:**
- Home
- My Habits
- Activity Calendar
- Statistics
- Community
- Notifications
- My Profile
- Settings

**Top navigation:**
- StreakUp logo.
- User search.
- Notifications icon.
- User profile dropdown.

**Mobile navigation:**
- Home
- Habits
- Activity
- Community
- Profile

Settings and statistics can be accessible through the profile menu or secondary navigation.

### 3.2 Route Structure

**Public routes:**
- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/u/[username]`

**Authenticated routes:**
- `/dashboard`
- `/habits`
- `/habits/new`
- `/habits/[habitId]`
- `/habits/[habitId]/edit`
- `/tasks`
- `/activity`
- `/statistics`
- `/community`
- `/notifications`
- `/profile`
- `/settings`
- `/settings/account`
- `/settings/privacy`
- `/settings/notifications`

**Admin routes:**
- `/admin`
- `/admin/users`
- `/admin/reports`

All authenticated routes must require a valid session.

---

## PART 4 — MODULE 1: LANDING PAGE

**Route:** `/`

### Objective
Introduce StreakUp to visitors and encourage account registration.

### Sections

**A. Navigation bar**
- StreakUp logo.
- Features.
- How it works.
- Login.
- Get Started.

**B. Hero section**
- Headline: "Build habits. Keep your streak alive."
- Description: "Turn small daily actions into lifelong habits. Track your progress, build streaks, and stay motivated with a community that grows with you."
- Buttons: Get Started / Explore Features
- Include a dashboard preview.

**C. Features section**
- Create personal habits.
- Track individual streaks.
- See your progress calendar.
- Connect with friends.
- Build consistency.

**D. How it works**
1. Create your habits.
2. Set your daily targets.
3. Complete your activities.
4. Track your streaks.
5. Share your progress.

**E. Footer**
- About.
- Privacy Policy.
- Terms of Service.
- Contact.

### Acceptance Criteria
- Responsive layout.
- All navigation links work.
- Registration and login buttons navigate correctly.
- Landing page does not require authentication.

---

## PART 5 — MODULE 2: AUTHENTICATION

**Routes:** `/register`, `/login`, `/forgot-password`, `/reset-password`

### 5.1 Registration

**Required fields:**
- Full name.
- Username.
- Email.
- Password.
- Confirm password.

**Validation:**
- Email must be valid.
- Username must be unique.
- Username should support letters, numbers, and underscores.
- Password must meet security requirements.
- Password and confirmation must match.

**After successful registration:**
- Create user.
- Create profile.
- Establish authenticated session.
- Redirect to onboarding.
- Do not create duplicate accounts for the same email.

### 5.2 Login

**Fields:**
- Email or username.
- Password.
- Remember me (optional).
- Forgot password link.

After successful authentication, redirect to dashboard.

### 5.3 Authentication Security
- Hash passwords using Argon2id or an appropriately configured secure password hashing algorithm.
- Use secure HTTP-only cookies.
- Apply CSRF protections where required.
- Rate-limit login and registration endpoints.
- Validate all input on the server.
- Never return password hashes to the frontend.
- Implement logout and session invalidation.
- Use a maintained authentication library rather than implementing password authentication and session security from scratch.

---

## PART 6 — MODULE 3: USER ONBOARDING

**Route:** `/onboarding`

### Objective
Help new users configure their accounts before entering the dashboard.

**Step 1: Profile setup**
- Profile picture (optional).
- Full name.
- Username.
- Bio (optional).

**Step 2: Timezone**
- Automatically detect timezone using browser information. Example: `Asia/Kolkata`
- Allow the user to change it manually.
- Store the IANA timezone identifier.

**Step 3: Privacy**
- Options: Public account / Private account.
- Default recommendation: Public, with a clear explanation of what public means.

**Step 4: First habit**
- Allow users to create their first habit.
- Provide a Skip button.

**Completion**
- Redirect to `/dashboard`.
- Do not force users to complete every onboarding step.

---

## PART 7 — MODULE 4: USER DASHBOARD

**Route:** `/dashboard`

This is the most important screen in the application.

### 7.1 Dashboard Layout

**Section A: Welcome header**
- Greeting based on local time.
- User's name.
- Current date.
- Short motivational message.
- Example: "Good morning! Ready to build consistency?"

**Section B: Overall streak card**
- Current overall streak.
- Longest overall streak.
- Current day's completion status.
- Example: 12-day streak.

**Section C: Today's progress**
- Completed habits.
- Total scheduled habits.
- Remaining habits.
- Completion percentage.
- Example: 3 / 5 completed — 60%.
- The progress percentage should be calculated from scheduled habits only.

**Section D: Today's habits**

Every habit card should display:
- Habit name.
- Icon or category.
- Target.
- Current streak.
- Completion status.
- Complete button.

Example:
- Reading — 10 pages.
- English speaking — 15 minutes.
- JavaScript — 30 minutes.
- Exercise — 20 minutes.

If the habit is not scheduled today, do not show it as pending.

**Section E: Today's one-time tasks**
- Display tasks created specifically for the current local date.
- Features: Add task, Complete task, Edit task, Delete task.
- Display completed tasks.
- Show progress.
- These tasks must not affect habit streaks.

**Section F: Recent activities**
- Show the user's latest completed habits.

**Section G: Friends' activities**
- Show recent permitted activities from followed accounts.
- Include a "View All" link to the Community page.

### 7.2 Dashboard Interactions
- Complete a habit without opening another page.
- Undo an accidental completion.
- Add a new habit.
- Add a one-time task.
- Complete a one-time task.
- Navigate to individual habit details.
- View streak history.

### 7.3 Dashboard Loading States

Implement:
- Skeleton loading.
- Empty state.
- Error state.
- Retry button.
- Success feedback.

If a user has no habits, show an onboarding-style message: "Start building your first habit." — Provide an Add Your First Habit button.

---

## PART 8 — MODULE 5: HABIT MANAGEMENT

**Routes:** `/habits`, `/habits/new`, `/habits/[habitId]`, `/habits/[habitId]/edit`

### 8.1 Habit Creation

**Required fields:**

**Basic information:**
- Habit name.
- Description.
- Category.
- Icon (optional).

**Tracking configuration — Support three tracking types:**

1. **Checkbox**
   - Example: Meditate.
   - The user only needs to mark it complete.

2. **Count**
   - Examples: Read 10 pages, Solve 5 questions, Drink a specified amount of water.
   - Fields: Target value, Unit.

3. **Duration**
   - Examples: Practice English for 15 minutes, Learn JavaScript for 30 minutes, Walk for 20 minutes.
   - Fields: Target duration, Unit (minutes or hours).

For count and duration habits, users should be able to enter the completed value.

A habit should only become completed when its target is reached.

For the MVP, support one daily progress record per habit, which can be updated until the target is reached.

**Scheduling configuration:**
- Every day.
- Selected weekdays (Mon, Tue, Wed, Thu, Fri, Sat, Sun).
- Users can select multiple weekdays.

**Visibility configuration:**
- Public.
- Followers.
- Private.

**Start date:**
- Allow the user to choose when the habit starts.
- Do not allow retroactive completion before its start date unless an explicit future feature supports it.

### 8.2 Habit List
- Display all user habits.
- Filters: All / Active / Paused / Archived.

**Habit card:**
- Name, Target, Frequency, Current streak, Best streak, Completion rate, Status.

### 8.3 Habit Editing

Users can update:
- Name, Description, Category, Target, Frequency, Selected weekdays, Visibility.

**Important:** Changes must not modify historical completion records. Use versioned schedules so the system knows which schedule applied on a particular date.

### 8.4 Pause and Resume

**When paused:**
- Do not expect completion.
- Do not count paused dates as missed days.
- Do not break the streak merely because the habit was paused.
- Do not create activity records.

**When resumed:**
- Create a new effective schedule period.
- Resume tracking from the selected date.
- Prevent overlapping or contradictory schedule periods.

### 8.5 Archive and Delete
- Prefer archive instead of permanent deletion.

**Archived habits:**
- Cannot receive new completions.
- Retain historical records.
- Remain available in historical statistics.
- Do not appear in today's active habit list.

Permanent deletion should require confirmation.

### 8.6 Habit Detail Page

Display:
- Name and description.
- Current streak.
- Longest streak.
- Total completed days.
- Completion percentage.
- Monthly calendar.
- Recent history.
- Weekly performance.

Provide edit, pause, and archive actions.

---

## PART 9 — MODULE 6: DAILY TASK MANAGEMENT

**Route:** `/tasks`

### Purpose
Allow users to manage temporary tasks without creating permanent habits.

**Examples:**
- Fix a CRM bug.
- Complete an AWS tutorial.
- Buy groceries.
- Pay an electricity bill.

### 9.1 Create Task

**Fields:**
- Task title.
- Description (optional).
- Task date.
- Priority (optional).

Default task date: Today.

For the MVP, only today's tasks are shown on the dashboard. The Tasks page can provide access to other dates.

### 9.2 Task Lifecycle

**Statuses:** PENDING / COMPLETED

**Users can:** Create, Edit, Complete, Undo completion, Delete.

### 9.3 Date Behaviour
- Tasks must be associated with the date selected by the user.
- When midnight passes, today's tasks must not appear as today's tasks anymore.
- Previous tasks must remain accessible in their historical date.
- Incomplete tasks should not automatically roll over.
- Users can manually reschedule an incomplete task.

### 9.4 Streak Restrictions

Daily tasks must never affect:
- Individual habit streaks.
- Overall streak.
- Habit completion percentage.

---

## PART 10 — MODULE 7: STREAK CALCULATION ENGINE

This is one of the most important backend modules.

**Never implement streak calculation as a simple counter.**

Use historical completion records and the applicable historical schedule.

### 10.1 Individual Habit Streak

Each habit has:
- Current streak.
- Longest streak.
- Total completed occurrences.
- Completion percentage.

Each habit has an independent streak. Missing JavaScript must not affect Reading.

### 10.2 Overall Streak

**Recommended rule:** A day qualifies when the user completes at least one habit scheduled for that local date.

| Scenario | Result |
|----------|--------|
| 5 scheduled habits, 1 completed | Qualifying day |
| 3 scheduled habits, 3 completed | Qualifying day |
| 3 scheduled habits, 0 completed | Missed day |
| No habits scheduled | Neutral day |
| Only one-time task completed | No impact |

### 10.3 Flexible Scheduling

**Example:**
- Reading: Monday to Sunday.
- JavaScript: Monday to Friday.
- Exercise: Monday, Wednesday, Friday.

If the user misses JavaScript on Saturday, it must not break its streak.

The calculation engine must consider the schedule applicable to the date being calculated.

### 10.4 Streak Rollover Rules

**Very important:** Do not break a streak before the user's local day has finished.

**Example:**
- A user has a 10-day streak.
- It is currently 11 AM and today's habit is not completed.
- The current streak should still show 10 days, with today's activity pending.
- At the end of the scheduled day, if the habit remains incomplete, the streak breaks.

Use the user's timezone for determining day boundaries.

### 10.5 Current Streak Calculation

For a given habit:
1. Identify the habit's effective schedules.
2. Identify scheduled dates.
3. Retrieve completed dates.
4. Ignore dates before its start date.
5. Exclude valid paused periods.
6. Ignore non-scheduled dates.
7. Find the latest relevant scheduled date.
8. If today is scheduled but still in progress, do not prematurely break the streak.
9. Count consecutive qualifying scheduled occurrences backwards.
10. Calculate the longest historical streak separately.

### 10.6 Streak Milestone Achievements

For the MVP, support milestones:
- 3 days, 7 days, 14 days, 30 days, 50 days, 100 days.

Create an achievement notification when a milestone is reached. Avoid sending duplicate milestone notifications.

---

## PART 11 — MODULE 8: ACTIVITY CALENDAR

**Route:** `/activity`

### Objective
Give users a visual representation of their consistency. Design inspiration: GitHub contribution heatmap.

### 11.1 Calendar Layout

Display a year-long activity heatmap. Each square represents one local calendar date.

**Suggested levels:**
- Grey: No completed habits.
- Light green: One completed habit.
- Medium green: Two completed habits.
- Bright green: Three or more completed habits.

### 11.2 Calendar Filters
- All habits.
- Individual habit.
- Current year.
- Previous year.

### 11.3 Date Details

When a user clicks a date, open a detail panel displaying:
- Date.
- Scheduled habits.
- Completed habits.
- Missed scheduled habits.
- Daily tasks.
- Overall streak status.

### 11.4 Data Requirements
- Calendar data must come from historical records.
- Do not generate historical completion records from current habit settings.

---

## PART 12 — MODULE 9: STATISTICS AND ANALYTICS

**Route:** `/statistics`

### 12.1 Overview Cards
- Current overall streak.
- Longest overall streak.
- Total habit completions.
- Weekly success rate.
- Monthly success rate.
- Most consistent habit.

### 12.2 Weekly Statistics
- Number of scheduled habits.
- Number completed.
- Completion percentage.
- Habit-wise breakdown.

### 12.3 Monthly Statistics
- Monthly completions.
- Monthly completion rate.
- Missed occurrences.
- Best performing habit.
- Least consistent habit.

### 12.4 Individual Habit Statistics
- Total completed occurrences.
- Current streak.
- Best streak.
- Completion rate.
- Weekly trend.
- Monthly trend.

### 12.5 Calculation Rules

**Completion rate formula:**
```
Completed scheduled occurrences / Total eligible scheduled occurrences × 100
```

**Exclude:**
- Non-scheduled dates.
- Valid paused dates.
- Dates before habit creation.
- Future scheduled dates (do not count as missed).

For the current day, distinguish between pending and missed.

---

## PART 13 — MODULE 10: SOCIAL PROFILES

**Route:** `/u/[username]`

### 13.1 Public Profile

Display:
- Profile picture, Name, Username, Bio, Join date.
- Followers, Following.
- Overall streak, Longest streak.
- Total public completed activities.
- Public habits.
- Public activity history.

### 13.2 Private Profile

A private account should only expose minimal information to non-approved visitors:
- Profile picture.
- Username.
- Name.
- Bio (if configured for public display).
- Follow button.

Do not expose private habits, private activities, or private statistics.

### 13.3 Profile Actions
- Follow, Unfollow, Cancel follow request.
- Accept follow request, Reject follow request.
- View public activity.

### 13.4 Profile Privacy

Users should be able to control:
- Account visibility.
- Individual habit visibility.
- Activity visibility.

The privacy settings of an individual activity must be respected even when the user's overall account is public.

---

## PART 14 — MODULE 11: FOLLOWERS AND FOLLOWING

### 14.1 Following Public Users
- Create an accepted follow relationship.
- Allow permitted public activity to appear in the follower's feed.

### 14.2 Following Private Users
- Create a pending request.
- Notify the requested user.
- Allow accept/reject actions.
- Only after acceptance should restricted follower content become accessible.

### 14.3 Following Management

Users can:
- View followers.
- View following.
- Remove followers.
- Unfollow accounts.
- Accept requests.
- Reject requests.

**Prevent:**
- Duplicate follow requests.
- Self-following.
- Following suspended accounts.

### 14.4 User Discovery

Create a "Discover People" section. For MVP, provide:
- Search by username.
- Search by display name.
- Suggested public users.

Do not build complex recommendation algorithms.

---

## PART 15 — MODULE 12: COMMUNITY ACTIVITY FEED

**Route:** `/community`

### 15.1 Feed Tabs
- Following: displays activities from followed users.
- Discover: shows permitted public activities.

### 15.2 Activity Card

Every card should display:
- User avatar.
- Username.
- Activity description.
- Habit name.
- Target completed.
- Completion time.
- Streak information (if relevant).
- Like count.
- Comment count.

**Example:**
> Rahul completed Reading.
> "Read 15 pages of Atomic Habits."
> 12-day habit streak.

### 15.3 Feed Generation

Create a feed item when:
- A habit is completed.
- A supported streak milestone is achieved.

Do not create a new activity for every partial progress update. Avoid duplicate activities when a completion is edited or retried.

### 15.4 Privacy Rules

Only show an activity when the viewer has permission. Consider:
- User account visibility.
- Habit visibility.
- Activity visibility.
- Follow approval status.
- User blocking status.

Do not rely solely on frontend filters.

### 15.5 Pagination
- Implement cursor-based pagination.
- Recommended initial page size: 20 activities.
- Load more when users scroll.

### 15.6 Feed Ordering
- Order by activity creation time, newest first.

---

## PART 16 — MODULE 13: LIKES AND COMMENTS

### 16.1 Likes

Users can:
- Like activities.
- Unlike activities.
- View like counts.

**Rules:**
- One like per user per activity.
- No duplicate likes.
- Users cannot like content they cannot view.

### 16.2 Comments

Users can:
- Add comments.
- Edit their own comments.
- Delete their own comments.
- View permitted comments.

**Validation:**
- Reject empty comments.
- Apply a reasonable character limit.
- Escape or safely render user-generated content.
- Rate-limit comment creation.
- For MVP, use chronological comments.

### 16.3 Notifications

Generate notifications when someone:
- Likes an activity.
- Comments on an activity.

Avoid notifying users about their own actions.

---

## PART 17 — MODULE 14: NOTIFICATIONS

**Route:** `/notifications`

### Notification Types
- `NEW_FOLLOWER`
- `FOLLOW_REQUEST`
- `FOLLOW_REQUEST_ACCEPTED`
- `ACTIVITY_LIKED`
- `ACTIVITY_COMMENTED`
- `STREAK_MILESTONE`

### Features
- Notification list.
- Unread count.
- Mark as read.
- Mark all as read.
- Navigate to related activity or profile.

For the MVP, notifications should be in-app only. Push notifications and email notifications can be implemented later.

---

## PART 18 — MODULE 15: SETTINGS AND PRIVACY

**Route:** `/settings`

### Account Settings
- Change email.
- Change password.
- Delete account.
- Logout.

### Profile Settings
- Change name.
- Change username.
- Update avatar.
- Update bio.

### Privacy Settings
- Public/private account.
- Default habit visibility.
- Default activity visibility.

### Timezone Settings
- Display current timezone.
- Change timezone.
- **Important:** Changing timezone must not rewrite historical local dates or completion records.

### Notification Settings
- Likes, Comments, Followers, Follow requests, Streak milestones.

---

## PART 19 — MODULE 16: ADMINISTRATION AND CONTENT SAFETY

### Admin Dashboard

Display:
- Registered users.
- Active users.
- Total habits.
- Total completions.
- Recent registrations.
- Reported content.

### User Management

Admin can:
- Search users.
- View account status.
- Suspend an account.
- Restore an account.

### Content Moderation

Provide a basic report mechanism for:
- User profiles.
- Activities.
- Comments.

Admin can:
- Review reports.
- Dismiss reports.
- Remove content.
- Suspend accounts.

Implement basic user blocking as part of social privacy and safety.

---

## PART 20 — DATABASE ARCHITECTURE

Use PostgreSQL and Prisma ORM.

- All primary identifiers should use UUIDs.
- Use UTC timestamps for actual events and explicit local dates for habit tracking.

### 20.1 Required Tables

**Authentication and users:**
- `users`
- `profiles`
- `sessions` (according to the chosen authentication provider)

**Habits:**
- `habits`
- `habit_schedule_versions`
- `habit_schedule_days`
- `habit_completions`
- `habit_progress_entries` (optional; only if multiple progress sessions per day are required)

**Tasks:**
- `daily_tasks`

**Streaks and achievements:**
- `achievements`
- `user_achievements`

**Social:**
- `follows`
- `activities`
- `likes`
- `comments`
- `blocks`
- `reports`

**Notifications:**
- `notifications`

### 20.2 Detailed Table Definitions

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| email | VARCHAR | Unique |
| username | VARCHAR | Unique |
| password_hash | VARCHAR | Nullable if using external auth |
| timezone | VARCHAR | IANA timezone string |
| role | ENUM | USER / ADMIN |
| status | ENUM | ACTIVE / SUSPENDED |
| email_verified_at | TIMESTAMP | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### profiles
| Column | Type |
|--------|------|
| id | UUID |
| user_id | UUID FK (unique) |
| full_name | VARCHAR |
| bio | TEXT |
| avatar_url | TEXT |
| visibility | ENUM (PUBLIC / PRIVATE) |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

#### habits
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | |
| user_id | UUID FK | |
| name | VARCHAR | |
| description | TEXT | |
| category | VARCHAR | |
| tracking_type | ENUM | CHECKBOX / COUNT / DURATION |
| target_value | DECIMAL | |
| unit | VARCHAR | |
| visibility | ENUM | PUBLIC / FOLLOWERS / PRIVATE |
| status | ENUM | ACTIVE / PAUSED / ARCHIVED |
| start_date | DATE | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### habit_schedule_versions
| Column | Type |
|--------|------|
| id | UUID |
| habit_id | UUID FK |
| frequency_type | ENUM (DAILY / SELECTED_DAYS) |
| valid_from | DATE |
| valid_until | DATE (nullable) |
| created_at | TIMESTAMP |

#### habit_schedule_days
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | |
| schedule_version_id | UUID FK | |
| weekday | SMALLINT | 1=Mon, 2=Tue, ..., 7=Sun |

#### habit_completions
| Column | Type |
|--------|------|
| id | UUID |
| habit_id | UUID FK |
| local_date | DATE |
| completed_value | DECIMAL |
| completed_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

**Unique constraint:** `(habit_id, local_date)`

#### daily_tasks
| Column | Type |
|--------|------|
| id | UUID |
| user_id | UUID FK |
| title | VARCHAR |
| description | TEXT (nullable) |
| task_date | DATE |
| status | ENUM (PENDING / COMPLETED) |
| completed_at | TIMESTAMPTZ (nullable) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

#### follows
| Column | Type |
|--------|------|
| id | UUID |
| follower_id | UUID FK |
| following_id | UUID FK |
| status | ENUM (PENDING / ACCEPTED) |
| created_at | TIMESTAMPTZ |

**Unique constraint:** `(follower_id, following_id)`

#### activities
| Column | Type |
|--------|------|
| id | UUID |
| user_id | UUID FK |
| habit_id | UUID FK (nullable) |
| completion_id | UUID FK (nullable) |
| type | ENUM (HABIT_COMPLETED / STREAK_MILESTONE) |
| visibility | ENUM |
| created_at | TIMESTAMPTZ |

#### likes
| Column | Type |
|--------|------|
| id | UUID |
| activity_id | UUID FK |
| user_id | UUID FK |
| created_at | TIMESTAMPTZ |

**Unique constraint:** `(activity_id, user_id)`

#### comments
| Column | Type |
|--------|------|
| id | UUID |
| activity_id | UUID FK |
| user_id | UUID FK |
| content | TEXT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

#### notifications
| Column | Type |
|--------|------|
| id | UUID |
| user_id | UUID FK |
| actor_id | UUID FK (nullable) |
| type | ENUM |
| entity_id | UUID (nullable) |
| is_read | BOOLEAN |
| created_at | TIMESTAMPTZ |

#### blocks
| Column | Type |
|--------|------|
| id | UUID |
| blocker_id | UUID FK |
| blocked_id | UUID FK |
| created_at | TIMESTAMPTZ |

#### reports
| Column | Type |
|--------|------|
| id | UUID |
| reporter_id | UUID FK |
| target_type | VARCHAR |
| target_id | UUID |
| reason | TEXT |
| status | ENUM |
| created_at | TIMESTAMPTZ |
| reviewed_at | TIMESTAMPTZ (nullable) |

### 20.3 Database Rules
- Use foreign keys.
- Add appropriate indexes.
- Add unique constraints.
- Prevent duplicate completion records.
- Prevent duplicate likes.
- Prevent self-following.
- Prevent self-blocking.
- Use transactions for multi-table operations.
- Preserve historical records.
- Avoid cascading deletes that destroy activity history unexpectedly.

### 20.4 Important Indexes

Create indexes for:
- `users.username`
- `users.email`
- `habits.user_id` and `habits.status`
- `habit_completions.habit_id` and `local_date`
- `daily_tasks.user_id` and `task_date`
- `follows.follower_id` and `status`
- `follows.following_id` and `status`
- `activities.created_at`
- `activities.user_id` and `created_at`
- `likes.activity_id`
- `comments.activity_id` and `created_at`
- `notifications.user_id` and `is_read`

---

## PART 21 — BACKEND API ARCHITECTURE

Use REST API. Base URL: `/api/v1`

**Success response format:**
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed"
}
```

**Error response format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

### Authentication Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Current user |
| POST | `/auth/forgot-password` | Password reset request |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/verify-email` | Verify email |

### User Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users/me` | Current profile |
| PATCH | `/users/me` | Update profile |
| GET | `/users/:username` | View public profile |
| GET | `/users/search` | Search users |
| PATCH | `/users/me/privacy` | Change privacy |

### Habit Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/habits` | Get my habits |
| POST | `/habits` | Create habit |
| GET | `/habits/:id` | Get habit details |
| PATCH | `/habits/:id` | Update habit |
| DELETE | `/habits/:id` | Archive habit |
| POST | `/habits/:id/pause` | Pause habit |
| POST | `/habits/:id/resume` | Resume habit |
| GET | `/habits/:id/history` | Completion history |
| POST | `/habits/:id/completions` | Complete habit |
| DELETE | `/habits/:id/completions/:date` | Undo completion |

### Daily Task Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/daily-tasks` | Get date's tasks |
| POST | `/daily-tasks` | Create task |
| PATCH | `/daily-tasks/:id` | Update task |
| PATCH | `/daily-tasks/:id/complete` | Complete task |
| DELETE | `/daily-tasks/:id` | Delete task |

### Streak & Statistics Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/streaks/overview` | Overall streak |
| GET | `/streaks/habits/:id` | Individual streak |
| GET | `/statistics/overview` | Main statistics |
| GET | `/statistics/weekly` | Weekly statistics |
| GET | `/statistics/monthly` | Monthly statistics |
| GET | `/activity/calendar` | Calendar data |

### Social Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/users/:id/follow` | Follow user |
| DELETE | `/users/:id/follow` | Unfollow user |
| GET | `/users/:id/followers` | Followers |
| GET | `/users/:id/following` | Following |
| GET | `/community/feed` | Activity feed |
| GET | `/community/discover` | Discover users |
| POST | `/activities/:id/like` | Like activity |
| DELETE | `/activities/:id/like` | Unlike activity |
| GET | `/activities/:id/comments` | Get comments |
| POST | `/activities/:id/comments` | Add comment |
| PATCH | `/comments/:id` | Edit comment |
| DELETE | `/comments/:id` | Delete comment |

### Notification Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notifications` | Get notifications |
| PATCH | `/notifications/:id/read` | Mark read |
| PATCH | `/notifications/read-all` | Mark all read |

### Admin Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/dashboard` | Admin overview |
| GET | `/admin/users` | Manage users |
| PATCH | `/admin/users/:id/status` | Update user status |
| GET | `/admin/reports` | View reports |
| PATCH | `/admin/reports/:id` | Review report |

---

## PART 22 — TECHNICAL STACK

### Frontend
- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- TanStack Query for client-side server state
- React Hook Form
- Zod validation

### Backend
- Next.js Route Handlers
- Node.js runtime
- TypeScript
- Prisma ORM
- PostgreSQL

Do not create a separate Express deployment initially. Organize business logic in separate services so it can be extracted into Express later if required.

### Authentication
Use a maintained authentication library with:
- Email/password authentication.
- Secure sessions.
- HTTP-only cookies.
- Prisma integration.
- Password reset support.

### Database
- PostgreSQL
- Prisma migrations
- Prisma Client

### File Storage
- Use an object storage service for profile images.
- Do not store uploaded image files directly in PostgreSQL.

### Charts
- Use a maintained React charting library for statistics.

### Deployment
- Vercel for the web application.
- Managed PostgreSQL.
- Object storage for images.
- Use environment variables for all credentials and external service configuration.
- Never commit secrets to Git.

---

## PART 23 — FRONTEND FOLDER STRUCTURE

```
streakup/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── icons/
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   └── u/[username]/
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── habits/
│   │   │   ├── tasks/
│   │   │   ├── activity/
│   │   │   ├── statistics/
│   │   │   ├── community/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   │
│   │   ├── admin/
│   │   └── api/v1/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── charts/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── habits/
│   │   ├── tasks/
│   │   ├── streaks/
│   │   ├── activity/
│   │   ├── statistics/
│   │   ├── community/
│   │   ├── notifications/
│   │   └── admin/
│   │
│   ├── server/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── validators/
│   │   ├── auth/
│   │   ├── permissions/
│   │   └── utilities/
│   │
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── config/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

Keep components small and reusable. Do not place all business logic inside UI components or API route handlers.

---

## PART 24 — DESIGN SYSTEM AND UI GUIDELINES

### 24.1 Design Direction

StreakUp should look like a modern premium productivity application.

**Visual references:**
- Strava: activity and social experience.
- GitHub: contribution heatmap.
- Linear: clean interface and navigation.
- Modern habit trackers: simple completion cards.

### 24.2 Theme

Use dark mode as the default.

**Colour palette:**
| Token | Hex |
|-------|-----|
| Main background | `#0B0F14` |
| Secondary background | `#111827` |
| Card background | `#161D27` |
| Border | `#263244` |
| Primary text | `#F9FAFB` |
| Secondary text | `#94A3B8` |
| Primary accent | `#A3E635` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |

Use the green accent primarily for completion, progress, and important actions.

### 24.3 Reusable Components

Create:
- `AppSidebar`
- `MobileNavigation`
- `AppHeader`
- `HabitCard`
- `HabitForm`
- `HabitCompletionButton`
- `StreakCard`
- `OverallProgressCard`
- `DailyTaskCard`
- `ActivityCard`
- `UserProfileCard`
- `FollowButton`
- `LikeButton`
- `CommentSection`
- `ActivityHeatmap`
- `StatisticsCard`
- `EmptyState`
- `LoadingSkeleton`
- `ConfirmationDialog`
- `NotificationDropdown`

### 24.4 UX Rules
- Every action should provide feedback.
- Avoid unnecessary modals.
- Use confirmation for destructive actions.
- Display loading states and empty states.
- Make the application mobile responsive.
- Avoid excessive animations.
- Make habit completion possible with one or two interactions.
- Ensure accessible contrast and keyboard navigation.

---

## PART 25 — BUSINESS LOGIC AND IMPORTANT EDGE CASES

### Habit Completion Rules
- A habit cannot be completed before its start date.
- A habit cannot be completed on a non-scheduled date.
- A habit cannot receive duplicate daily completions.
- A completed value must meet the configured target.
- Users cannot complete another user's habit.
- Archived habits cannot receive new completions.
- Paused habits cannot receive new completions for paused dates.

### Schedule Modification Rules
- Schedule changes must preserve historical schedules.
- A schedule change takes effect from a defined local date.
- Historical completion calculations use the old schedule.
- New dates use the new schedule.
- Overlapping schedule versions must be prevented.

### Streak Calculation Rules
- Individual streaks are independent.
- Overall streak is independent.
- Non-scheduled days are neutral for individual streaks.
- Dates before a habit's start date are ignored.
- Valid paused periods are excluded.
- Current-day pending status does not break a streak prematurely.
- Future dates are never considered missed.
- One-time tasks never affect streaks.

### Social Privacy Rules
- Private profiles require follow approval.
- Private habits never become public accidentally.
- Feed queries must enforce visibility.
- Blocked users must not interact with each other's content.
- Deleted or suspended accounts must be handled appropriately.

### Data Consistency Rules
- Use database transactions for habit completion and associated activity creation.
- Prevent duplicate notifications.
- Use unique constraints for likes and completions.
- Use server-side authorization.
- Handle simultaneous requests safely.
- Use pagination for large feeds.

---

## PART 26 — SECURITY AND PERFORMANCE

### Security
- Validate every API input.
- Authenticate protected routes.
- Authorize access at the service or API layer.
- Hash passwords securely.
- Use secure cookies.
- Apply rate limits.
- Protect against SQL injection through Prisma's safe query methods.
- Prevent XSS through safe content rendering.
- Protect against CSRF where applicable.
- Validate uploaded image types and sizes.
- Never expose internal error details or secrets.
- Use secure environment variables.

### Performance
- Use database indexes.
- Paginate activity feeds.
- Avoid unnecessary database queries.
- Avoid N+1 queries.
- Fetch only required fields.
- Cache expensive statistics when necessary.
- Use server-side pagination.
- Lazy-load noncritical content.
- Do not introduce Redis or complicated caching infrastructure until actual usage requires it.

---

## PART 27 — TESTING REQUIREMENTS

### Unit Tests

Test:
- Habit schedule calculations.
- Individual streak calculation.
- Overall streak calculation.
- Completion percentage.
- Timezone date conversion.
- Paused habit behaviour.
- Schedule version behaviour.

### Integration Tests

Test:
- Registration.
- Login.
- Habit creation.
- Habit completion.
- Habit editing.
- Daily task creation.
- Following users.
- Private profile access.
- Likes and comments.
- Notifications.

### End-to-End Tests

**Journey 1: New user**
Register → Onboard → Create habit → Complete habit → View streak.

**Journey 2: Existing user**
Login → Dashboard → Complete habits → Add daily task → View statistics.

**Journey 3: Social user**
Register two users → Follow each other → Complete public habit → See activity in feed → Like → Comment.

**Journey 4: Private account**
Register private user → Send follow request → Accept request → View permitted activity.

**Journey 5: Streak accuracy**
Create daily habit → Complete multiple days → Miss scheduled day → Verify streak breaks correctly.

Also test selected weekdays and timezone boundaries.

---

## PART 28 — DEVELOPMENT ROADMAP

Implement the application in phases. Do not start all modules simultaneously.

### Phase 0: Project Foundation
- Create Next.js project.
- Configure TypeScript.
- Configure Tailwind CSS.
- Configure shadcn/ui.
- Configure Prisma.
- Connect PostgreSQL.
- Establish folder structure.
- Configure environment variables.
- Create base layout.
- Create dark design system.
- Configure linting and testing.

**Deliverable:** Working application foundation.

### Phase 1: Authentication and Profiles
- Registration, Login, Logout, Session handling.
- User profile, Onboarding, Timezone setup, Privacy settings.

**Deliverable:** Users can register and log in.

### Phase 2: Habit Management
- Create, edit, delete/archive, pause/resume habits.
- Checkbox, Count, Duration tracking.
- Flexible scheduling, Schedule versioning.

**Deliverable:** Users can manage recurring habits.

### Phase 3: Daily Task Management
- Create, edit, complete, delete tasks.
- Date-based task retrieval, Historical task access.

**Deliverable:** Users can manage temporary daily tasks.

### Phase 4: Dashboard
- Today's habits and tasks.
- Completion progress, Overall streak card, Habit streak cards.
- Recent activity, Responsive dashboard.

**Deliverable:** Fully functional personal dashboard.

### Phase 5: Streak Engine
- Individual streak calculation.
- Overall streak calculation.
- Historical schedule calculation.
- Paused period handling.
- Timezone handling.
- Longest streak, Milestone detection.

**Deliverable:** Accurate streak system with automated tests. *(This phase must be thoroughly tested before moving forward.)*

### Phase 6: Calendar and Statistics
- Activity heatmap, Monthly calendar, Habit history.
- Weekly analytics, Monthly analytics, Completion rates, Statistics dashboard.

**Deliverable:** Personal activity analytics.

### Phase 7: Social Functionality
- Public profiles, Private profiles, Following, Follow requests.
- User search, Activity feed, Likes, Comments, Privacy enforcement.

**Deliverable:** Working social platform.

### Phase 8: Notifications
- Follow notifications, Like notifications, Comment notifications.
- Follow request notifications, Streak milestone notifications.
- Read/unread status.

**Deliverable:** In-app notification system.

### Phase 9: Admin and Security
- Basic admin dashboard, User suspension, Reporting, Blocking.
- Content moderation, Security review, API permission review.

**Deliverable:** MVP ready for controlled users.

### Phase 10: PWA and Deployment
- Responsive testing, Web app manifest, App icons, PWA installation.
- Hosting setup, Production database, Error monitoring, Backup strategy.
- Production environment configuration.

**Deliverable:** Live StreakUp web application.

---

## PART 29 — MVP SCOPE CONTROL

The following features are **NOT** required for the first release. Do not implement them unless specifically requested later:

- AI habit recommendations.
- AI speaking practice.
- AI chat assistant.
- Direct messaging.
- Groups and communities.
- Challenges and competitions.
- Leaderboards.
- Badges beyond basic streak milestones.
- Gamification points.
- Premium subscriptions.
- Payment gateway.
- Advertising.
- Advanced recommendation algorithms.
- Native Android application.
- Advanced push notification system.
- Apple Health or Google Fit integrations.
- Calendar synchronization.

---

## PART 30 — MVP ACCEPTANCE CHECKLIST

The MVP is considered complete only when all of the following work:

### Authentication
- [ ] Users can register.
- [ ] Users can log in and log out.
- [ ] Password reset works.
- [ ] Sessions are secure.
- [ ] User profiles are created.

### Habits
- [ ] Users can create habits.
- [ ] Users can edit habits.
- [ ] Users can archive habits.
- [ ] Users can pause and resume habits.
- [ ] Users can select weekdays.
- [ ] Checkbox tracking works.
- [ ] Count tracking works.
- [ ] Duration tracking works.

### Daily Tasks
- [ ] Users can add one-time tasks.
- [ ] Users can complete tasks.
- [ ] Users can edit and delete tasks.
- [ ] Tasks are date-specific.
- [ ] Previous tasks remain accessible.

### Streaks
- [ ] Individual streaks work.
- [ ] Overall streak works.
- [ ] Longest streak works.
- [ ] Non-scheduled days are ignored.
- [ ] Paused dates are excluded.
- [ ] Historical schedules work.
- [ ] Timezone boundaries are handled correctly.

### Dashboard and Statistics
- [ ] Today's progress is accurate.
- [ ] Today's habits are displayed correctly.
- [ ] Today's tasks are displayed correctly.
- [ ] Calendar works.
- [ ] Weekly statistics work.
- [ ] Monthly statistics work.

### Social
- [ ] Users can follow public profiles.
- [ ] Private follow requests work.
- [ ] Users can view permitted activities.
- [ ] Users can like activities.
- [ ] Users can comment.
- [ ] Privacy permissions work.
- [ ] Blocking works.

### Notifications
- [ ] Notifications are created.
- [ ] Notifications can be marked read.
- [ ] Unread counts are accurate.

### Final
- [ ] Mobile responsive.
- [ ] PWA installation works.
- [ ] API authorization is tested.
- [ ] Database constraints are tested.
- [ ] Production deployment works.

---

## PART 31 — INSTRUCTIONS FOR CLAUDE CODE

You are the senior full-stack software architect and implementation engineer responsible for building StreakUp.

The above document is the authoritative product specification.

### 1. Understand Before Implementing

Before writing code:
- Read the entire specification.
- Understand all modules and database relationships.
- Identify dependencies between modules.
- Identify potentially conflicting business rules.
- Propose a clean implementation architecture.
- Identify any missing technical decisions.
- **Do not start generating the entire application immediately.**

### 2. Work Incrementally

Implement one phase at a time. For each phase:
1. Explain what will be built.
2. Identify the relevant database changes.
3. Identify required APIs.
4. Identify required frontend screens.
5. Implement the backend.
6. Implement the frontend.
7. Add validation and authorization.
8. Write tests.
9. Run the tests.
10. Fix errors.
11. Summarize what was implemented.
12. Identify remaining work.

Do not move to the next phase until the current phase is working.

### 3. Code Quality
- Use TypeScript strictly.
- Avoid unnecessary `any`.
- Use reusable components.
- Follow separation of concerns.
- Keep business logic outside UI components.
- Keep API handlers thin.
- Use dedicated service functions.
- Use reusable validation schemas.
- Use Prisma transactions where required.
- Handle errors consistently.
- Avoid duplicate code.
- Write meaningful variable and function names.
- Add comments for complex business logic.

### 4. Database Rules
- Never modify production data without explicit authorization.
- Use Prisma migrations.
- Do not use destructive database reset commands on an existing database.
- Add appropriate foreign keys and constraints.
- Preserve historical records.
- Explain database changes before applying migrations.
- Use seed data only for development.

### 5. Testing Rules

Do not consider a feature finished merely because the UI renders.

Every major feature must have:
- Input validation.
- Backend authorization.
- Loading state.
- Error handling.
- Success handling.
- Relevant automated tests.

Pay special attention to streak calculation, date handling, and social privacy.

### 6. Design Rules
- Follow the StreakUp dark design system defined in Part 24.
- The application should look like a professional modern SaaS product.

**Avoid:**
- Generic unstyled forms.
- Excessive gradients.
- Too many cards.
- Unnecessary animations.
- Oversized headings.
- Cluttered dashboards.

Maintain consistency between desktop and mobile layouts.

### 7. Do Not Make Unauthorized Product Decisions

If an implementation decision changes:
- Streak rules.
- Habit scheduling.
- Privacy behaviour.
- Database relationships.
- User permissions.
- Task lifecycle.

Explain the implications and ask before changing the agreed product behaviour. For minor technical decisions, use reasonable defaults and document them.

### 8. Maintain Project Documentation

Maintain:
- `README.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `API_DOCUMENTATION.md`
- `DEVELOPMENT_PROGRESS.md`
- `CHANGELOG.md`

Update `DEVELOPMENT_PROGRESS.md` after each completed phase. Record: completed modules, pending modules, known bugs, database migrations, important decisions, test results.

### 9. Avoid Overengineering

This is an MVP. Do not introduce:
- Microservices.
- Kubernetes.
- Redis.
- Message brokers.
- Complex event-driven infrastructure.
- Multiple backend deployments.

Unless there is a demonstrated need. Prefer a clean modular monolith.

### 10. First Task

Your first task is **NOT** to build the whole application.

Start by:
1. Reviewing this complete specification.
2. Creating a technical architecture proposal.
3. Defining the final Prisma database schema.
4. Identifying important data relationships.
5. Defining the project folder structure.
6. Preparing the implementation sequence.
7. Listing any ambiguities or risks.

**Present the architecture proposal for review before implementing the first module.**

After approval, begin Phase 0.

---

## FINAL PRODUCT DEFINITION

StreakUp is a social platform for personal consistency.

**Its core loop is:**

> Create a habit → Set a target → Complete an activity → Build a streak → Track progress → Share achievements → Motivate others.

The first release should prioritize reliability, simplicity, accurate streak calculations, and a smooth mobile experience.

Every future feature should support this central purpose.

---

## HOW TO START BUILDING

**Step 1:** Open the `streakup/` project folder in your terminal.

**Step 2:** Launch Claude Code:
```
claude
```

**Step 3:** Give Claude this initial instruction:

> Read `plan.md` completely. Treat it as the authoritative product requirements document. Do not start coding yet. First analyze the requirements, propose the technical architecture, identify database relationships, prepare the Prisma schema design, and explain the implementation sequence. Identify any conflicting or ambiguous business rules. Wait for my approval before starting Phase 0.

**Three key recommendations before you start:**

1. **Don't build the social system first.** Build authentication, habits, daily tasks, and streak calculation first. Social features depend on these modules.

2. **Test the streak engine extensively.** It is the most important business logic in StreakUp. A beautiful UI with incorrect streaks will make users lose trust.

3. **Build mobile-first.** Even though we are starting with a website, most users will check off their habits from their phones. Make the PWA installable from the beginning.
