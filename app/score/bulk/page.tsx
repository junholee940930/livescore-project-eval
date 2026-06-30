"use client";
import { useEffect, useState } from "react";
import { useStore, SCORE_CATEGORIES, CategoryScore, calcWeightedScore } from "@/lib/store";
import { formatSeason } from "@/lib/data";
import { getSessionId } from "@/lib/session";

const EMPTY_SCORE = (): CategoryScore => ({
  매출가속성: 0, 사용자플랫폼화: 0, AI효율활용화: 0, 협업점수: 0,
});

export default function BulkScorePage() {
  const { projects, setScore } = useStore();
  const [sessionId, setSessionId] = useState("");
  const [scores, setScores] = useState<Record<string, CategoryScore>>({});
  const [saved, setSaved] = useState(false);
  const [filterSeason, setFilterSeason] = useState("all");

  useEffect(() => { setSessionId(getSessionId()); }, []);

  const uniqueSeasons = Array.from(new Set(projects.map((p) => p.season))).sort();
  const filtered = filterSeason === "all"
    ? projects
    : projects.filter((p) => p.season === filterSeason);

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
    const entries = Object.entries(scores).filter(([, cs]) =>
      Object.values(cs).some((v) => v > 0)
    );
    if (entries.length === 0) return alert("입력된 점수가 없습니다.");
    entries.forEach(([projectId, cs]) => setScore(projectId, sessionId, cs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #D0CECE" }}>
        <span style={{ fontWeight: 700, fontSize: "13px" }}>프로젝트 평가점수 일괄 입력</span>
        <span style={{ fontSize: "11px", color: "#AEAAAA" }}>— 무기명</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#595959" }}>시즌:</span>
          <select className="xl-input" value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)}>
            <option value="all">전체</option>
            {uniqueSeasons.map((s) => <option key={s} value={s}>{formatSeason(s)}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", padding: "6px 10px", background: "#F2F2F2", border: "1px solid #D0CECE" }}>
        <button className={`xl-btn ${saved ? "xl-btn-green" : "xl-btn-primary"}`} onClick={handleSave}>
          {saved ? "✓ 저장됨" : "익명 제출"}
        </button>
        <span style={{ fontSize: "11px", color: "#AEAAAA" }}>이름 없이 제출됩니다.</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "12px", fontSize: "11px", color: "#595959" }}>
          {SCORE_CATEGORIES.map((c) => (
            <span key={c.key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontWeight: 700, color: "#1F3864" }}>{c.label}</span>
              <span style={{ background: "#D9E1F2", padding: "0 4px", color: "#1F3864" }}>×{(c.weight * 100).toFixed(0)}%</span>
            </span>
          ))}
        </div>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#AEAAAA", border: "1px solid #D0CECE" }}>
          등록된 프로젝트가 없습니다.
        </div>
      ) : (
        <div style={{ border: "1px solid #D0CECE", overflowX: "auto" }}>
          <table className="xl-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>프로젝트 ID</th>
                <th style={{ minWidth: "180px" }}>프로젝트명</th>
                <th>PM</th>
                <th>시즌</th>
                {SCORE_CATEGORIES.map((c) => (
                  <th key={c.key} style={{ textAlign: "center", minWidth: "90px" }}>
                    {c.label}
                    <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 400 }}>×{(c.weight * 100).toFixed(0)}%</div>
                  </th>
                ))}
                <th style={{ textAlign: "right", minWidth: "80px", background: "#2F5496" }}>가중 합계</th>
                <th style={{ textAlign: "right", minWidth: "80px" }}>제출 수</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const already = sessionId ? !!p.scores[sessionId] : false;
                const draft = scores[p.id];
                const displayScore = draft ?? (already ? p.scores[sessionId] : EMPTY_SCORE());
                const weighted = Object.values(displayScore).some((v) => v > 0)
                  ? calcWeightedScore(displayScore) : null;
                const submitCount = Object.keys(p.scores).length;

                return (
                  <tr key={p.id} style={{ opacity: already ? 0.55 : 1 }}>
                    <td style={{ color: "#595959", fontFamily: "monospace", fontSize: "11px" }}>{p.excelId ?? "-"}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      {already && <div style={{ fontSize: "10px", color: "#217346" }}>제출 완료</div>}
                    </td>
                    <td>{p.pm ?? "-"}</td>
                    <td style={{ textAlign: "center" }}>{p.season}</td>
                    {SCORE_CATEGORIES.map((c) => (
                      <td key={c.key} style={{ padding: "2px 4px", textAlign: "center" }}>
                        <input
                          type="number" min={0} max={100}
                          className="xl-input"
                          style={{ width: "72px", textAlign: "right" }}
                          placeholder="0~100"
                          disabled={already}
                          value={draft ? String(draft[c.key as keyof CategoryScore]) : ""}
                          onChange={(e) => setCat(p.id, c.key as keyof CategoryScore, Number(e.target.value))}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1F3864", background: "#EEF3FA" }}>
                      {already
                        ? <span style={{ color: "#217346" }}>완료</span>
                        : weighted !== null ? weighted.toFixed(1) + "점"
                        : <span style={{ color: "#AEAAAA" }}>-</span>}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {submitCount > 0
                        ? <span style={{ color: "#217346", fontWeight: 600 }}>{submitCount}명</span>
                        : <span style={{ color: "#AEAAAA" }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: "right", fontWeight: 700, color: "#595959", border: "1px solid #D0CECE" }}>
                  합계 ({filtered.length}건)
                </td>
                {SCORE_CATEGORIES.map((c) => <td key={c.key} style={{ border: "1px solid #D0CECE" }} />)}
                <td style={{ border: "1px solid #D0CECE", background: "#EEF3FA" }} />
                <td style={{ border: "1px solid #D0CECE" }} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
