import { fromZonedTime } from "date-fns-tz";

/** ISO 문자열로부터 슬롯 ID 생성 (UTC 기반 결정적) */
export function slotId(startIso: string): string {
  const utc = new Date(startIso).toISOString();
  return `s_${utc}`;
}

/**
 * 호스트 TZ의 (date, time)을 UTC instant ISO 문자열로 변환.
 * @param dateYmd "YYYY-MM-DD"
 * @param timeHHmm "HH:mm"
 * @param tz IANA 타임존 (예: "Asia/Seoul")
 */
export function toZonedInstant(dateYmd: string, timeHHmm: string, tz: string): string {
  return fromZonedTime(`${dateYmd}T${timeHHmm}:00`, tz).toISOString();
}
