export function pad2(n: number): string { return String(n).padStart(2, '0'); }

// Retorna data-hora local com offset no formato AAAA-MM-DDTHH:mm:ss-03:00
export function formatLocalDateTimeWithOffset(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hour = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  const sec = pad2(d.getSeconds());

  const tzMin = -d.getTimezoneOffset(); // minutos do fuso (ex.: -180 => -03:00)
  const sign = tzMin >= 0 ? '+' : '-';
  const absMin = Math.abs(tzMin);
  const offH = pad2(Math.floor(absMin / 60));
  const offM = pad2(absMin % 60);

  return `${year}-${month}-${day}T${hour}:${min}:${sec}${sign}${offH}:${offM}`;
}
