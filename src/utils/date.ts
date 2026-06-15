const pad = (n: number): string => n.toString().padStart(2, '0');

export const formatDate = (date: Date | number | string, format: string = 'YYYY-MM-DD'): string => {
  const d = new Date(date);
  return format
    .replace('YYYY', d.getFullYear().toString())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()));
};

export const getToday = (): string => formatDate(new Date(), 'YYYY-MM-DD');

export const getWeekDates = (baseDate: string = getToday()): { start: string; end: string; dates: string[] } => {
  const base = new Date(baseDate);
  const day = base.getDay() || 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - (day - 1));

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d, 'YYYY-MM-DD'));
  }

  return {
    start: dates[0],
    end: dates[6],
    dates
  };
};

export const getMonthDates = (yearMonth: string): string[] => {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  for (let i = 1; i <= lastDay; i++) {
    dates.push(`${yearMonth}-${pad(i)}`);
  }
  return dates;
};

export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(timestamp, 'MM-DD');
};

export const getCurrentMonth = (): string => formatDate(new Date(), 'YYYY-MM');

type DateRangeInput = '7d' | '30d' | { start: string; end: string };

export const getDateRange = (range: DateRangeInput): { dates: string[]; start: string; end: string } => {
  const today = new Date(getToday());
  let startDate: Date;
  let endDate: Date;

  if (range === '7d') {
    endDate = new Date(today);
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
  } else if (range === '30d') {
    endDate = new Date(today);
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 29);
  } else {
    startDate = new Date(range.start);
    endDate = new Date(range.end);
  }

  const dates: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(formatDate(current, 'YYYY-MM-DD'));
    current.setDate(current.getDate() + 1);
  }

  return {
    dates,
    start: formatDate(startDate, 'YYYY-MM-DD'),
    end: formatDate(endDate, 'YYYY-MM-DD')
  };
};
