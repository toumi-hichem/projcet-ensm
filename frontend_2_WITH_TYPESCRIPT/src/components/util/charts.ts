export function formatValue(value: number | string): string {
  if (typeof value === "number") {
    // Percentage case (0–1 float)
    if (value >= 0 && value <= 1) {
      return `${(value * 100).toFixed(1)}%`;
    }
    // Normal number
    return value.toLocaleString();
  }

  if (typeof value === "string") {
    // Try to detect ISO timedelta or human-like timedelta
    const isoMatch = value.match(
      /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
    );
    if (isoMatch) {
      const [, days, hours, minutes, seconds] = isoMatch;
      const parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (minutes) parts.push(`${minutes}m`);
      if (seconds) parts.push(`${Math.floor(Number(seconds))}s`);
      return parts.join(" ");
    }

    // Case like "1 day, 2:30:00"
    const humanTimeMatch = value.match(/(\d+)\s*day[s]?,?\s*(\d+):(\d+):(\d+)/);
    if (humanTimeMatch) {
      const [, days, hours, minutes] = humanTimeMatch;
      const parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (minutes) parts.push(`${minutes}m`);
      return parts.join(" ");
    }

    // Fallback: return as-is
    return value;
  }

  return String(value);
}
