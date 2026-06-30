"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { SCREENS, SEASON_QUARTERS, makeSeasonId, yearOptions } from "@/lib/data";
import { v4 as uuid } from "uuid";

const depth1Groups = Array.from(new Set(SCREENS.map((s) => s.depth1)));

export default function NewProject() {
  const router = useRouter();
  const { addProject } = useStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());
  const [seasonQ, setSeasonQ] = useState<"S1"|"S2"|"S3">("S1");
  const season = makeSeasonId(seasonYear, seasonQ);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickCount, setPickCount] = useState(0);
  const [giftCount, setGiftCount] = useState(0);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState("");

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleAutoMatch = async () => {
    if (!name.trim() && !description.trim()) return alert("프로젝트 이름 또는 설명을 입력해주세요.");
    setMatching(true);
    setMatchError("");
    try {
      const res = await fetch("/api/match-screens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "매칭 실패");
      setSelectedIds(data.screenIds);
    } catch (e: unknown) {
      setMatchError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setMatching(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return alert("프로젝트 이름을 입력해주세요.");
    if (selectedIds.length === 0) return alert("적용 화면을 1개 이상 선택해주세요.");
    addProject({
      id: uuid(),
      name: name.trim(),
      description: description.trim(),
      season,
      collaborators: [],
      screenIds: selectedIds,
      pickCount,
      giftCount,
      scores: {},
      executiveAdj: 0,
    });
    router.push("/");
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #D0CECE" }}>
        프로젝트 등록
      </div>

      <table className="xl-table" style={{ marginBottom: "10px" }}>
        <colgroup>
          <col style={{ width: "160px" }} />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ background: "#F2F2F2", fontWeight: 600, border: "1px solid #D0CECE" }}>프로젝트명 *</td>
            <td style={{ border: "1px solid #D0CECE", padding: "4px 8px" }}>
              <input
                className="xl-input"
                style={{ width: "100%" }}
                placeholder="예: 비교분석 UI 개선"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </td>
          </tr>
          <tr>
            <td style={{ background: "#F2F2F2", fontWeight: 600, border: "1px solid #D0CECE", verticalAlign: "top", paddingTop: "8px" }}>프로젝트 설명</td>
            <td style={{ border: "1px solid #D0CECE", padding: "4px 8px" }}>
              <textarea
                className="xl-input"
                style={{ width: "100%", height: "80px", resize: "vertical" }}
                placeholder="어떤 화면을 개선하는 프로젝트인지 자유롭게 설명해주세요."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <button className="xl-btn" onClick={handleAutoMatch} disabled={matching}>
                  {matching ? "AI 분석 중..." : "✨ AI로 화면 자동 매칭"}
                </button>
                {matchError && <span style={{ color: "#C00000", fontSize: "11px" }}>{matchError}</span>}
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ background: "#F2F2F2", fontWeight: 600, border: "1px solid #D0CECE" }}>시즌</td>
            <td style={{ border: "1px solid #D0CECE", padding: "4px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <select
                  className="xl-input"
                  value={seasonYear}
                  onChange={(e) => setSeasonYear(Number(e.target.value))}
                  style={{ width: "80px" }}
                >
                  {yearOptions().map((y) => <option key={y} value={y}>{y}년</option>)}
                </select>
                <div style={{ display: "flex", gap: "4px" }}>
                  {SEASON_QUARTERS.map((q) => (
                    <button
                      key={q}
                      className="xl-btn"
                      onClick={() => setSeasonQ(q)}
                      style={seasonQ === q ? { background: "#4472C4", color: "white", borderColor: "#2F5496", fontWeight: 700 } : {}}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: "#595959" }}>→ {season}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ background: "#F2F2F2", fontWeight: 600, border: "1px solid #D0CECE" }}>픽 구매 건수</td>
            <td style={{ border: "1px solid #D0CECE", padding: "4px 8px" }}>
              <input type="number" min={0} className="xl-input" style={{ width: "120px", textAlign: "right" }}
                value={pickCount} onChange={(e) => setPickCount(Number(e.target.value))} />
              <span style={{ marginLeft: "6px", color: "#595959", fontSize: "11px" }}>건 (시즌 내)</span>
            </td>
          </tr>
          <tr>
            <td style={{ background: "#F2F2F2", fontWeight: 600, border: "1px solid #D0CECE" }}>선물 건수</td>
            <td style={{ border: "1px solid #D0CECE", padding: "4px 8px" }}>
              <input type="number" min={0} className="xl-input" style={{ width: "120px", textAlign: "right" }}
                value={giftCount} onChange={(e) => setGiftCount(Number(e.target.value))} />
              <span style={{ marginLeft: "6px", color: "#AEAAAA", fontSize: "11px" }}>미정 화면 — 추후 입력</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 화면 선택 */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "12px" }}>
            적용 화면 선택 *
            {selectedIds.length > 0 && <span style={{ color: "#4472C4", marginLeft: "8px", fontWeight: 400 }}>{selectedIds.length}개 선택됨</span>}
          </span>
          {selectedIds.length > 0 && (
            <button className="xl-btn" style={{ fontSize: "11px", padding: "2px 8px" }} onClick={() => setSelectedIds([])}>전체 해제</button>
          )}
        </div>

        <div style={{ border: "1px solid #D0CECE", maxHeight: "360px", overflowY: "auto" }}>
          {depth1Groups.map((d1) => {
            const screens = SCREENS.filter((s) => s.depth1 === d1);
            const checkedCount = screens.filter((s) => selectedIds.includes(s.id)).length;
            return (
              <div key={d1}>
                <div style={{ background: "#D9E1F2", padding: "3px 8px", fontWeight: 700, fontSize: "11px", color: "#1F3864", borderBottom: "1px solid #D0CECE", display: "flex", justifyContent: "space-between" }}>
                  <span>{d1}</span>
                  {checkedCount > 0 && <span style={{ color: "#4472C4" }}>{checkedCount}/{screens.length}</span>}
                </div>
                {screens.map((s) => {
                  const label = [s.depth2, s.depth3].filter(Boolean).join(" > ") || s.depth1;
                  const checked = selectedIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "3px 12px",
                        cursor: "pointer",
                        background: checked ? "#DDEEFF" : "transparent",
                        borderBottom: "1px solid #F0F0F0",
                        fontSize: "12px",
                      }}
                      onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLLabelElement).style.background = "#F5F5F5"; }}
                      onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLLabelElement).style.background = "transparent"; }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggle(s.id)} style={{ accentColor: "#4472C4" }} />
                      <span>{label}</span>
                      {s.hasPick && <span style={{ fontSize: "10px", background: "#E2EFDA", color: "#217346", padding: "1px 4px", border: "1px solid #A9C96A" }}>픽</span>}
                      <span style={{ marginLeft: "auto", color: "#AEAAAA", fontSize: "11px", fontFamily: "monospace" }}>PV {(s.pvShare * 100).toFixed(1)}%</span>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        <button className="xl-btn xl-btn-primary" onClick={handleSubmit}>등록하기</button>
        <button className="xl-btn" onClick={() => router.push("/")}>취소</button>
      </div>
    </div>
  );
}
