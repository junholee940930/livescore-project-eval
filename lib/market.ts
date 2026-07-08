import { Project, Settings } from "./store";
import { calcProject, EvalResult } from "./calc";

export type MarketResult = {
  result: EvalResult;
  stockPrice: number; // 시장 정규화된 주가
};

/**
 * 전사 시장 주가 계산 (제로섬 구조)
 *
 * 전체 시총 = Σ(모든 프로젝트의 final 평가금) — 고정
 * 개별 주가  = 시총 × (rawWeight[i] / Σ rawWeights)
 *
 * rawWeight = final × progressMultiplier × statusPremium
 * → PM이 진행률 올리면 내 주가 ↑, 나머지 전체 ↓
 * → 전체 합계는 항상 totalPool로 유지됨
 */
export function calcMarket(
  projects: Project[],
  settings: Settings
): Map<string, MarketResult> {
  const market = new Map<string, MarketResult>();
  if (projects.length === 0) return market;

  // 1단계: 각 프로젝트 개별 계산
  const pairs = projects.map((p) => ({ project: p, result: calcProject(p, settings) }));

  // 2단계: 전체 시총 = 전체 프로젝트 협업자 투자금 총합 (고정 풀)
  const totalPool = projects.reduce(
    (sum, p) => sum + p.collaborators.reduce((s, c) => s + (c.investmentAmount ?? 0), 0),
    0
  );

  // 3단계: rawWeight 합 (진행률·상태 프리미엄 반영)
  const sumRawWeights = pairs.reduce((sum, { result }) => sum + result.rawWeight, 0);

  // 4단계: 정규화 주가 산출
  for (const { project, result } of pairs) {
    let stockPrice: number;
    if (sumRawWeights > 0 && totalPool > 0) {
      const share = result.rawWeight / sumRawWeights;
      stockPrice = Math.round(totalPool * share);
    } else {
      stockPrice = result.rawWeight; // fallback
    }
    market.set(project.id, { result: { ...result, stockPrice }, stockPrice });
  }

  return market;
}
