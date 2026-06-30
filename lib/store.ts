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
  equityPct: number;
  skillValue: number;
};

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
  screenIds: string[];
  pickCount: number;
  giftCount: number;
  scores: Record<string, CategoryScore>; // 평가자명 → 항목별 점수
  executiveAdj: number;
};

export type Settings = {
  totalPV: number;           // 앱 전체 PV (연간)
  totalUV: number;           // 앱 전체 UV
  subscriptionUV: number;    // 구독 UV
  adRevenuePerPV: number;    // 1PV당 연 광고매출 (원)
  adRevenuePerUV: number;    // 1UV당 연 광고매출 (원)
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
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      settings: {
        totalPV: 81480548,
        totalUV: 415018,
        subscriptionUV: 0,
        adRevenuePerPV: 11.22,
        adRevenuePerUV: 2374,
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
        set((state) => ({ projects: [...state.projects, ...ps] })),
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
    }),
    {
      name: "livescore-eval",
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<typeof current>;
        return {
          ...current,
          ...p,
          // settings는 기본값과 병합 — 새 필드 누락 방지
          settings: {
            ...current.settings,
            ...(p.settings ?? {}),
          },
        };
      },
    }
  )
);
