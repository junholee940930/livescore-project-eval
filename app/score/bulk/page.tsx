"use client";
import { useState } from "react";
import { useStore, SCORE_CATEGORIES, CategoryScore, calcWeightedScore } from "@/lib/store";
import { formatSeason } from "@/lib/data";
import { formatKRW } from "@/lib/calc";

const EMPTY_SCORE = (): CategoryScore => ({
  매출가속성: 0, 사용자플랫폼화: 0, AI효율활용화: 0, 협업점수: 0,
});

const CAT_COLORS = ["#3A7BD5", "#7C3AED", "#059669", "#F59E0B"];

export default function BulkScorePage() {
  const { projects, setScore } = useStore();
  const [scorerName, setScorerName] = useState("");
  const [scores, setScores] = useState<Record<string, CategoryScore>>({});
  const [saved, setSaved] = useState(false);
  const [filterSeason, setFilterSeason] = useState("all");

  const uniqueSeasons = Array.from(new Set(projects.map((p) => p.season))).sort();
  const filtered = filterSeason === "all"
    ? projects
    : projects.filter((p) => p.season === filterSeason);

  const nameKey = scorerName.trim();
  const hasName = nameKey.length > 0;

  const setCat = (projectId: string, key: keyof CategoryScore, val: number) => {
    setScores((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] ?? EMPTY_SCORE()),
        [key]: Math.min(100, Math.max(0, val)),
      },
    }));
  };

  const handleSave = () => {
    if (!hasName) return alert("이름을 먼저 입력하세요.");
    const entries = Object.entries(scores).filter(([, cs]) =>
      Object.values(cs).some((v) => v > 0)
    );
    if (entries.length === 0) return alert("입력된 점수가 없습니다.");
    entries.forEach(([projectId, cs]) => setScore(projectId, nameKey, cs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 이미 제출한 프로젝트 IDs (현재 이름 기준)
  const alreadySubmitted = new Set(
    hasName ? projects.filter((p) => !!p.scores[nameKey]).map((p) => p.id) : []
  );

  return (
    <div style={{ fontFamily: "'Malgun Gothic', '맑은 고딕', monospace" }}>

      {/* 헤더 */}
      <div style={{
        background: "#0D1117", border: "1px solid #21262D",
        padding: "12px 16px", marginBottom: "8px",
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
      }}>
        <span style={{ color: "#00D4A4", fontWeight: 700, fontSize: "13px", fontFamily: "monospace" }}>
          LPEX 평가 입력
        </span>
        <span style={{ fontSize: "11px", color: "#4B5563" }}>·</span>
        <span style={{ fontSize: "11px", color: "#6B7280" }}>같은 이름으로 재제출 시 덮어씁니다</span>

        {/* 이름 입력 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
          <span style={{ fontSize: "11px", color: "#8B949E" }}>평가자:</span>
          <input
            placeholder="이름 입력"
            value={scorerName}
            onChange={(e) => setScorerName(e.target.value)}
            style={{
              padding: "5px 10px", background: hasName ? "#0D1F3C" : "#161B22",
              border: `1px solid ${hasName ? "#3A7BD5" : "#30363D"}`,
              color: "#E6EDF3", fontSize: "12px", outline: "none", borderRadius: "2px",
              width: "120px", fontFamily: "monospace",
            }}
          />
          {hasName && (
            <span style={{ fontSize: "11px", color: "#3A7BD5", fontWeight: 700 }}>
              {alreadySubmitted.size > 0 ? `${alreadySubmitted.size}건 제출됨` : "신규"}
            </span>
          )}
        </div>

        {/* 시즌 필터 */}
        <div style={{ display: "flex", gap: "2px" }}>
          {["all", ...uniqueSeasons].map((s) => (
            <button key={s} onClick={() => setFilterSeason(s)} style={{
              padding: "4px 8px", fontSize: "11px",
              background: filterSeason === s ? "#21262D" : "transparent",
              color: filterSeason === s ? "#00D4A4" : "#6B7280",
              border: `1px solid ${filterSeason === s ? "#30363D" : "transparent"}`,
              cursor: "pointer", borderRadius: "2px",
            }}>
              {s === "all" ? "전체" : formatSeason(s)}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!hasName}
          style={{
            padding: "6px 16px", fontSize: "12px", fontWeight: 700,
            background: saved ? "#059669" : hasName ? "linear-gradient(180deg,#3A7BD5 0%,#1E40AF 100%)" : "#21262D",
            color: hasName ? "#fff" : "#4B5563",
            border: "none", cursor: hasName ? "pointer" : "default",
            borderRadius: "2px", letterSpacing: "0.04em",
          }}
        >
          {saved ? "✓ 저장됨" : "제출"}
        </button>
      </div>

      {/* 가중치 범례 */}
      <div style={{
        display: "flex", gap: "16px", padding: "7px 12px", marginBottom: "8px",
        background: "#161B22", border: "1px solid #21262D", borderRadius: "2px",
      }}>
        {SCORE_CATEGORIES.map((c, i) => (
          <span key={c.key} style={{ fontSize: "11px", color: CAT_COLORS[i], display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: CAT_COLORS[i] }} />
            {c.label}
            <span style={{ color: "#4B5563" }}>×{(c.weight * 100).toFixed(0)}%</span>
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#4B5563" }}>
          {filtered.length}개 종목
        </span>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#6B7280", border: "1px solid #21262D", background: "#0D1117" }}>
          등록된 프로젝트가 없습니다.
        </div>
      ) : (
        <div style={{ border: "1px solid #21262D", background: "#0D1117", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ background: "#161B22", color: "#8B949E", borderBottom: "1px solid #21262D" }}>
                <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, fontSize: "11px", width: "90px" }}>종목코드</th>
                <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, fontSize: "11px", minWidth: "160px" }}>프로젝트명</th>
                <th style={{ padding: "7px 10px", textAlign: "center", fontWeight: 600, fontSize: "11px", width: "60px" }}>PM</th>
                {SCORE_CATEGORIES.map((c, i) => (
                  <th key={c.key} style={{
                    padding: "7px 10px", textAlign: "center", fontWeight: 600,
                    fontSize: "11px", minWidth: "100px", color: CAT_COLORS[i],
                  }}>
                    {c.label}
                    <div style={{ fontSize: "10px", opacity: 0.7, fontWeight: 400 }}>×{(c.weight * 100).toFixed(0)}%</div>
                  </th>
                ))}
                <th style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, fontSize: "11px", width: "80px", color: "#00D4A4" }}>합계</th>
                <th style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, fontSize: "11px", width: "70px" }}>제출자</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, rowIdx) => {
                const myPrevScore = hasName ? p.scores[nameKey] : null;
                const draft = scores[p.id];
                const displayScore = draft ?? myPrevScore ?? null;
                const weighted = displayScore && Object.values(displayScore).some((v) => v > 0)
                  ? calcWeightedScore(displayScore) : null;
                const submitCount = Object.keys(p.scores).length;
                const isAlreadyMine = alreadySubmitted.has(p.id);
                const isDraft = !!draft;

                // 전체 제출자 평균 (절사 없이 단순 평균 — 표시용)
                const allScores = Object.values(p.scores);
                const avgPerCat = SCORE_CATEGORIES.map((c) =>
                  allScores.length > 0
                    ? allScores.reduce((s, cs) => s + cs[c.key as keyof CategoryScore], 0) / allScores.length
                    : null
                );

                const rowBg = rowIdx % 2 === 0 ? "#0D1117" : "#0A0E17";
                const borderColor = isDraft ? "#1C3A6B" : isAlreadyMine ? "#1A2A1A" : "#21262D";

                return (
                  <tr key={p.id} style={{
                    borderBottom: `1px solid ${borderColor}`,
                    background: isDraft ? "#0D1F3C" : isAlreadyMine ? "#0D1A0D" : rowBg,
                  }}>
                    {/* 종목코드 */}
                    <td style={{ padding: "6px 10px", color: "#4B9FEA", fontFamily: "monospace", fontSize: "11px", fontWeight: 600 }}>
                      {p.excelId ?? "-"}
                    </td>

                    {/* 프로젝트명 */}
                    <td style={{ padding: "6px 10px" }}>
                      <div style={{ fontWeight: 600, color: "#E6EDF3", fontSize: "12px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "10px", marginTop: "1px" }}>
                        {isDraft && <span style={{ color: "#3A7BD5" }}>작성 중</span>}
                        {!isDraft && isAlreadyMine && <span style={{ color: "#059669" }}>✓ 제출 완료</span>}
                        {!isDraft && !isAlreadyMine && <span style={{ color: "#4B5563" }}>미제출</span>}
                      </div>
                    </td>

                    {/* PM */}
                    <td style={{ padding: "6px 10px", textAlign: "center", color: "#8B949E", fontSize: "11px" }}>
                      {p.pm ?? "-"}
                    </td>

                    {/* 카테고리별 입력 + 분포 바 */}
                    {SCORE_CATEGORIES.map((c, ci) => {
                      const curVal = displayScore ? displayScore[c.key as keyof CategoryScore] : null;
                      const avgVal = avgPerCat[ci];
                      return (
                        <td key={c.key} style={{ padding: "4px 6px", textAlign: "center" }}>
                          {/* 입력 필드 */}
                          <input
                            type="number" min={0} max={100}
                            placeholder="0~100"
                            value={draft ? String(draft[c.key as keyof CategoryScore]) : ""}
                            onChange={(e) => setCat(p.id, c.key as keyof CategoryScore, Number(e.target.value))}
                            style={{
                              width: "68px", padding: "4px 6px", textAlign: "right",
                              background: "#0D1F3C", border: `1px solid ${CAT_COLORS[ci]}44`,
                              color: "#E6EDF3", fontSize: "12px", fontFamily: "monospace",
                              outline: "none", borderRadius: "2px", boxSizing: "border-box",
                            }}
                          />
                          {/* 현재값 + 전체 평균 미니 바 */}
                          <div style={{ marginTop: "3px", position: "relative", height: "4px", background: "#21262D", borderRadius: "2px" }}>
                            {avgVal !== null && (
                              <div style={{
                                position: "absolute", left: 0, top: 0, height: "100%",
                                width: `${avgVal}%`, background: CAT_COLORS[ci] + "55",
                                borderRadius: "2px",
                              }} />
                            )}
                            {curVal !== null && curVal > 0 && (
                              <div style={{
                                position: "absolute", left: 0, top: 0, height: "100%",
                                width: `${curVal}%`, background: CAT_COLORS[ci],
                                borderRadius: "2px",
                              }} />
                            )}
                          </div>
                          {avgVal !== null && (
                            <div style={{ fontSize: "9px", color: "#4B5563", marginTop: "1px" }}>
                              평균 {avgVal.toFixed(0)}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* 합계 */}
                    <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "monospace" }}>
                      {weighted !== null ? (
                        <div>
                          <span style={{
                            fontWeight: 700, fontSize: "13px",
                            color: weighted >= 80 ? "#00D4A4" : weighted >= 60 ? "#F59E0B" : "#F87171",
                          }}>
                            {weighted.toFixed(1)}
                          </span>
                          <span style={{ fontSize: "10px", color: "#4B5563" }}>점</span>
                        </div>
                      ) : (
                        <span style={{ color: "#30363D" }}>-</span>
                      )}
                    </td>

                    {/* 제출자 수 */}
                    <td style={{ padding: "6px 10px", textAlign: "right" }}>
                      {submitCount > 0 ? (
                        <div>
                          <span style={{ color: "#3A7BD5", fontWeight: 700, fontFamily: "monospace" }}>{submitCount}</span>
                          <span style={{ fontSize: "10px", color: "#4B5563" }}>명</span>
                        </div>
                      ) : (
                        <span style={{ color: "#30363D", fontSize: "11px" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#161B22", borderTop: "1px solid #21262D" }}>
                <td colSpan={3} style={{ padding: "6px 10px", fontSize: "11px", color: "#4B5563", fontFamily: "monospace" }}>
                  {filtered.length}개 종목 · {Object.keys(scores).filter(id => Object.values(scores[id]).some(v => v > 0)).length}건 입력됨
                </td>
                {SCORE_CATEGORIES.map((c) => <td key={c.key} />)}
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
