import { getAppTimeZone } from "@/lib/env";

export function getAppDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: getAppTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function formatAppDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    timeZone: getAppTimeZone(),
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatAppDateHeader(
  value: string | Date,
  intlLocale = "en",
) {
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: getAppTimeZone(),
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatAppDateShort(
  value: string | Date,
  intlLocale = "en",
) {
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: getAppTimeZone(),
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatAppTime(value: string | Date, intlLocale = "en") {
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: getAppTimeZone(),
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
