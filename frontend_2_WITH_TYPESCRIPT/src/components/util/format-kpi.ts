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
    // 1️⃣ ISO 8601 Duration (e.g., "P1DT2H30M")
    const isoMatch = value.match(
      /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
    );
    if (isoMatch) {
      const [, days, hours] = isoMatch;
      const parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      return parts.join(" ");
    }

    // 2️⃣ Django-style timedelta with "days" (e.g., "21 days 07:51:32.537698930")
    const humanDaysMatch = value.match(
      /^(\d+)\s+days?\s+(\d+):(\d+):(\d+(?:\.\d+)?)$/,
    );
    if (humanDaysMatch) {
      const [, days, hours] = humanDaysMatch;
      const parts = [];
      if (days && parseInt(days) > 0) parts.push(`${days}d`);
      if (hours && parseInt(hours) > 0) parts.push(`${parseInt(hours)}h`);
      return parts.join(" ");
    }

    // 3️⃣ Django-style timedelta without "days" (e.g., "8 01:46:17.215038")
    const humanNoDaysMatch = value.match(
      /^(\d+)\s+(\d+):(\d+):(\d+(?:\.\d+)?)$/,
    );
    if (humanNoDaysMatch) {
      const [, days, hours] = humanNoDaysMatch;
      const parts = [];
      if (days && parseInt(days) > 0) parts.push(`${days}d`);
      if (hours && parseInt(hours) > 0) parts.push(`${parseInt(hours)}h`);
      return parts.join(" ");
    }

    // 4️⃣ ISO datetime (e.g., "2025-10-30T04:33:30.165861Z")
    const isoDatetimeMatch = value.match(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
    );
    if (isoDatetimeMatch) {
      const date = new Date(value);
      return date.toISOString().split("T")[0]; // returns only YYYY-MM-DD
    }

    // Fallback: return as-is
    return value;
  }

  return String(value);
}
