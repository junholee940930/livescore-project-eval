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
  scoreCount: number;       // 총 제출 수
  scoredCount: number;      // 절사 후 적용 수 (최고·최저 제외)
  afterScore: number;
  executiveAdj: number;
  final: number;
  totalPVShare: number;
  totalUVShare: number;
  nonSubUV: number;
};

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

export function calcProject(project: Project, settings: Settings): EvalResult {
  const {
    totalPV, totalUV, subscriptionUV,
    adRevenuePerPV, adRevenuePerUV,
    pickPricePerUnit, subscriptionMonthly, giftPricePerUnit,
  } = settings;

  const nonSubUV = Math.max(0, totalUV - subscriptionUV);
  const appliedScreens = SCREENS.filter((s) => project.screenIds.includes(s.id));
  const totalPVShare = appliedScreens.reduce((sum, s) => sum + s.pvShare, 0);
  const totalUVShare = appliedScreens.reduce((sum, s) => sum + s.uvShare, 0);
  const seasonFactor = 1 / 3;

  const adRevenuePV = totalPV * totalPVShare * adRevenuePerPV * seasonFactor;
  const adRevenueUV = nonSubUV * totalUVShare * adRevenuePerUV * seasonFactor;
  const adRevenue = adRevenuePV + adRevenueUV;
  const pickRevenue = project.pickCount * pickPricePerUnit;
  const subscriptionRevenue = subscriptionUV * subscriptionMonthly * 4 * totalUVShare;
  const giftRevenue = project.giftCount * giftPricePerUnit;
  const totalBase = adRevenue + pickRevenue + subscriptionRevenue + giftRevenue;

  // 절사평균 적용
  const allWeighted = Object.values(project.scores).map(calcWeightedScore);
  const { avg: avgScore, used: scoredCount } = trimmedMean(allWeighted);
  const scoreCount = allWeighted.length;

  const afterScore = totalBase * (avgScore / 100);
  const final = afterScore + project.executiveAdj;

  return {
    adRevenuePV, adRevenueUV, adRevenue,
    pickRevenue, subscriptionRevenue, giftRevenue,
    totalBase, avgScore, scoreCount, scoredCount,
    afterScore, executiveAdj: project.executiveAdj, final,
    totalPVShare, totalUVShare, nonSubUV,
  };
}

export function formatKRW(n: number) {
  if (!isFinite(n) || isNaN(n)) return "-";
  return n.toLocaleString("ko-KR") + "원";
}
