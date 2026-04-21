const taskDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

const taskDateShortFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

type FormatTaskDateOptions = {
  includeYear?: boolean;
};

function getDatePart(parts: Intl.DateTimeFormatPart[], type: string) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatTaskDate(
  isoDate: string,
  { includeYear = true }: FormatTaskDateOptions = {},
) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  const formatter = includeYear ? taskDateFormatter : taskDateShortFormatter;
  const parts = formatter.formatToParts(date);
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");
  const year = getDatePart(parts, "year");
  const hour = getDatePart(parts, "hour");
  const minute = getDatePart(parts, "minute");
  const dayPeriod = getDatePart(parts, "dayPeriod");
  const time = [hour, minute].filter(Boolean).join(":");
  const timeWithPeriod = [time, dayPeriod].filter(Boolean).join(" ");

  if (includeYear) {
    return `${month} ${day}, ${year}, ${timeWithPeriod}`;
  }

  return `${month} ${day}, ${timeWithPeriod}`;
}
