import { describe, it, expect } from "vitest";
import {
  isScheduledOn,
  calculateHabitStreak,
  calculateOverallStreak,
  isMilestone,
  type ScheduleVersion,
  type HabitForStreak,
  type CompletionDate,
} from "@/server/services/streakEngine";

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Create a UTC-midnight date from a YYYY-MM-DD string */
function d(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, day!));
}

/** Build N consecutive completion dates ending on `endStr` (inclusive) */
function rangeDates(endStr: string, count: number): Date[] {
  const end = d(endStr);
  const dates: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    dates.push(new Date(end.getTime() - i * 86400000));
  }
  return dates;
}

// ─── Schedule helpers ─────────────────────────────────────────────────────────

function dailyVersion(from: string, until?: string): ScheduleVersion {
  return {
    frequencyType: "DAILY",
    validFrom: d(from),
    validUntil: until ? d(until) : null,
    scheduleDays: [],
  };
}

function weekdayVersion(
  from: string,
  weekdays: number[],
  until?: string
): ScheduleVersion {
  return {
    frequencyType: "SELECTED_DAYS",
    validFrom: d(from),
    validUntil: until ? d(until) : null,
    scheduleDays: weekdays.map((w) => ({ weekday: w })),
  };
}

function habit(
  id: string,
  startStr: string,
  versions: ScheduleVersion[]
): HabitForStreak {
  return { id, startDate: d(startStr), scheduleVersions: versions };
}

// ─── isScheduledOn ────────────────────────────────────────────────────────────

describe("isScheduledOn", () => {
  it("returns true for a daily habit on any day", () => {
    const versions = [dailyVersion("2024-01-01")];
    expect(isScheduledOn(versions, d("2024-06-15"))).toBe(true);
    expect(isScheduledOn(versions, d("2025-12-31"))).toBe(true);
  });

  it("returns false before validFrom", () => {
    const versions = [dailyVersion("2024-06-01")];
    expect(isScheduledOn(versions, d("2024-05-31"))).toBe(false);
  });

  it("returns false after validUntil", () => {
    const versions = [dailyVersion("2024-01-01", "2024-06-30")];
    expect(isScheduledOn(versions, d("2024-07-01"))).toBe(false);
  });

  it("returns true on validFrom and validUntil boundary days", () => {
    const versions = [dailyVersion("2024-06-01", "2024-06-30")];
    expect(isScheduledOn(versions, d("2024-06-01"))).toBe(true);
    expect(isScheduledOn(versions, d("2024-06-30"))).toBe(true);
  });

  it("returns false in a gap between two schedule versions (paused period)", () => {
    const versions = [
      dailyVersion("2024-01-01", "2024-05-31"),
      dailyVersion("2024-07-01"),
    ];
    expect(isScheduledOn(versions, d("2024-06-15"))).toBe(false); // gap
    expect(isScheduledOn(versions, d("2024-07-01"))).toBe(true);  // resumed
  });

  it("returns true for SELECTED_DAYS on a matching weekday", () => {
    // Mon=1, Wed=3, Fri=5
    const versions = [weekdayVersion("2024-01-01", [1, 3, 5])];
    expect(isScheduledOn(versions, d("2024-06-10"))).toBe(true);  // Monday
    expect(isScheduledOn(versions, d("2024-06-12"))).toBe(true);  // Wednesday
    expect(isScheduledOn(versions, d("2024-06-11"))).toBe(false); // Tuesday
    expect(isScheduledOn(versions, d("2024-06-15"))).toBe(false); // Saturday
  });
});

// ─── calculateHabitStreak ─────────────────────────────────────────────────────

