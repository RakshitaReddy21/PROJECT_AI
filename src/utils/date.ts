import { ActivityItem } from '../types';

/**
 * Formats an ISO date string into a human-readable relative timestamp.
 * Examples: "Just now", "5m ago", "2h ago", "3d ago", "Not studied yet"
 */
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Not studied yet';
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return 'Recently';

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'Just now';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

/**
 * Calculates active study streak (number of consecutive days with activity ending today or yesterday).
 */
export function calculateStreak(activities: ActivityItem[]): number {
  if (!activities || activities.length === 0) return 0;

  const dayStrings = new Set<string>();
  activities.forEach((act) => {
    const d = new Date(act.timestamp);
    if (!isNaN(d.getTime())) {
      dayStrings.add(d.toISOString().slice(0, 10)); // YYYY-MM-DD in UTC
    }
  });

  if (dayStrings.size === 0) return 0;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterdayTime = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1);
  const yesterdayStr = new Date(yesterdayTime).toISOString().slice(0, 10);

  if (!dayStrings.has(todayStr) && !dayStrings.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let checkTime = dayStrings.has(todayStr)
    ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    : yesterdayTime;

  while (dayStrings.has(new Date(checkTime).toISOString().slice(0, 10))) {
    streak += 1;
    checkTime -= 24 * 60 * 60 * 1000;
  }

  return streak;
}

/**
 * Calculates estimated total study hours from recorded activities.
 * Uses realistic session weights based on activity type.
 */
export function calculateStudyHours(activities: ActivityItem[]): number {
  if (!activities || activities.length === 0) return 0.0;

  let totalMinutes = 0;
  activities.forEach((a) => {
    switch (a.type) {
      case 'quiz_completed':
        totalMinutes += 15;
        break;
      case 'assessment_submitted':
        totalMinutes += 25;
        break;
      case 'tutor_queried':
        totalMinutes += 6;
        break;
      case 'material_uploaded':
        totalMinutes += 10;
        break;
      case 'mastery_changed':
        totalMinutes += 4;
        break;
      default:
        totalMinutes += 5;
    }
  });

  return Math.round((totalMinutes / 60) * 10) / 10;
}

/**
 * Calculates activity intensity for each day of the current 7-day week (Mon - Sun).
 * Returns array of 7 items with day abbreviation, activity count, and height percentage (15% to 100%).
 */
export function calculateWeeklyIntensity(
  activities: ActivityItem[]
): { day: string; count: number; heightPercent: number; title: string }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  const now = new Date();
  // Get start of this week (Monday)
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Group activities in the current 7-day window
  activities.forEach((a) => {
    const actDate = new Date(a.timestamp);
    if (actDate >= monday && actDate <= sunday) {
      const dow = actDate.getDay();
      const index = dow === 0 ? 6 : dow - 1; // Mon=0, ..., Sun=6
      if (index >= 0 && index < 7) {
        dayCounts[index] += 1;
      }
    }
  });

  const maxCount = Math.max(1, ...dayCounts);

  return days.map((day, idx) => {
    const count = dayCounts[idx];
    const heightPercent = count === 0 ? 15 : Math.max(25, Math.round((count / maxCount) * 100));
    return {
      day,
      count,
      heightPercent,
      title: `${day}: ${count} action${count === 1 ? '' : 's'}`,
    };
  });
}
