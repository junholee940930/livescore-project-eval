import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SCORE_CATEGORIES = [
  { key: "매출가속성",    label: "매출가속성",     weight: 0.40 },
  { key: "사용자플랫폼화", label: "사용자 플랫폼화", weight: 0.20 },
  { key: "AI효율활용화",  label: "AI 효율 활용화", weight: 0.30 },
  { key: "협업점수",     label: "협업점수",       weight: 0.10 },
] as const;

export type ScoreCategoryKey = typeof SCORE_CATEGORIES[number]["key"];

export type CategoryScore = {
  매출가속성: number;
  사용자플랫폼화: number;
  AI효율활용화: number;
  협업점수: number;
};

export function calcWeightedScore(cs: CategoryScore): number {
  return (
    cs.매출가속성    * 0.40 +
    cs.사용자플랫폼화 * 0.20 +
    cs.AI효율활용화  * 0.30 +
    cs.협업점수      * 0.10
  );
}

export type Collaborator = {
  id: string;
  name: string;
  role: string;
  equityPct: number;        // 지분율 (%)
  skillValue: number;
  investmentAmount: number; // 투자금 (원)
};

export type SharePurchase = {
  id: string;
  buyerName: string;
  qty: number;
  pricePerShare: number;
  purchasedAt: string; // ISO date string
};

export const TOTAL_SHARES = 100;

export type Project = {
  id: string;
  excelId?: string;
  name: string;
  description: string;
  season: string;
  status?: string;
  progress?: number;
  pm?: string;
  skillValueTotal?: number;
  collaborators: Collaborator[];
  purchases: SharePurchase[]; // 주식 구매 내역
  screenIds: string[];
  pickCount: number;
  giftCount: number;
  scores: Record<string, CategoryScore>; // 평가자명 → 항목별 점수
  executiveAdj: number;
};

export type Settings = {
  dailyPV: number;              // 일평균 PV
  dailyUV: number;              // 일평균 UV
  subscriptionUV: number;       // 구독 UV (총수, 시간 무관)
  adRevenuePerPVDaily: number;  // 1PV당 일 광고매출 (원)
  adRevenuePerUVDaily: number;  // 1UV당 일 광고매출 (원)
  pickPricePerUnit: number;
  subscriptionMonthly: number;
  giftPricePerUnit: number;
};

type Store = {
  settings: Settings;
  projects: Project[];
  updateSettings: (s: Partial<Settings>) => void;
  addProject: (p: Project) => void;
  addProjects: (ps: Project[]) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setScore: (projectId: string, scorer: string, score: CategoryScore) => void;
  addPurchase: (projectId: string, purchase: Omit<SharePurchase, "id" | "purchasedAt">) => void;
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      settings: {
        // 연간값 ÷ 365로 일 단위 변환한 기본값
        dailyPV: Math.round(81480548 / 365),   // ≈ 223,234
        dailyUV: Math.round(415018 / 365),      // ≈ 1,137
        subscriptionUV: 0,
        adRevenuePerPVDaily: parseFloat((11.22 / 365).toFixed(5)),  // ≈ 0.03074
        adRevenuePerUVDaily: parseFloat((2374 / 365).toFixed(3)),   // ≈ 6.504
        pickPricePerUnit: 1000,
        subscriptionMonthly: 9900,
        giftPricePerUnit: 0,
      },
      projects: [],
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      addProject: (p) =>
        set((state) => ({ projects: [...state.projects, p] })),
      addProjects: (ps) =>
        set((state) => {
          // excelId 기준 upsert — 같은 종목코드면 덮어쓰고, 없으면 추가
          const map = new Map(state.projects.map((p) => [p.excelId || p.id, p]));
          ps.forEach((p) => map.set(p.excelId || p.id, p));
          return { projects: Array.from(map.values()) };
        }),
      updateProject: (id, p) =>
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id ? { ...proj, ...p } : proj
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
      setScore: (projectId, scorer, score) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, scores: { ...p.scores, [scorer]: score } }
              : p
          ),
        })),
      addPurchase: (projectId, purchase) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const newEntry: SharePurchase = {
              ...purchase,
              id: Math.random().toString(36).slice(2),
              purchasedAt: new Date().toISOString(),
            };
            return { ...p, purchases: [...(p.purchases ?? []), newEntry] };
          }),
        })),
    }),
    {
      name: "livescore-eval",
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<typeof current>;
        // 구 연간 필드 마이그레이션용 raw 접근
        const rawSettings = (p.settings ?? {}) as Record<string, number>;
        const newSettings: Settings = {
          ...current.settings,
          ...(p.settings ?? {}),
        };
        if (rawSettings.totalPV != null && rawSettings.dailyPV == null)
          newSettings.dailyPV = Math.round(rawSettings.totalPV / 365);
        if (rawSettings.totalUV != null && rawSettings.dailyUV == null)
          newSettings.dailyUV = Math.round(rawSettings.totalUV / 365);
        if (rawSettings.adRevenuePerPV != null && rawSettings.adRevenuePerPVDaily == null)
          newSettings.adRevenuePerPVDaily = parseFloat((rawSettings.adRevenuePerPV / 365).toFixed(5));
        if (rawSettings.adRevenuePerUV != null && rawSettings.adRevenuePerUVDaily == null)
          newSettings.adRevenuePerUVDaily = parseFloat((rawSettings.adRevenuePerUV / 365).toFixed(3));
        const projects = ((p.projects ?? []) as Project[]).map((proj) => ({
          ...proj,
          purchases: (proj.purchases ?? []) as SharePurchase[],
        }));
        return { ...current, ...p, settings: newSettings, projects };
      },
    }
  )
);