describe("calculateHabitStreak", () => {
  it("returns zeros when no completions exist", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    const result = calculateHabitStreak(h, [], d("2024-01-10"));
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.totalCompleted).toBe(0);
  });

  it("counts consecutive completions up to today (pending today)", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    // Completed Jan 8 and Jan 9; today = Jan 10 (pending)
    const completions = [d("2024-01-08"), d("2024-01-09")];
    const result = calculateHabitStreak(h, completions, d("2024-01-10"));
    expect(result.current).toBe(2);
  });

  it("includes today in current streak when today is completed", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    const completions = [d("2024-01-08"), d("2024-01-09"), d("2024-01-10")];
    const result = calculateHabitStreak(h, completions, d("2024-01-10"));
    expect(result.current).toBe(3);
  });

  it("breaks streak when a scheduled day is missed", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    // Completed Jan 1-5, missed Jan 6, completed Jan 7-10
    const completions = [
      d("2024-01-01"), d("2024-01-02"), d("2024-01-03"), d("2024-01-04"), d("2024-01-05"),
      d("2024-01-07"), d("2024-01-08"), d("2024-01-09"), d("2024-01-10"),
    ];
    const result = calculateHabitStreak(h, completions, d("2024-01-10"));
    expect(result.current).toBe(4); // Jan 7-10
    expect(result.longest).toBe(5); // Jan 1-5
  });

  it("non-scheduled days are neutral and don't break streak", () => {
    // Mon=1, Wed=3, Fri=5 habit
    const h = habit("h1", "2024-06-03", [weekdayVersion("2024-06-03", [1, 3, 5])]);
    // Week of June 3: Mon Jun 3, Wed Jun 5, Fri Jun 7
    const completions = [d("2024-06-03"), d("2024-06-05"), d("2024-06-07")];
    const result = calculateHabitStreak(h, completions, d("2024-06-08")); // Saturday
    expect(result.current).toBe(3); // 3 consecutive scheduled days completed
  });

  it("paused period (gap between versions) is neutral", () => {
    const h = habit("h1", "2024-01-01", [
      dailyVersion("2024-01-01", "2024-01-10"), // active until Jan 10
      dailyVersion("2024-01-20"),                // resumed Jan 20
    ]);
    // Completed last day before pause (Jan 10) and after resume (Jan 20-22)
    const completions = [
      d("2024-01-10"),
      d("2024-01-20"), d("2024-01-21"), d("2024-01-22"),
    ];
    const result = calculateHabitStreak(h, completions, d("2024-01-22"));
    // Gap Jan 11-19 is neutral → streak should continue through pause
    expect(result.current).toBe(4);
  });

  it("calculates totalCompleted correctly", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    const completions = rangeDates("2024-01-10", 7);
    const result = calculateHabitStreak(h, completions, d("2024-01-15"));
    expect(result.totalCompleted).toBe(7);
  });

  it("calculates completionRate correctly", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    // 5 days window, 4 completed
    const completions = [
      d("2024-01-01"), d("2024-01-02"), d("2024-01-04"), d("2024-01-05"),
    ];
    const result = calculateHabitStreak(h, completions, d("2024-01-05"));
    expect(result.eligibleDays).toBe(5);
    expect(result.completionRate).toBe(80);
  });

  it("longest streak can exceed current streak", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    // 7 days Jan 1-7, then break, then 2 days Jan 10-11
    const completions = [
      ...rangeDates("2024-01-07", 7),
      d("2024-01-10"), d("2024-01-11"),
    ];
    const result = calculateHabitStreak(h, completions, d("2024-01-11"));
    expect(result.current).toBe(2);
    expect(result.longest).toBe(7);
  });
});

// ─── calculateOverallStreak ───────────────────────────────────────────────────

describe("calculateOverallStreak", () => {
  it("returns zeros when no habits", () => {
    const result = calculateOverallStreak([], [], d("2024-01-10"));
    expect(result).toEqual({ current: 0, longest: 0 });
  });

  it("counts a day when at least one scheduled habit is completed", () => {
    const h1 = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    const h2 = habit("h2", "2024-01-01", [dailyVersion("2024-01-01")]);
    // Only h1 completed on Jan 10
    const completions: CompletionDate[] = [{ habitId: "h1", localDate: d("2024-01-10") }];
    const result = calculateOverallStreak([h1, h2], completions, d("2024-01-10"));
    expect(result.current).toBe(1);
  });

  it("breaks when a day has scheduled habits but none completed", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    // Completed Jan 8-9, missed Jan 10 (today)
    const completions: CompletionDate[] = [
      { habitId: "h1", localDate: d("2024-01-08") },
      { habitId: "h1", localDate: d("2024-01-09") },
    ];
    const result = calculateOverallStreak([h], completions, d("2024-01-10"));
    // today is pending so we check yesterday (Jan 9) → streak = 2
    expect(result.current).toBe(2);
  });

  it("neutral days don't break overall streak", () => {
    // Mon/Wed/Fri habit
    const h = habit("h1", "2024-06-03", [weekdayVersion("2024-06-03", [1, 3, 5])]);
    const completions: CompletionDate[] = [
      { habitId: "h1", localDate: d("2024-06-03") }, // Mon
      { habitId: "h1", localDate: d("2024-06-05") }, // Wed
      { habitId: "h1", localDate: d("2024-06-07") }, // Fri
    ];
    const result = calculateOverallStreak([h], completions, d("2024-06-08")); // Sat
    expect(result.current).toBe(3);
  });

  it("tracks longest correctly across multiple runs", () => {
    const h = habit("h1", "2024-01-01", [dailyVersion("2024-01-01")]);
    const completions: CompletionDate[] = [
      // 5-day run Jan 1-5
      ...rangeDates("2024-01-05", 5).map((d) => ({ habitId: "h1", localDate: d })),
      // 2-day run Jan 8-9
      { habitId: "h1", localDate: d("2024-01-08") },
      { habitId: "h1", localDate: d("2024-01-09") },
    ];
    const result = calculateOverallStreak([h], completions, d("2024-01-09"));
    expect(result.current).toBe(2);
    expect(result.longest).toBe(5);
  });
});

// ─── isMilestone ─────────────────────────────────────────────────────────────

describe("isMilestone", () => {
  it("returns true for milestone values", () => {
    expect(isMilestone(3)).toBe(true);
    expect(isMilestone(7)).toBe(true);
    expect(isMilestone(14)).toBe(true);
    expect(isMilestone(30)).toBe(true);
    expect(isMilestone(50)).toBe(true);
    expect(isMilestone(100)).toBe(true);
  });

  it("returns false for non-milestone values", () => {
    expect(isMilestone(0)).toBe(false);
    expect(isMilestone(1)).toBe(false);
    expect(isMilestone(5)).toBe(false);
    expect(isMilestone(10)).toBe(false);
    expect(isMilestone(99)).toBe(false);
    expect(isMilestone(101)).toBe(false);
  });
});
