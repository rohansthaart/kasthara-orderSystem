import { formatInTimeZone } from "date-fns-tz";
import { DEFAULT_TIMEZONE } from "./constants";

export function buildOrderNumber(date: Date, sequence: number) {
  return `KAS-${formatInTimeZone(date, DEFAULT_TIMEZONE, "yyMMdd")}-${String(sequence).padStart(3, "0")}`;
}

export function dailySequenceKey(date: Date) {
  return formatInTimeZone(date, DEFAULT_TIMEZONE, "yyyy-MM-dd");
}
