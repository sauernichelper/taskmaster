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

export function formatTaskDate(
  isoDate: string,
  { includeYear = true }: FormatTaskDateOptions = {},
) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return includeYear
    ? taskDateFormatter.format(date)
    : taskDateShortFormatter.format(date);
}
