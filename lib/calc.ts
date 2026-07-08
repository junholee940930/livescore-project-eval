import { Project, Settings, calcWeightedScore } from "./store";
import { SCREENS } from "./data";

export type EvalResult = {
  adRevenuePV: number;
  adRevenueUV: number;
  adRevenue: number;
  pickRevenue: number;
  subscriptionRevenue: number;
  giftRevenue: number;
  totalBase: number;
  avgScore: number;
  scoreCount: number;
  scoredCount: number;
  afterScore: number;
  executiveAdj: number;
  final: number;
  // 주가 보정 인자
  progressMultiplier: number;  // 진행률 반영 배수
  statusPremium: number;       // 상태 단계 프리미엄
  rawWeight: number;           // final × progressMultiplier × statusPremium (시장 정규화 전)
  stockPrice: number;          // 시장 정규화된 최종 주가 (market.ts에서 주입)
  totalPVShare: number;
  totalUVShare: number;
  nonSubUV: number;
};

/**
 * 진행률 → 주가 배수
 * 입력하지 않은 경우(null) = 0.5 (불확실 디스카운트)
 * 0% = 0.30, 50% = 0.75, 100% = 1.00
 * PM이 부풀리면 거품 그대로 반영 — 시장이 판단함
 */
export function calcProgressMultiplier(progress: number | undefined | null): number {
  if (progress == null) return 0.5;
  const p = Math.max(0, Math.min(100, progress)) / 100;
  return 0.30 + 0.70 * p;
}

/**
 * 프로젝트 상태 → 주가 프리미엄
 * 예정=0.70 / 기획=0.85 / 진행=1.00 / 완료=1.15
 */
export function calcStatusPremium(status: string | undefined): number {
  const map: Record<string, number> = {
    "예정": 0.70,
    "기획": 0.85,
    "진행": 1.00,
    "완료": 1.15,
  };
  return map[status ?? ""] ?? 0.75;
}

// 최고점·최저점 각 1개 제외 절사평균 (3명 미만이면 전체 평균)
function trimmedMean(scores: number[]): { avg: number; used: number } {
  if (scores.length === 0) return { avg: 100, used: 0 };
  if (scores.length <= 2) {
    return { avg: scores.reduce((a, b) => a + b, 0) / scores.length, used: scores.length };
  }
  const sorted = [...scores].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return { avg: trimmed.reduce((a, b) => a + b, 0) / trimmed.length, used: trimmed.length };
}

const SEASON_DAYS = 120; // 시즌 1개 = 4개월 = 120일

export function calcProject(project: Project, settings: Settings): EvalResult {
  const {
    dailyPV, dailyUV, subscriptionUV,
    adRevenuePerPVDaily, adRevenuePerUVDaily,
    pickPricePerUnit, subscriptionMonthly, giftPricePerUnit,
  } = settings;

  // subscriptionUV는 총 구독자 수이므로 일평균UV 대비 비율로 비구독 비율 산출
  const subRatio = dailyUV > 0 ? Math.min(1, subscriptionUV / dailyUV) : 0;
  const nonSubUV = Math.max(0, dailyUV * (1 - subRatio));
  const appliedScreens = SCREENS.filter((s) => project.screenIds.includes(s.id));
  const totalPVShare = appliedScreens.reduce((sum, s) => sum + s.pvShare, 0);
  const totalUVShare = appliedScreens.reduce((sum, s) => sum + s.uvShare, 0);

  // 일평균 × 점유율 × 1일매출 × 시즌일수
  const adRevenuePV = dailyPV * totalPVShare * adRevenuePerPVDaily * SEASON_DAYS;
  const adRevenueUV = nonSubUV * totalUVShare * adRevenuePerUVDaily * SEASON_DAYS;
  const adRevenue = adRevenuePV + adRevenueUV;
  const pickRevenue = project.pickCount * pickPricePerUnit;
  const subscriptionRevenue = subscriptionUV * subscriptionMonthly * 4 * totalUVShare;
  const giftRevenue = project.giftCount * giftPricePerUnit;
  const screenRevenue = adRevenue + pickRevenue + subscriptionRevenue + giftRevenue;
  // screenIds 미매칭 시 skillValueTotal을 추정 기반값으로 사용 (화면 매칭 전 임시 주가)
  const totalBase = screenRevenue > 0 ? screenRevenue : (project.skillValueTotal ?? 0);

  // 절사평균 적용
  const allWeighted = Object.values(project.scores).map(calcWeightedScore);
  const { avg: avgScore, used: scoredCount } = trimmedMean(allWeighted);
  const scoreCount = allWeighted.length;

  const afterScore = totalBase * (avgScore / 100);
  const final = afterScore + project.executiveAdj;

  // 주가 보정 인자 (거품 허용 — 시장이 판단)
  const progressMultiplier = calcProgressMultiplier(project.progress);
  const statusPremium = calcStatusPremium(project.status);
  const rawWeight = final * progressMultiplier * statusPremium;

  return {
    adRevenuePV, adRevenueUV, adRevenue,
    pickRevenue, subscriptionRevenue, giftRevenue,
    totalBase, avgScore, scoreCount, scoredCount,
    afterScore, executiveAdj: project.executiveAdj, final,
    progressMultiplier, statusPremium,
    rawWeight,
    stockPrice: rawWeight, // market.ts에서 정규화 전 임시값
    totalPVShare, totalUVShare, nonSubUV,
  };
}

export function formatKRW(n: number) {
  if (!isFinite(n) || isNaN(n)) return "-";
  return n.toLocaleString("ko-KR") + "원";
}
