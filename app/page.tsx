"use client";
import { useStore } from "@/lib/store";
import { calcProject, formatKRW } from "@/lib/calc";
import { formatSeason } from "@/lib/data";
import Link from "next/link";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  "예정": "bg-gray-100 text-gray-600",
  "기획": "bg-blue-100 text-blue-700",
  "진행": "bg-yellow-100 text-yellow-700",
  "완료": "bg-green-100 text-green-700",
};

export default function Dashboard() {
  const { projects: allProjects, settings, deleteProject } = useStore();
  const SKIP_NAMES = ["총계", "합계", "소계"];
  const projects = allProjects.filter(
    (p) => !SKIP_NAMES.some((s) => p.name.trim() === s)
  );
  const [seasonFilter, setSeasonFilter] = useState("전체");
  const [guideOpen, setGuideOpen] = useState(true);

  const uniqueSeasons = Array.from(new Set(projects.map((p) => p.season))).sort();
  const filtered = seasonFilter === "전체"
    ? projects
    : projects.filter((p) => p.season === seasonFilter);

  // 요약 통계
  const totalProjects = projects.length;
  const totalCollaborators = new Set(projects.flatMap((p) => p.collaborators.map((c) => c.id))).size;
  const totalSkillValue = projects.reduce((sum, p) => sum + (p.skillValueTotal ?? 0), 0);
  const allResults = projects.map((p) => calcProject(p, settings));
  const totalEvalAmount = allResults.reduce((sum, r) => sum + r.final, 0);

  return (
    <div className="space-y-4">

      {/* 평가 절차 안내 */}
      <div style={{ border: "1px solid #4472C4", background: guideOpen ? "#F7F9FF" : undefined }}>
        <button
          onClick={() => setGuideOpen((v) => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "#4472C4", color: "white", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <span style={{ fontWeight: 700, fontSize: "12px" }}>📋 LIVE스코어 프로젝트 평가 절차 안내</span>
          <span style={{ fontSize: "11px", opacity: 0.8 }}>{guideOpen ? "▲ 접기" : "▼ 펼치기"}</span>
        </button>
        {guideOpen && (
          <div style={{ padding: "12px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
              {[
                {
                  step: "STEP 1",
                  title: "프로젝트 등록",
                  desc: "엑셀 업로드 또는 직접 등록으로 평가 대상 프로젝트를 등록합니다.",
                  sub: "년도·시즌 선택 → AI 화면 자동 매칭",
                  color: "#4472C4",
                  link: "/upload",
                  linkLabel: "엑셀 업로드 →",
                },
                {
                  step: "STEP 2",
                  title: "화면 매칭 확인",
                  desc: "각 프로젝트가 앱의 어느 화면에 기여하는지 PV/UV 점유율을 확인합니다.",
                  sub: "프로젝트 상세 → 적용 화면 패널",
                  color: "#4472C4",
                  link: null,
                  linkLabel: null,
                },
                {
                  step: "STEP 3",
                  title: "평가점수 입력",
                  desc: "전 직원이 무기명으로 프로젝트별 4개 항목 점수를 입력합니다.",
                  sub: "매출가속성 40% · 플랫폼화 20% · AI효율 30% · 협업 10%",
                  color: "#8B5CF6",
                  link: "/score/bulk",
                  linkLabel: "점수 입력 →",
                },
                {
                  step: "STEP 4",
                  title: "임원 상수 조정",
                  desc: "임원이 최종 평가금에 가감할 상수를 프로젝트별로 입력합니다.",
                  sub: "1차 조정(점수 반영) 후 2차 조정",
                  color: "#217346",
                  link: null,
                  linkLabel: null,
                },
                {
                  step: "STEP 5",
                  title: "최종 평가금 확정",
                  desc: "매출기여 합계 × 평가점수 + 임원 상수 = 최종 평가금이 자동 산출됩니다.",
                  sub: "대시보드에서 전체 확인",
                  color: "#185430",
                  link: null,
                  linkLabel: null,
                },
              ].map((s, i) => (
                <div key={i} style={{ border: `1px solid ${s.color}30`, background: "white", padding: "10px 12px", position: "relative" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: s.color, marginBottom: "4px", letterSpacing: "0.05em" }}>{s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "6px", color: "#1F3864" }}>{s.title}</div>
                  <div style={{ fontSize: "11px", color: "#595959", lineHeight: 1.5, marginBottom: "6px" }}>{s.desc}</div>
                  <div style={{ fontSize: "10px", color: "#AEAAAA", borderTop: `1px solid ${s.color}20`, paddingTop: "5px" }}>{s.sub}</div>
                  {s.link && (
                    <Link href={s.link} style={{ display: "inline-block", marginTop: "8px", fontSize: "11px", color: s.color, fontWeight: 600, textDecoration: "none" }}>
                      {s.linkLabel}
                    </Link>
                  )}
                  {/* 화살표 */}
                  {i < 4 && (
                    <div style={{ position: "absolute", right: "-13px", top: "50%", transform: "translateY(-50%)", color: "#D0CECE", fontSize: "16px", zIndex: 1 }}>▶</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "8px", padding: "6px 10px", background: "#FFF9E6", border: "1px solid #FFD966", fontSize: "11px", color: "#595959" }}>
              💡 <strong>절사평균 적용:</strong> 평가자 3명 이상일 경우 최고점·최저점 각 1개를 제외한 평균으로 산정합니다. &nbsp;|&nbsp;
              <strong>시즌:</strong> S1 (1~4월) · S2 (5~8월) · S3 (9~12월) · 각 시즌 매출 = 연간 매출 ÷ 3
            </div>
          </div>
        )}
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">프로젝트 평가 대시보드</h1>
        <div className="flex gap-2">
          <Link href="/upload" className="border border-gray-300 text-gray-600 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
            엑셀 업로드
          </Link>
          <Link href="/projects/new" className="border border-blue-600 bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700">
            + 프로젝트 등록
          </Link>
        </div>
      </div>

      {/* 요약 행 — 엑셀 합계행 스타일 */}
      <div className="bg-[#E2EFDA] border border-[#A9C96A] grid grid-cols-4 divide-x divide-[#A9C96A]">
        <SumCell label="등록 프로젝트" value={`${totalProjects}개`} />
        <SumCell label="전체 협업자" value={`${totalCollaborators}명`} />
        <SumCell label="총 스킬값 투자" value={formatKRW(totalSkillValue)} />
        <SumCell label="총 평가금 합계" value={formatKRW(Math.round(totalEvalAmount))} highlight />
      </div>

      {/* 시즌 필터 탭 */}
      <div className="flex gap-0 border-b border-gray-300 flex-wrap">
        {["전체", ...uniqueSeasons].map((s) => (
          <button
            key={s}
            onClick={() => setSeasonFilter(s)}
            className={`px-4 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              seasonFilter === s
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "전체" ? "전체" : formatSeason(s)}
            {s !== "전체" && (
              <span className="ml-1 text-gray-400">
                ({projects.filter((p) => p.season === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-400 border border-gray-200">
          등록된 프로젝트가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-300">
          <table className="w-full text-xs border-collapse" style={{ fontFamily: "'맑은 고딕', 'Malgun Gothic', sans-serif" }}>
            <thead>
              <tr className="bg-[#4472C4] text-white">
                <Th>프로젝트 ID</Th>
                <Th wide>프로젝트명</Th>
                <Th>시즌</Th>
                <Th>상태</Th>
                <Th>진행률(%)</Th>
                <Th>PM명</Th>
                <Th>참여인원수</Th>
                <Th>스킬값 합계</Th>
                <Th>매출기여 합계</Th>
                <Th>평가점수</Th>
                <Th>1차 조정</Th>
                <Th>임원 상수</Th>
                <Th highlight>최종 평가금</Th>
                <Th>액션</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project, i) => {
                const result = calcProject(project, settings);
                const scoreCount = Object.keys(project.scores).length;
                const seasonLabel = formatSeason(project.season);
                return (
                  <tr
                    key={project.id}
                    className={`border-b border-gray-200 hover:bg-[#EBF3FB] ${i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}`}
                  >
                    <Td mono>{project.excelId ?? "-"}</Td>
                    <Td wide>
                      <span className="font-medium text-gray-800">{project.name}</span>
                    </Td>
                    <Td center>{seasonLabel}</Td>
                    <Td center>
                      {project.status ? (
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {project.status}
                        </span>
                      ) : "-"}
                    </Td>
                    <Td right>
                      {project.progress != null ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="w-16 bg-gray-200 h-1.5">
                            <div className="bg-blue-500 h-1.5" style={{ width: `${Math.min(100, project.progress)}%` }} />
                          </div>
                          <span>{project.progress}%</span>
                        </div>
                      ) : "-"}
                    </Td>
                    <Td>{project.pm ?? "-"}</Td>
                    <Td right>{project.collaborators.length}명</Td>
                    <Td right mono>{formatKRW(project.skillValueTotal ?? 0)}</Td>
                    <Td right mono>{formatKRW(Math.round(result.totalBase))}</Td>
                    <Td right>
                      <span className={scoreCount === 0 ? "text-gray-300" : "text-gray-700"}>
                        {result.avgScore.toFixed(1)}점
                        {scoreCount > 0 && <span className="text-gray-400 ml-1">({scoreCount}명)</span>}
                      </span>
                    </Td>
                    <Td right mono>{formatKRW(Math.round(result.afterScore))}</Td>
                    <Td right mono>
                      <span className={result.executiveAdj >= 0 ? "text-blue-600" : "text-red-500"}>
                        {result.executiveAdj !== 0 ? `${result.executiveAdj >= 0 ? "+" : ""}${formatKRW(result.executiveAdj)}` : "-"}
                      </span>
                    </Td>
                    <Td right mono highlight>
                      <span className="font-bold text-blue-700">{formatKRW(Math.round(result.final))}</span>
                    </Td>
                    <Td center>
                      <div className="flex gap-2 justify-center">
                        <Link href={`/projects/${project.id}`} className="text-blue-500 hover:underline">상세</Link>
                        <Link href={`/projects/${project.id}/executive`} className="text-gray-400 hover:underline">조정</Link>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
            {/* 합계 행 */}
            <tfoot>
              <tr className="bg-[#D9E1F2] border-t-2 border-[#4472C4] font-bold">
                <Td colSpan={7} center><span className="text-gray-600">합계 ({filtered.length}건)</span></Td>
                <Td right mono>
                  {formatKRW(filtered.reduce((s, p) => s + (p.skillValueTotal ?? 0), 0))}
                </Td>
                <Td right mono>
                  {formatKRW(Math.round(filtered.reduce((s, p) => s + calcProject(p, settings).totalBase, 0)))}
                </Td>
                <Td />
                <Td right mono>
                  {formatKRW(Math.round(filtered.reduce((s, p) => s + calcProject(p, settings).afterScore, 0)))}
                </Td>
                <Td />
                <Td right mono highlight>
                  <span className="text-blue-700">
                    {formatKRW(Math.round(filtered.reduce((s, p) => s + calcProject(p, settings).final, 0)))}
                  </span>
                </Td>
                <Td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function SumCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`px-4 py-2 ${highlight ? "bg-[#C6EFCE] text-[#276221]" : ""}`}>
      <p className="text-[10px] text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function Th({ children, wide, highlight }: { children?: React.ReactNode; wide?: boolean; highlight?: boolean }) {
  return (
    <th
      className={`px-2 py-2 text-left font-semibold border-r border-[#3567C0] last:border-r-0 whitespace-nowrap ${wide ? "min-w-[200px]" : ""} ${highlight ? "bg-[#2F5496]" : ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children, wide, right, center, mono, highlight, colSpan,
}: {
  children?: React.ReactNode;
  wide?: boolean;
  right?: boolean;
  center?: boolean;
  mono?: boolean;
  highlight?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-2 py-1.5 border-r border-gray-200 last:border-r-0 ${wide ? "min-w-[200px]" : ""} ${right ? "text-right" : center ? "text-center" : ""} ${mono ? "font-mono tabular-nums" : ""} ${highlight ? "bg-[#EEF3FA]" : ""}`}
    >
      {children}
    </td>
  );
}
