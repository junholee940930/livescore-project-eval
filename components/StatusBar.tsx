"use client";
import { useStore } from "@/lib/store";
import { calcProject, formatKRW } from "@/lib/calc";

export default function StatusBar() {
  const { projects, settings } = useStore();
  const results = projects.map((p) => calcProject(p, settings));
  const total = results.reduce((s, r) => s + r.final, 0);
  const avg = results.length > 0
    ? results.reduce((s, r) => s + r.avgScore, 0) / results.length
    : 0;

  return (
    <div style={{
      background: "#217346",
      color: "white",
      fontSize: "14px",
      fontFamily: "'Malgun Gothic', '맑은 고딕', Arial, sans-serif",
      padding: "2px 16px",
      display: "flex",
      alignItems: "center",
      gap: "24px",
      userSelect: "none",
    }}>
      <span>준비</span>
      <span style={{ marginLeft: "auto" }}>
        프로젝트: {projects.length}개
      </span>
      <span>평균 평가점수: {avg.toFixed(1)}점</span>
      <span>총 평가금: {formatKRW(Math.round(total))}</span>
    </div>
  );
}
