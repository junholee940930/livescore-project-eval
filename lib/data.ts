export type Screen = {
  id: string;
  depth1: string;
  depth2?: string;
  depth3?: string;
  uvShare: number; // 전체 UV 점유율 (1뎁스 × 2뎁스 × 3뎁스)
  pvShare: number; // 전체 PV 점유율
  hasPick?: boolean;
};

// 1뎁스 × 2뎁스 × 3뎁스 점유율 곱
export const SCREENS: Screen[] = [
  // LIVE 페이지 (0.78) → 경기상세 (1) → 3뎁스들
  { id: "live_video",    depth1: "LIVE 페이지", depth2: "경기상세", depth3: "동영상",  uvShare: 0.78*1*0.05, pvShare: 0.78*1*0.08 },
  { id: "live_cheer",    depth1: "LIVE 페이지", depth2: "경기상세", depth3: "응원글",  uvShare: 0.78*1*0.10, pvShare: 0.78*1*0.05 },
  { id: "live_compare",  depth1: "LIVE 페이지", depth2: "경기상세", depth3: "비교분석", uvShare: 0.78*1*0.27, pvShare: 0.78*1*0.30 },
  { id: "live_answer",   depth1: "LIVE 페이지", depth2: "경기상세", depth3: "답",      uvShare: 0.78*1*0.10, pvShare: 0.78*1*0.18 },
  { id: "live_pick",     depth1: "LIVE 페이지", depth2: "경기상세", depth3: "픽",      uvShare: 0.78*1*0.10, pvShare: 0.78*1*0.12, hasPick: true },
  { id: "live_lineup",   depth1: "LIVE 페이지", depth2: "경기상세", depth3: "라인업",  uvShare: 0.78*1*0.20, pvShare: 0.78*1*0.22 },
  { id: "live_stellar",  depth1: "LIVE 페이지", depth2: "경기상세", depth3: "스텔러",  uvShare: 0.78*1*0.03, pvShare: 0.78*1*0.02 },
  { id: "live_end",      depth1: "LIVE 페이지", depth2: "경기상세", depth3: "종",      uvShare: 0.78*1*0.15, pvShare: 0.78*1*0.03 },
  // 토토 페이지 (0.15) → 경기상세 (1) → 3뎁스들
  { id: "toto_video",    depth1: "토토 페이지", depth2: "경기상세", depth3: "동영상",  uvShare: 0.15*1*0.03, pvShare: 0.15*1*0.05 },
  { id: "toto_cheer",    depth1: "토토 페이지", depth2: "경기상세", depth3: "응원글",  uvShare: 0.15*1*0.05, pvShare: 0.15*1*0.05 },
  { id: "toto_compare",  depth1: "토토 페이지", depth2: "경기상세", depth3: "비교분석", uvShare: 0.15*1*0.20, pvShare: 0.15*1*0.15 },
  { id: "toto_answer",   depth1: "토토 페이지", depth2: "경기상세", depth3: "답",      uvShare: 0.15*1*0.20, pvShare: 0.15*1*0.15 },
  { id: "toto_pick",     depth1: "토토 페이지", depth2: "경기상세", depth3: "픽",      uvShare: 0.15*1*0.25, pvShare: 0.15*1*0.30, hasPick: true },
  { id: "toto_lineup",   depth1: "토토 페이지", depth2: "경기상세", depth3: "라인업",  uvShare: 0.15*1*0.10, pvShare: 0.15*1*0.10 },
  { id: "toto_stellar",  depth1: "토토 페이지", depth2: "경기상세", depth3: "스텔러",  uvShare: 0.15*1*0.02, pvShare: 0.15*1*0.05 },
  { id: "toto_end",      depth1: "토토 페이지", depth2: "경기상세", depth3: "종",      uvShare: 0.15*1*0.15, pvShare: 0.15*1*0.15 },
  // 게시판 페이지 (0.02) → 게시글 상세 (1)
  { id: "board_detail",  depth1: "게시판 페이지", depth2: "게시글 상세", uvShare: 0.02*1, pvShare: 0.07*1 },
  // FUN 페이지 (0.02) → 2뎁스
  { id: "fun_ratok",     depth1: "FUN 페이지", depth2: "라톡", uvShare: 0.02*0.33, pvShare: 0.01*0.33 },
  { id: "fun_ratune",    depth1: "FUN 페이지", depth2: "라튠", uvShare: 0.02*0.33, pvShare: 0.01*0.33 },
  { id: "fun_ratub",     depth1: "FUN 페이지", depth2: "라튭", uvShare: 0.02*0.33, pvShare: 0.01*0.33 },
  // 종페이지, 프로필
  { id: "end_page",      depth1: "종페이지",    uvShare: 0.02, pvShare: 0.02 },
  { id: "profile_page",  depth1: "프로필 페이지", uvShare: 0.01, pvShare: 0.01 },
];

export const SEASON_QUARTERS = ["S1", "S2", "S3"] as const;
export type SeasonQuarter = typeof SEASON_QUARTERS[number];

export function makeSeasonId(year: number, q: SeasonQuarter) {
  return `${year}-${q}`;
}

export function parseSeasonId(id: string): { year: number; quarter: SeasonQuarter } | null {
  const m = id.match(/^(\d{4})-(S[123])$/);
  if (!m) return null;
  return { year: parseInt(m[1]), quarter: m[2] as SeasonQuarter };
}

export function formatSeason(id: string) {
  const p = parseSeasonId(id);
  return p ? `${p.year} ${p.quarter}` : id;
}

// 현재 연도 기준으로 선택 가능한 연도 목록 (전년~내년)
export function yearOptions() {
  const now = new Date().getFullYear();
  return [now - 1, now, now + 1];
}
