export const UK_TIME_ZONE = "Europe/London";

export type ShiftTimeRange = {
  shift_date: string;
  end_date?: string | null;
  start_time: string;
  end_time: string;
};

export const parseUtcTimestamp = (timestamp?: string | null) => {
  if (!timestamp) return null;

  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  return new Date(hasTimezone ? timestamp : `${timestamp}Z`);
};

export const getUKParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
};

export const getUKWallClockDate = (date = new Date()) => {
  const parts = getUKParts(date);

  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
};

export const getUKDateString = (date = new Date()) => {
  const parts = getUKParts(date);

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
};

export const getUKTimeString = (date = new Date()) => {
  const parts = getUKParts(date);

  return `${String(parts.hour).padStart(2, "0")}:${String(
    parts.minute,
  ).padStart(2, "0")}`;
};

export const addDaysToDateString = (date: string, days: number) => {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));

  return `${nextDate.getUTCFullYear()}-${String(
    nextDate.getUTCMonth() + 1,
  ).padStart(2, "0")}-${String(nextDate.getUTCDate()).padStart(2, "0")}`;
};

export const getWallClockDateTime = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
};

export const getShiftWallClockRange = (shift: ShiftTimeRange) => {
  const start = getWallClockDateTime(shift.shift_date, shift.start_time);
  const fallbackEndDate =
    shift.end_time <= shift.start_time
      ? addDaysToDateString(shift.shift_date, 1)
      : shift.shift_date;
  const end = getWallClockDateTime(
    shift.end_date || fallbackEndDate,
    shift.end_time,
  );

  if (end <= start) {
    end.setUTCDate(end.getUTCDate() + 1);
  }

  return { start, end };
};

export const ukToUTC = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  const targetWallTime = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcDate = new Date(targetWallTime);

  for (let i = 0; i < 3; i += 1) {
    const parts = getUKParts(utcDate);
    const actualWallTime = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );

    utcDate = new Date(utcDate.getTime() + targetWallTime - actualWallTime);
  }

  return utcDate;
};

export const formatWallClockTime = (date: Date) => {
  return date.toISOString().slice(11, 16);
};

export const formatUKDate = (timestamp?: string | null) => {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatUKCalendarDate = (dateString?: string | null) => {
  if (!dateString) return "-";

  const [year, month, day] = dateString.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

export const formatUKLongDate = (timestamp?: string | null) => {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const formatUKShortDate = (timestamp?: string | null) => {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatUKTimeOnly = (timestamp?: string | null) => {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export const formatUKDateTime = (timestamp?: string | null) => {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};
