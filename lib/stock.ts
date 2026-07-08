// Mulberry32 — fast seeded PRNG
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** 특정 날짜의 주가 노이즈 (-5% ~ +5%) — 날짜가 바뀌면 값이 바뀜 */
function dayNoise(projectId: string, dateStr: string): number {
  const rng = mulberry32(hashStr(projectId + "|" + dateStr));
  return (rng() - 0.5) * 0.10; // ±5%
}

export type DayPrice = {
  date: string;
  price: number;
  change: number;
  changePct: number;
};

/**
 * 일별 주가 히스토리 생성 (결정론적 — 같은 날 같은 프로젝트는 항상 같은 가격)
 *
 * - basePrice: 시장 정규화된 오늘의 기준가 (market.ts에서 산출)
 * - todayStr:  "YYYY-MM-DD" — 오늘 날짜를 시드에 포함 → 날마다 다른 가격
 * - 각 날짜의 가격 = basePrice × (1 + noise(projectId, dateStr))
 * - 과거 날짜는 그 날의 절대 날짜 문자열로 고정 → 어제 본 차트 = 오늘 본 어제 차트
 */
export function generatePriceHistory(
  projectId: string,
  basePrice: number,
  days = 30,
  todayStr?: string
): DayPrice[] {
  if (!basePrice || basePrice <= 0) return [];

  // 오늘 날짜 기준
  const todayDate = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
  todayDate.setHours(0, 0, 0, 0);

  // 각 날짜별 독립 가격 생성 (날짜 시드 → 매일 실제 변동)
  const result: DayPrice[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const noise = dayNoise(projectId, dateStr);
    const price = Math.round(basePrice * (1 + noise));
    result.push({ date: dateStr, price, change: 0, changePct: 0 });
  }

  // 등락 계산
  for (let i = 0; i < result.length; i++) {
    if (i === 0) {
      result[i].change = 0;
      result[i].changePct = 0;
    } else {
      const prev = result[i - 1].price;
      result[i].change = result[i].price - prev;
      result[i].changePct = prev > 0 ? (result[i].change / prev) * 100 : 0;
    }
  }

  return result;
}

/** SVG polyline points 문자열 (mini 스파크라인용) */
export function getSparklinePoints(
  history: DayPrice[],
  width = 80,
  height = 26
): string {
  if (history.length < 2) return "";
  const prices = history.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const n = prices.length;
  return prices
    .map((p, i) => {
      const x = (i / (n - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** 오늘의 가격 (history 마지막 원소) */
export function todayPrice(history: DayPrice[]): DayPrice | null {
  return history.length > 0 ? history[history.length - 1] : null;
}
