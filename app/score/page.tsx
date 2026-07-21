"use client";
import { useEffect, useState } from "react";
import { useStore, SCORE_CATEGORIES, CategoryScore, calcWeightedScore } from "@/lib/store";
import { getSessionId } from "@/lib/session";

const EMPTY_SCORE = (): CategoryScore => ({
  매출가속성: 0, 사용자플랫폼화: 0, AI효율활용화: 0, 협업점수: 0,
});

export default function ScorePage() {
  const { projects, setScore } = useStore();
  const [sessionId, setSessionId] = useState("");
  const [scores, setScores] = useState<Record<string, CategoryScore>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { setSessionId(getSessionId()); }, []);

  const alreadySubmitted = (projectId: string) =>
    !!projects.find((p) => p.id === projectId)?.scores[sessionId];

  const setCat = (projectId: string, key: keyof CategoryScore, val: number) => {
    setScores((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] ?? EMPTY_SCORE()),
        [key]: Math.min(100, Math.max(0, val)),
      },
    }));
  };

  const handleSubmit = () => {
    const entries = Object.entries(scores).filter(([, cs]) =>
      Object.values(cs).some((v) => v > 0)
    );
    if (entries.length === 0) return alert("입력된 점수가 없습니다.");
    entries.forEach(([projectId, cs]) => setScore(projectId, sessionId, cs));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "22px", color: "#217346", fontWeight: 700, marginBottom: "8px" }}>✓ 제출 완료!</div>
        <div style={{ color: "#595959" }}>익명으로 점수가 제출되었습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #D0CECE" }}>
        프로젝트 평가점수 입력
        <span style={{ fontWeight: 400, fontSize: "14px", color: "#AEAAAA", marginLeft: "8px" }}>— 무기명</span>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        {SCORE_CATEGORIES.map((c) => (
          <div key={c.key} style={{ flex: 1, background: "#D9E1F2", border: "1px solid #AEAAAA", padding: "4px 8px", textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#1F3864" }}>{c.label}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#4472C4" }}>{(c.weight * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#AEAAAA", border: "1px solid #D0CECE" }}>
          등록된 프로젝트가 없습니다.
        </div>
      ) : (
        <div style={{ border: "1px solid #D0CECE" }}>
          <table className="xl-table">
            <thead>
              <tr>
                <th style={{ minWidth: "180px" }}>프로젝트명</th>
                {SCORE_CATEGORIES.map((c) => (
                  <th key={c.key} style={{ textAlign: "center", width: "90px" }}>
                    {c.label}<br />
                    <span style={{ fontSize: "14px", fontWeight: 400, opacity: 0.8 }}>×{(c.weight * 100).toFixed(0)}%</span>
                  </th>
                ))}
                <th style={{ textAlign: "right", width: "80px", background: "#2F5496" }}>가중 합계</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const draft = scores[p.id] ?? EMPTY_SCORE();
                const already = sessionId ? alreadySubmitted(p.id) : false;
                const weighted = Object.values(draft).some((v) => v > 0)
                  ? calcWeightedScore(draft) : null;
                return (
                  <tr key={p.id} style={{ opacity: already ? 0.55 : 1 }}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: "14px", color: "#AEAAAA" }}>
                        {p.season}{already && <span style={{ color: "#217346", marginLeft: "4px" }}>· 제출 완료</span>}
                      </div>
                    </td>
                    {SCORE_CATEGORIES.map((c) => (
                      <td key={c.key} style={{ padding: "2px 4px", textAlign: "center" }}>
                        <input
                          type="number" min={0} max={100}
                          className="xl-input"
                          style={{ width: "72px", textAlign: "right" }}
                          placeholder="0~100"
                          disabled={already}
                          value={draft[c.key as keyof CategoryScore] || ""}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
        <button className="xl-btn xl-btn-primary" onClick={handleSubmit} disabled={projects.length === 0}>
          익명 제출
        </button>
        <span style={{ fontSize: "14px", color: "#AEAAAA" }}>이름 없이 제출됩니다.</span>
      </div>
    </div>
  );
}
