"use client";
import { useStore } from "@/lib/store";
import { formatKRW } from "@/lib/calc";
import { calcMarket } from "@/lib/market";
import { formatSeason } from "@/lib/data";
import { generatePriceHistory, getSparklinePoints, todayPrice } from "@/lib/stock";
import Link from "next/link";
import { useMemo, useState } from "react";

const UP_COLOR = "#E53935";
const DN_COLOR = "#1565C0";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "예정": { bg: "#1C2A3A", text: "#6B7280" },
  "기획": { bg: "#1A2744", text: "#3A7BD5" },
  "진행": { bg: "#1A2A1A", text: "#00D4A4" },
  "완료": { bg: "#1F2A10", text: "#86EFAC" },
};

export default function MarketDashboard() {
  const { projects: allProjects, settings, deleteProject } = useStore();
  const SKIP_NAMES = ["총계", "합계", "소계"];
  const projects = allProjects.filter(
    (p) => !SKIP_NAMES.some((s) => p.name.trim() === s)
  );
  const [seasonFilter, setSeasonFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<"전체" | "상승" | "하락" | "상한가">("전체");
  const [sortBy, setSortBy] = useState<"price" | "change">("price");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const todayStr = new Date().toISOString().slice(0, 10);
  const uniqueSeasons = Array.from(new Set(projects.map((p) => p.season))).sort();

  // 전사 시장 계산 (제로섬 정규화) — 모든 프로젝트 대상
  const market = useMemo(() => calcMarket(projects, settings), [projects, settings]);

  const q = searchQuery.trim().toLowerCase();
  const filtered = projects.filter((p) => {
    const matchSeason = seasonFilter === "전체" || p.season === seasonFilter;
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.pm ?? "").toLowerCase().includes(q) ||
      (p.excelId ?? "").toLowerCase().includes(q);
    return matchSeason && matchSearch;
  });

  // quickFilter는 rows 계산 후 적용 (changePct 필요)


  // 각 프로젝트 계산 + 주가 생성
  const rows = filtered.map((project) => {
    const mr = market.get(project.id);
    const result = mr?.result ?? { avgScore: 0, progressMultiplier: 0.5, statusPremium: 1, stockPrice: 0, rawWeight: 0, final: 0 } as never;
    const stockPrice = mr?.stockPrice ?? 0;
    const history = generatePriceHistory(project.id, stockPrice, 30, todayStr);
    const today = todayPrice(history);
    return { project, result, history, today, stockPrice };
  });

  // 정렬
  const sorted = [...rows].sort((a, b) => {
    let va = 0, vb = 0;
    if (sortBy === "price") { va = a.today?.price ?? 0; vb = b.today?.price ?? 0; }
    else if (sortBy === "change") { va = a.today?.changePct ?? 0; vb = b.today?.changePct ?? 0; }
    return sortDir === "desc" ? vb - va : va - vb;
  });

  // quickFilter 적용
  const quickFiltered = sorted.filter((r) => {
    const pct = r.today?.changePct ?? 0;
    if (quickFilter === "상승") return pct > 0;
    if (quickFilter === "하락") return pct < 0;
    if (quickFilter === "상한가") return pct >= 15;
    return true;
  });

  // 시장 요약 — 전체 시총은 모든 프로젝트의 정규화 stockPrice 합 (= Σ final)
  const totalMarketCap = rows.reduce((s, r) => s + r.stockPrice, 0);
  const risingCount = rows.filter((r) => (r.today?.changePct ?? 0) > 0).length;
  const fallingCount = rows.filter((r) => (r.today?.changePct ?? 0) < 0).length;
  const topGainer = [...rows].sort((a, b) => (b.today?.changePct ?? 0) - (a.today?.changePct ?? 0))[0];
  const topLoser = [...rows].sort((a, b) => (a.today?.changePct ?? 0) - (b.today?.changePct ?? 0))[0];

  function toggleSort(col: "price" | "change") {
    if (sortBy === col) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  const arrow = (col: "price" | "change") =>
    sortBy === col ? (sortDir === "desc" ? " ▼" : " ▲") : "";

  return (
    <div style={{ fontFamily: "'Malgun Gothic', '맑은 고딕', monospace" }}>

      {/* ── 시장 요약 패널 ── */}
      <div style={{
        background: "#0D1117",
        border: "1px solid #21262D",
        borderRadius: "0",
        padding: "12px 16px",
        marginBottom: "8px",
        color: "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{ color: "#00D4A4", fontWeight: 700, fontSize: "13px", fontFamily: "monospace" }}>LPEX 시장현황</span>
          <span style={{ fontSize: "11px", color: "#4B5563" }}>·</span>
          <span style={{ fontSize: "11px", color: "#6B7280" }}>오늘 기준 시뮬레이션 주가</span>
          <span className="live-dot" style={{ marginLeft: "auto", fontSize: "11px", color: "#00D4A4", fontFamily: "monospace" }}>● 실시간</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          <MarketCard label="총 시가총액" value={formatKRW(Math.round(totalMarketCap))} color="#00D4A4" />
          <MarketCard label="상장 종목" value={`${rows.length}개`} color="#3A7BD5" />
          <MarketCard label="상승 / 하락" value={`${risingCount} / ${fallingCount}`} color={risingCount >= fallingCount ? "#D32F2F" : "#1565C0"} />
          <MarketCard
            label="상한가 종목"
            value={topGainer ? topGainer.project.name : "-"}
            sub={topGainer ? `+${(topGainer.today?.changePct ?? 0).toFixed(2)}%` : ""}
            color="#D32F2F"
          />
          <MarketCard
            label="하한가 종목"
            value={topLoser ? topLoser.project.name : "-"}
            sub={topLoser ? `${(topLoser.today?.changePct ?? 0).toFixed(2)}%` : ""}
            color="#1565C0"
          />
        </div>
      </div>

      {/* ── 툴바: 검색 + 퀵필터 + 액션 ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", background: "#fff", border: "1px solid #D1D5DB", padding: "6px 10px" }}>
        {/* 검색 */}
        <div style={{ position: "relative", flex: "0 0 220px" }}>
          <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "12px", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="종목명 · PM · 코드"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "5px 24px 5px 26px",
              fontSize: "12px",
              border: "1px solid #D1D5DB",
              borderRadius: "0",
              outline: "none",
              fontFamily: "'Malgun Gothic', '맑은 고딕', monospace",
              boxSizing: "border-box",
              background: "#FAFAFA",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "12px", padding: 0 }}>✕</button>
          )}
        </div>

        {/* 퀵필터 버튼 */}
        <div style={{ display: "flex", gap: "2px" }}>
          {(["전체", "상승", "하락", "상한가"] as const).map((f) => {
            const active = quickFilter === f;
            const btnColor = f === "상승" ? UP_COLOR : f === "하락" ? DN_COLOR : f === "상한가" ? "#7B1FA2" : "#374151";
            return (
              <button key={f} onClick={() => setQuickFilter(f)} style={{
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: active ? 700 : 400,
                background: active ? btnColor : "#F3F4F6",
                color: active ? "#fff" : btnColor,
                border: `1px solid ${active ? btnColor : "#D1D5DB"}`,
                borderRadius: "0",
                cursor: "pointer",
                fontFamily: "monospace",
              }}>{f}</button>
            );
          })}
        </div>

        {/* 시즌 필터 */}
        <div style={{ display: "flex", gap: "2px", marginLeft: "4px" }}>
          {["전체", ...uniqueSeasons].map((s) => (
            <button key={s} onClick={() => setSeasonFilter(s)} style={{
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: seasonFilter === s ? 700 : 400,
              background: seasonFilter === s ? "#0D1117" : "#F3F4F6",
              color: seasonFilter === s ? "#00D4A4" : "#6B7280",
              border: `1px solid ${seasonFilter === s ? "#0D1117" : "#D1D5DB"}`,
              borderRadius: "0",
              cursor: "pointer",
            }}>
              {s === "전체" ? "전체" : formatSeason(s)}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <Link href="/upload" style={{ padding: "5px 10px", fontSize: "11px", border: "1px solid #D1D5DB", background: "#F9FAFB", color: "#374151", textDecoration: "none", borderRadius: "0" }}>
            종목 업로드
          </Link>
          <Link href="/projects/new" style={{ padding: "5px 10px", fontSize: "11px", border: "1px solid #0D1117", background: "#0D1117", color: "#00D4A4", textDecoration: "none", borderRadius: "0", fontWeight: 700 }}>
            + 종목 등록
          </Link>
        </div>
      </div>

      {/* ── 주식 테이블 ── */}
      {quickFiltered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#9CA3AF", border: "1px dashed #D1D5DB", background: "#fff" }}>
          {searchQuery ? `"${searchQuery}" 검색 결과가 없습니다.` : "등록된 종목이 없습니다."}
        </div>
      ) : (
        <div style={{ border: "1px solid #D1D5DB", borderRadius: "0", overflow: "hidden", background: "white" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ background: "#0D1117", color: "#8B949E" }}>
                <Th style={{ width: "60px" }}>종목코드</Th>
                <Th style={{ minWidth: "180px", textAlign: "left" }}>프로젝트명</Th>
                <Th style={{ width: "60px" }}>상태</Th>
                <ThSort label="현재가" col="price" cur={sortBy} dir={sortDir} onClick={toggleSort} arrow={arrow} />
                <ThSort label="등락(원)" col="change" cur={sortBy} dir={sortDir} onClick={toggleSort} arrow={arrow} />
                <ThSort label="등락률" col="change" cur={sortBy} dir={sortDir} onClick={toggleSort} arrow={arrow} style={{ width: "70px" }} />
                <Th style={{ width: "90px" }}>30일 차트</Th>
                <Th style={{ width: "80px" }}>액션</Th>
              </tr>
            </thead>
            <tbody>
              {quickFiltered.map(({ project, result, history, today }, i) => {
                const sparkPoints = getSparklinePoints(history, 80, 24);
                const changePct = today?.changePct ?? 0;
                const isUp = changePct > 0;
                const isDown = changePct < 0;
                const color = isUp ? UP_COLOR : isDown ? DN_COLOR : "#0F172A";
                const rowBg = isUp ? "#FFF5F5" : isDown ? "#F0F7FF" : (i % 2 === 0 ? "#FFFFFF" : "#FAFBFC");
                const rowBgHover = isUp ? "#FFEBEE" : isDown ? "#E3F2FD" : "#EFF6FF";
                return (
                  <tr
                    key={project.id}
                    style={{ borderBottom: "1px solid #E5E7EB", background: rowBg, height: "28px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = rowBgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                  >
                    {/* 종목코드 */}
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <Link href={`/projects/${project.id}`} style={{ fontFamily: "monospace", color: "#4B9FEA", fontSize: "11px", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid #4B9FEA44" }}>
                        {project.excelId ?? `P${String(i + 1).padStart(3, "0")}`}
                      </Link>
                    </td>

                    {/* 프로젝트명 */}
                    <td style={{ padding: "4px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                        <span style={{ fontWeight: 600, color: "#0F172A", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>{project.name}</span>
                        {project.pm && <span style={{ fontSize: "10px", color: "#94A3B8", whiteSpace: "nowrap", flexShrink: 0 }}>· {project.pm}</span>}
                      </div>
                      <span style={{ fontSize: "10px", background: "#E2E8F0", color: "#475569", padding: "0 4px", fontFamily: "monospace", fontWeight: 600 }}>
                        {formatSeason(project.season)}
                      </span>
                    </td>

                    {/* 상태 */}
                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: STATUS_COLORS[project.status ?? ""]?.text ?? "#6B7280" }}>
                        {project.status || "-"}
                      </span>
                    </td>

                    {/* 현재가 — 색반전 박스 */}
                    <td style={{ padding: "4px 6px", textAlign: "right", fontFamily: "monospace" }}>
                      {today ? (
                        <span style={{
                          display: "inline-block",
                          background: color,
                          color: "#fff",
                          padding: "1px 6px",
                          fontWeight: 700,
                          fontSize: "12px",
                          minWidth: "70px",
                          textAlign: "right",
                        }}>{formatKRW(today.price)}</span>
                      ) : <span style={{ color: "#9CA3AF" }}>-</span>}
                    </td>

                    {/* 등락(원) */}
                    <td style={{ padding: "4px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "11px", color, fontWeight: 600 }}>
                      {today ? (isUp ? "▲" : isDown ? "▼" : "") + (today.change >= 0 ? "+" : "") + today.change.toLocaleString("ko-KR") : "-"}
                    </td>

                    {/* 등락률 */}
                    <td style={{ padding: "4px 6px", textAlign: "center" }}>
                      {today ? (
                        <span style={{ color, fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>
                          {Math.abs(today.changePct).toFixed(2)}%
                        </span>
                      ) : "-"}
                    </td>

                    {/* 30일 차트 */}
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      {sparkPoints ? (
                        <svg width="80" height="22" style={{ display: "block", margin: "0 auto" }}>
                          <polyline points={sparkPoints} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                      ) : "-"}
                    </td>

                    {/* 액션 */}
                    <td style={{ padding: "4px 4px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
                        <Link href={`/projects/${project.id}`} style={{ fontSize: "11px", color: "#4B9FEA", textDecoration: "none", fontWeight: 600 }}>
                          상세
                        </Link>
                        <button
                          onClick={() => { if (confirm(`"${project.name}"을(를) 상장 폐지합니까?`)) deleteProject(project.id); }}
                          style={{ fontSize: "10px", color: "#F87171", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          상폐
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* 합계 행 */}
            <tfoot>
              <tr style={{ background: "#0D1117", color: "#6B7280" }}>
                <td colSpan={3} style={{ padding: "5px 10px", fontSize: "11px", fontFamily: "monospace" }}>
                  {quickFiltered.length}개 종목 표시 / 전체 {rows.length}개
                </td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function MarketCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: "4px", padding: "10px 12px" }}>
      <div style={{ fontSize: "10px", color: "#6B7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "13px", color, wordBreak: "break-all" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color, marginTop: "2px", fontFamily: "monospace" }}>{sub}</div>}
    </div>
  );
}

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, fontSize: "11px", whiteSpace: "nowrap", letterSpacing: "0.03em", ...style }}>
      {children}
    </th>
  );
}

function ThSort({
  label, col, cur, dir, onClick, arrow, style,
}: {
  label: string;
  col: "price" | "change";
  cur: string;
  dir: string;
  onClick: (col: "price" | "change") => void;
  arrow: (col: "price" | "change") => string;
  style?: React.CSSProperties;
}) {
  return (
    <th
      onClick={() => onClick(col)}
      style={{
        padding: "8px 6px",
        textAlign: "right",
        fontWeight: 600,
        fontSize: "11px",
        whiteSpace: "nowrap",
        cursor: "pointer",
        color: cur === col ? "#00D4A4" : "#8B949E",
        userSelect: "none",
        ...style,
      }}
    >
      {label}{arrow(col)}
    </th>
  );
}
