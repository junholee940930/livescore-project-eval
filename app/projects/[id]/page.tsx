"use client";
import { useParams } from "next/navigation";
import { useStore, SCORE_CATEGORIES, Collaborator, TOTAL_SHARES } from "@/lib/store";
import { calcProject, formatKRW } from "@/lib/calc";
import { calcMarket } from "@/lib/market";
import { SCREENS } from "@/lib/data";
import { generatePriceHistory, getSparklinePoints, todayPrice } from "@/lib/stock";
import Link from "next/link";
import { useState } from "react";
import { v4 as uuid } from "uuid";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { projects, settings, updateProject, addPurchase } = useStore();
  const project = projects.find((p) => p.id === id);

  const [showAddCollab, setShowAddCollab] = useState(false);
  const [newCollab, setNewCollab] = useState<Omit<Collaborator, "id">>({
    name: "", role: "", equityPct: 0, skillValue: 0, investmentAmount: 0,
  });
  // 주식 구매 폼 상태
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyQty, setBuyQty] = useState(1);

  if (!project) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#94A3B8" }}>프로젝트를 찾을 수 없습니다.</div>
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const safeProject = project!;
  const result = calcProject(safeProject, settings);
  // 시장 정규화 stockPrice (메인 페이지와 동일한 계산)
  const marketMap = calcMarket(projects, settings);
  const stockPrice = marketMap.get(safeProject.id)?.stockPrice ?? result.rawWeight;
  const appliedScreens = SCREENS.filter((s) => safeProject.screenIds.includes(s.id));
  const scoreEntries = Object.entries(safeProject.scores);
  const scoreCount = scoreEntries.length;

  // 주가 데이터 (stockPrice = 시장 정규화 기준가)
  const history = generatePriceHistory(safeProject.id, stockPrice, 60);
  const todayP = todayPrice(history);
  const isUp = (todayP?.changePct ?? 0) >= 0;
  const priceColor = (todayP?.changePct ?? 0) === 0 ? "#6B7280" : isUp ? "#00D4A4" : "#F87171";
  const sparkPoints = getSparklinePoints(history, 480, 80);

  // 고가/저가
  const prices = history.map((h) => h.price);
  const highPrice = Math.max(...prices);
  const lowPrice = Math.min(...prices);

  function addCollaborator() {
    if (!newCollab.name.trim()) return alert("이름을 입력하세요.");
    const totalEquity = safeProject.collaborators.reduce((s, c) => s + c.equityPct, 0);
    if (totalEquity + newCollab.equityPct > 100) return alert(`지분율 합계가 100%를 초과합니다. (현재 ${totalEquity}%)`);
    updateProject(safeProject.id, {
      collaborators: [...safeProject.collaborators, { ...newCollab, id: uuid() }],
    });
    setNewCollab({ name: "", role: "", equityPct: 0, skillValue: 0, investmentAmount: 0 });
    setShowAddCollab(false);
  }

  function removeCollaborator(cid: string) {
    updateProject(safeProject.id, {
      collaborators: safeProject.collaborators.filter((c) => c.id !== cid),
    });
  }

  const totalInvestment = project.collaborators.reduce((s, c) => s + c.investmentAmount, 0);
  const totalEquityPct = project.collaborators.reduce((s, c) => s + c.equityPct, 0);

  return (
    <div style={{ fontFamily: "'Malgun Gothic', '맑은 고딕', monospace" }}>

      {/* 브레드크럼 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "2px solid #0D1F3C" }}>
        <Link href="/" style={{ color: "#3A7BD5", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>← 시장현황</Link>
        <span style={{ color: "#CBD5E1" }}>/</span>
        <span style={{ fontWeight: 700, fontSize: "14px" }}>{project.name}</span>
        {project.excelId && <span style={{ color: "#94A3B8", fontSize: "14px" }}>({project.excelId})</span>}
        {project.status && (
          <span style={{ background: "#EFF6FF", color: "#3A7BD5", fontSize: "14px", padding: "2px 8px", border: "1px solid #BFDBFE", fontWeight: 600, borderRadius: "3px" }}>
            {project.status}
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <Link href="/score/bulk">
            <button style={{ padding: "5px 12px", fontSize: "14px", border: "1px solid #CBD5E1", background: "white", cursor: "pointer", borderRadius: "4px" }}>
              평가 입력
            </button>
          </Link>
        </div>
      </div>

      {/* ── 주가 차트 패널 ── */}
      <div style={{
        background: "linear-gradient(135deg, #0A0E1A 0%, #0D1F3C 100%)",
        border: "1px solid #1C3A5C",
        borderRadius: "6px",
        padding: "16px 20px",
        marginBottom: "14px",
        color: "white",
      }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "4px", letterSpacing: "0.05em" }}>LPEX · {project.season}</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: priceColor, fontFamily: "monospace" }}>
              {todayP ? formatKRW(todayP.price) : "-"}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
              <span style={{ fontSize: "14px", fontFamily: "monospace", color: priceColor }}>
                {todayP?.changePct !== undefined ? (todayP.changePct >= 0 ? "▲" : "▼") + " " + Math.abs(todayP.changePct).toFixed(2) + "%" : ""}
              </span>
              <span style={{ fontSize: "14px", fontFamily: "monospace", color: priceColor }}>
                {todayP?.change !== undefined ? (todayP.change >= 0 ? "+" : "") + todayP.change.toLocaleString("ko-KR") + "원" : ""}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "300px" }}>
            {/* 주가 구성 인자 */}
            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: "4px", padding: "8px 12px" }}>
              <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "6px", letterSpacing: "0.05em" }}>주가 보정 인자</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {/* 평가금 */}
                <PriceFactorRow
                  label="평가금 (기본값)"
                  value={formatKRW(Math.round(result.final))}
                  multiplier={null}
                  color="#3A7BD5"
                />
                {/* 진행률 */}
                <PriceFactorRow
                  label={`진행률 ${safeProject.progress ?? "미입력"}%`}
                  value={`×${result.progressMultiplier.toFixed(2)}`}
                  multiplier={result.progressMultiplier}
                  color={result.progressMultiplier >= 1 ? "#00D4A4" : result.progressMultiplier >= 0.7 ? "#F59E0B" : "#F87171"}
                  note={safeProject.progress == null ? "미입력 → 0.50× 디스카운트" : undefined}
                />
                {/* 상태 프리미엄 */}
                <PriceFactorRow
                  label={`상태: ${safeProject.status ?? "미설정"}`}
                  value={`×${result.statusPremium.toFixed(2)}`}
                  multiplier={result.statusPremium}
                  color={result.statusPremium >= 1 ? "#00D4A4" : "#F59E0B"}
                />
                {/* 구분선 */}
                <div style={{ borderTop: "1px solid #21262D", paddingTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", color: "#6B7280" }}>현재 주가 기준가</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#00D4A4", fontSize: "14px" }}>
                    {formatKRW(Math.round(stockPrice))}
                  </span>
                </div>
              </div>
            </div>
            {/* 고저가 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: "4px", padding: "8px 10px" }}>
                <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "3px" }}>60일 고가</div>
                <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "14px", color: "#F87171" }}>{formatKRW(highPrice)}</div>
              </div>
              <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: "4px", padding: "8px 10px" }}>
                <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "3px" }}>60일 저가</div>
                <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "14px", color: "#00D4A4" }}>{formatKRW(lowPrice)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 스파크라인 차트 */}
        {sparkPoints && (
          <div style={{ position: "relative" }}>
            <svg width="100%" viewBox="0 0 480 90" preserveAspectRatio="none" style={{ display: "block", height: "80px" }}>
              {/* 그리드 라인 */}
              {[0, 0.25, 0.5, 0.75, 1].map((y) => (
                <line key={y} x1="0" y1={y * 90} x2="480" y2={y * 90} stroke="#1C2A3A" strokeWidth="0.5" />
              ))}
              {/* 가격선 */}
              <polyline
                points={sparkPoints}
                fill="none"
                stroke={priceColor}
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* 면적 그라데이션 효과 (마지막 점까지 채우기) */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={priceColor} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={priceColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,90 ${sparkPoints} 480,90`}
                fill="url(#chartGrad)"
              />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontSize: "14px", color: "#4B5563" }}>{history[0]?.date}</span>
              <span style={{ fontSize: "14px", color: "#4B5563" }}>오늘 ({history[history.length - 1]?.date})</span>
            </div>
          </div>
        )}
      </div>

      {/* ── 메인 2열 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "14px", alignItems: "start" }}>

        {/* ── 왼쪽: 계산식 ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

          {/* 요약 행 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "4px" }}>
            {[
              { label: "기본값 합계", value: formatKRW(Math.round(result.totalBase)), color: "#3A7BD5" },
              { label: "평가점수", value: result.avgScore.toFixed(1) + "점", color: "#7C3AED" },
              { label: "1차 조정 후", value: formatKRW(Math.round(result.afterScore)), color: "#059669" },
              { label: "최종 평가금", value: formatKRW(Math.round(result.final)), color: "#0D1F3C", bg: "#DBEAFE", bold: true },
            ].map((c) => (
              <div key={c.label} style={{ border: `1px solid ${c.bg ? "#93C5FD" : "#E2E8F0"}`, background: c.bg ?? "#F8FAFC", padding: "8px 10px", borderRadius: "4px" }}>
                <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "3px" }}>{c.label}</div>
                <div style={{ fontFamily: "monospace", fontWeight: c.bold ? 700 : 600, fontSize: "14px", color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* PV 광고매출 */}
          <FormulaBlock title="① 광고매출 — PV 기반 (시즌 120일)" result={formatKRW(Math.round(result.adRevenuePV))}>
            <FormulaRow label="계산식" formula="일평균 PV × PV점유율 × 1PV당 일매출 × 120일" />
            <BreakdownTable rows={[
              ["일평균 PV", settings.dailyPV.toLocaleString("ko-KR"), "페이지뷰/일"],
              ["PV 점유율 합계", (result.totalPVShare * 100).toFixed(2) + "%", "적용 화면 합산"],
              ["1PV당 일 광고매출", settings.adRevenuePerPVDaily + "원", "원/PV/일"],
              ["시즌 일수", "× 120일", "4개월"],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.adRevenuePV))} />
          </FormulaBlock>

          {/* UV 광고매출 */}
          <FormulaBlock title="② 광고매출 — UV 기반 (시즌 120일)" result={formatKRW(Math.round(result.adRevenueUV))}>
            <FormulaRow label="계산식" formula="일평균 비구독 UV × UV점유율 × 1UV당 일매출 × 120일" />
            <BreakdownTable rows={[
              ["일평균 비구독 UV", Math.round(result.nonSubUV).toLocaleString("ko-KR"), "명/일"],
              ["UV 점유율 합계", (result.totalUVShare * 100).toFixed(4) + "%", ""],
              ["1UV당 일 광고매출", settings.adRevenuePerUVDaily + "원", "원/UV/일"],
              ["시즌 일수", "× 120일", "4개월"],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.adRevenueUV))} />
          </FormulaBlock>

          {/* 광고 소계 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 12px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "3px" }}>
            <span style={{ fontSize: "14px", color: "#1E40AF", fontWeight: 600 }}>광고매출 소계 (① + ②)</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#3A7BD5", fontSize: "14px" }}>{formatKRW(Math.round(result.adRevenue))}</span>
          </div>

          <FormulaBlock title="③ 픽매출 기여" result={formatKRW(Math.round(result.pickRevenue))}>
            <BreakdownTable rows={[
              ["픽 구매 건수 (시즌)", project.pickCount.toLocaleString("ko-KR"), "건"],
              ["픽 1건 단가", settings.pickPricePerUnit.toLocaleString("ko-KR") + "원", ""],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.pickRevenue))} />
          </FormulaBlock>

          <FormulaBlock title="④ 구독매출 기여" result={formatKRW(Math.round(result.subscriptionRevenue))}>
            <BreakdownTable rows={[
              ["구독 UV", settings.subscriptionUV.toLocaleString("ko-KR"), "명"],
              ["월정액 × 4개월", settings.subscriptionMonthly.toLocaleString("ko-KR") + "원", ""],
              ["UV 점유율", (result.totalUVShare * 100).toFixed(4) + "%", ""],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.subscriptionRevenue))} />
          </FormulaBlock>

          <FormulaBlock title="⑤ 선물매출 기여" result={formatKRW(Math.round(result.giftRevenue))}>
            <BreakdownTable rows={[
              ["선물 건수 (시즌)", project.giftCount.toLocaleString("ko-KR"), "건"],
              ["선물 1건 단가", settings.giftPricePerUnit.toLocaleString("ko-KR") + "원", ""],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.giftRevenue))} />
          </FormulaBlock>

          {/* 기본값 합계 */}
          <div style={{ border: "2px solid #3A7BD5", background: "#EFF6FF", borderRadius: "4px", padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#1E40AF", fontSize: "14px" }}>기본값 합계 = (①+②) + ③ + ④ + ⑤</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "15px", color: "#1E40AF" }}>{formatKRW(Math.round(result.totalBase))}</span>
          </div>

          {/* 1차 조정 */}
          <FormulaBlock title="1차 조정 — 평가점수 반영" result={formatKRW(Math.round(result.afterScore))}>
            <FormulaRow label="계산식" formula="기본값 × (프로젝트 평가점수 ÷ 100)" />
            <BreakdownTable rows={[
              ["기본값", formatKRW(Math.round(result.totalBase)), ""],
              ["평가점수", result.avgScore.toFixed(1) + "점", scoreCount === 0 ? "미입력 → 100점 적용" : `${scoreCount}명 절사평균`],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.afterScore))} />
          </FormulaBlock>

          {/* 최종 평가금 */}
          <div style={{ border: "2px solid #059669", background: "#ECFDF5", borderRadius: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#065F46", fontSize: "14px" }}>최종 평가금 (시가총액)</div>
                <div style={{ fontSize: "14px", color: "#059669", marginTop: "2px" }}>
                  {formatKRW(Math.round(result.afterScore))} {result.executiveAdj >= 0 ? "+" : ""} {formatKRW(result.executiveAdj)}
                </div>
              </div>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "24px", color: "#065F46" }}>
                {formatKRW(Math.round(result.final))}
              </span>
            </div>
          </div>
        </div>

        {/* ── 오른쪽 패널 ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* ── HTS 매수 패널 ── */}
          {(() => {
            const sharePrice = Math.round((todayP?.price ?? stockPrice) / TOTAL_SHARES);
            const purchases = safeProject.purchases ?? [];
            const soldQty = purchases.reduce((s, p) => s + p.qty, 0);
            const remaining = TOTAL_SHARES - soldQty;
            const totalAmt = buyQty * sharePrice;
            const soldPct = Math.round((soldQty / TOTAL_SHARES) * 100);
            const canSubmit = remaining > 0 && buyerName.trim().length > 0 && buyQty >= 1 && buyQty <= remaining;

            return (
              <div style={{ background: "#0D1117", border: "1px solid #21262D", borderRadius: "4px", overflow: "hidden", fontFamily: "'Malgun Gothic','맑은 고딕',monospace" }}>

                {/* 헤더: 종목코드 + 현재가 */}
                <div style={{ background: "#161B22", borderBottom: "1px solid #21262D", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "14px", color: "#4B9FEA", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
                      {safeProject.excelId ?? "PRJ"}
                    </span>
                    <span style={{ fontSize: "14px", color: "#8B949E", marginLeft: "8px" }}>{safeProject.name.slice(0, 16)}{safeProject.name.length > 16 ? "…" : ""}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: priceColor, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
                      {todayP ? todayP.price.toLocaleString("ko-KR") : stockPrice.toLocaleString("ko-KR")}
                    </div>
                    <div style={{ fontSize: "14px", color: priceColor }}>
                      {todayP ? `${todayP.changePct >= 0 ? "▲" : "▼"} ${Math.abs(todayP.changePct).toFixed(2)}%` : ""}
                    </div>
                  </div>
                </div>

                {/* 주식 정보 그리드 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #21262D" }}>
                  {[
                    { label: "총발행주", value: `${TOTAL_SHARES}주`, color: "#8B949E" },
                    { label: "주당가격", value: formatKRW(sharePrice), color: "#E6EDF3" },
                    { label: "잔여주", value: remaining === 0 ? "매진" : `${remaining}주`, color: remaining === 0 ? "#6B7280" : "#00D4A4" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: "7px 10px", borderRight: "1px solid #21262D" }}>
                      <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "2px" }}>{label}</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* 잔여주 바 */}
                <div style={{ height: "3px", background: "#21262D" }}>
                  <div style={{ height: "100%", width: `${soldPct}%`, background: soldPct >= 80 ? "#E53935" : soldPct >= 50 ? "#F59E0B" : "#00D4A4", transition: "width 0.3s" }} />
                </div>

                {/* 매수 주문 폼 */}
                <div style={{ padding: "12px" }}>
                  <div style={{ fontSize: "14px", color: "#4B9FEA", fontWeight: 700, marginBottom: "10px", letterSpacing: "0.08em" }}>▶ 매수 주문</div>

                  {/* 주문 유형 탭 */}
                  <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
                    {["시장가"].map((t) => (
                      <div key={t} style={{ padding: "3px 10px", fontSize: "14px", background: "#E53935", color: "#fff", borderRadius: "2px", fontWeight: 700 }}>{t}</div>
                    ))}
                    <div style={{ padding: "3px 10px", fontSize: "14px", background: "#21262D", color: "#6B7280", borderRadius: "2px" }}>지정가</div>
                  </div>

                  {/* 구매자 */}
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "3px" }}>구매자</div>
                    <input
                      placeholder="이름 입력"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      disabled={remaining === 0}
                      style={{
                        width: "100%", padding: "6px 8px", background: "#0D1F3C", border: "1px solid #30363D",
                        color: "#E6EDF3", fontSize: "14px", outline: "none", boxSizing: "border-box",
                        borderRadius: "2px",
                      }}
                    />
                  </div>

                  {/* 수량 */}
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "14px", color: "#6B7280" }}>수량</span>
                      <span style={{ fontSize: "14px", color: "#6B7280" }}>최대 {remaining}주</span>
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      <button
                        onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                        disabled={remaining === 0}
                        style={{ width: "28px", height: "28px", background: "#21262D", border: "1px solid #30363D", color: "#E6EDF3", fontSize: "14px", cursor: "pointer", borderRadius: "2px", flexShrink: 0 }}
                      >−</button>
                      <input
                        type="number" min={1} max={remaining} value={buyQty}
                        onChange={(e) => setBuyQty(Math.min(remaining, Math.max(1, parseInt(e.target.value) || 1)))}
                        disabled={remaining === 0}
                        style={{
                          flex: 1, padding: "6px 8px", background: "#0D1F3C", border: "1px solid #30363D",
                          color: "#E6EDF3", fontSize: "14px", fontFamily: "monospace", textAlign: "right",
                          outline: "none", borderRadius: "2px",
                        }}
                      />
                      <button
                        onClick={() => setBuyQty((q) => Math.min(remaining, q + 1))}
                        disabled={remaining === 0}
                        style={{ width: "28px", height: "28px", background: "#21262D", border: "1px solid #30363D", color: "#E6EDF3", fontSize: "14px", cursor: "pointer", borderRadius: "2px", flexShrink: 0 }}
                      >+</button>
                    </div>
                    {/* 빠른 선택 */}
                    <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                      {[1, 5, 10, remaining].filter((v, i, arr) => arr.indexOf(v) === i && v > 0 && v <= remaining).map((n) => (
                        <button key={n} onClick={() => setBuyQty(n)}
                          style={{ flex: 1, padding: "3px", fontSize: "14px", background: buyQty === n ? "#1C3A6B" : "#161B22", border: `1px solid ${buyQty === n ? "#4B9FEA" : "#21262D"}`, color: buyQty === n ? "#4B9FEA" : "#6B7280", cursor: "pointer", borderRadius: "2px" }}>
                          {n === remaining ? "최대" : `+${n}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 주문 금액 요약 */}
                  <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: "2px", padding: "8px 10px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", color: "#6B7280" }}>단가</span>
                      <span style={{ fontSize: "14px", fontFamily: "monospace", color: "#E6EDF3" }}>{formatKRW(sharePrice)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", color: "#6B7280" }}>수량</span>
                      <span style={{ fontSize: "14px", fontFamily: "monospace", color: "#E6EDF3" }}>{buyQty}주</span>
                    </div>
                    <div style={{ borderTop: "1px solid #21262D", paddingTop: "6px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#E6EDF3", fontWeight: 700 }}>주문금액</span>
                      <span style={{ fontSize: "14px", fontFamily: "monospace", fontWeight: 700, color: "#E53935" }}>{formatKRW(totalAmt)}</span>
                    </div>
                  </div>

                  {/* 매수 확정 버튼 */}
                  <button
                    onClick={() => {
                      if (!canSubmit) return;
                      addPurchase(safeProject.id, { buyerName: buyerName.trim(), qty: buyQty, pricePerShare: sharePrice });
                      setBuyerName("");
                      setBuyQty(1);
                    }}
                    disabled={!canSubmit}
                    style={{
                      width: "100%", padding: "10px", fontSize: "14px", fontWeight: 700,
                      background: canSubmit ? "linear-gradient(180deg,#E53935 0%,#B71C1C 100%)" : "#1C1C1C",
                      color: canSubmit ? "#fff" : "#4B4B4B",
                      border: canSubmit ? "1px solid #E53935" : "1px solid #2D2D2D",
                      cursor: canSubmit ? "pointer" : "default",
                      borderRadius: "2px", letterSpacing: "0.05em",
                    }}
                  >
                    {remaining === 0 ? "매진" : canSubmit ? `매수 확정  ${buyQty}주 · ${formatKRW(totalAmt)}` : "구매자 이름을 입력하세요"}
                  </button>
                </div>

                {/* 체결 내역 */}
                {purchases.length > 0 && (
                  <div style={{ borderTop: "1px solid #21262D" }}>
                    <div style={{ padding: "6px 12px", background: "#161B22", fontSize: "14px", color: "#6B7280", fontWeight: 700, letterSpacing: "0.06em" }}>
                      체결 내역 ({purchases.length}건 · {soldQty}주)
                    </div>
                    <div style={{ maxHeight: "140px", overflowY: "auto" }}>
                      {[...purchases].reverse().map((pu) => (
                        <div key={pu.id} style={{ display: "flex", alignItems: "center", padding: "5px 12px", borderBottom: "1px solid #161B22", gap: "6px" }}>
                          <div style={{ flex: 1, fontSize: "14px", color: "#C9D1D9", fontWeight: 600 }}>{pu.buyerName}</div>
                          <div style={{ fontSize: "14px", color: "#E53935", fontFamily: "monospace", fontWeight: 700 }}>{pu.qty}주</div>
                          <div style={{ fontSize: "14px", color: "#8B949E", fontFamily: "monospace" }}>{formatKRW(pu.pricePerShare)}</div>
                          <div style={{ fontSize: "14px", color: "#E6EDF3", fontFamily: "monospace", fontWeight: 700 }}>{formatKRW(pu.qty * pu.pricePerShare)}</div>
                          <button
                            onClick={() => updateProject(safeProject.id, { purchases: purchases.filter((p) => p.id !== pu.id) })}
                            style={{ fontSize: "14px", color: "#484F58", background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 주주 현황 */}
          <SidePanel title="📊 주주 현황 (지분율 · 투자금)">
            {/* 주주 리스트 */}
            {project.collaborators.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px", color: "#94A3B8", fontSize: "14px" }}>주주 없음</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#F1F5F9" }}>
                      {["이름", "역할", "스킬값", "지분율", "투자금", "수령예정액", "수익률", ""].map((h) => (
                        <th key={h} style={{ padding: "4px 6px", textAlign: ["지분율","투자금","수령예정액","수익률","스킬값"].includes(h) ? "right" : h === "" ? "center" : "left", color: "#64748B", fontWeight: 600, borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {project.collaborators.map((c) => {
                      const payout = result.final * (c.equityPct / 100);
                      const profit = payout - c.investmentAmount;
                      const ror = c.investmentAmount > 0 ? (profit / c.investmentAmount) * 100 : null;
                      return (
                        <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "5px 6px", fontWeight: 700 }}>{c.name}</td>
                          <td style={{ padding: "5px 6px", color: "#64748B" }}>{c.role}</td>
                          <td style={{ padding: "5px 6px", fontFamily: "monospace", textAlign: "right", color: "#6B7280" }}>{c.skillValue > 0 ? c.skillValue.toLocaleString("ko-KR") : "-"}</td>
                          <td style={{ padding: "5px 6px", fontFamily: "monospace", textAlign: "right", color: "#3A7BD5", fontWeight: 700 }}>{c.equityPct}%</td>
                          <td style={{ padding: "5px 6px", fontFamily: "monospace", textAlign: "right", color: "#374151" }}>{c.investmentAmount > 0 ? formatKRW(c.investmentAmount) : "-"}</td>
                          <td style={{ padding: "5px 6px", fontFamily: "monospace", textAlign: "right", color: "#059669", fontWeight: 700 }}>{formatKRW(Math.round(payout))}</td>
                          <td style={{ padding: "5px 6px", textAlign: "right" }}>
                            {ror !== null ? (
                              <span style={{ color: ror >= 0 ? "#059669" : "#F87171", fontFamily: "monospace", fontWeight: 700 }}>
                                {ror >= 0 ? "+" : ""}{ror.toFixed(1)}%
                              </span>
                            ) : "-"}
                          </td>
                          <td style={{ padding: "5px 6px", textAlign: "center" }}>
                            <button onClick={() => removeCollaborator(c.id)}
                              style={{ fontSize: "14px", color: "#F87171", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 주주 추가 */}
            <div style={{ padding: "8px 10px", borderTop: "1px solid #E2E8F0" }}>
              {!showAddCollab ? (
                <button
                  onClick={() => setShowAddCollab(true)}
                  style={{ width: "100%", padding: "6px", fontSize: "14px", border: "1px dashed #CBD5E1", background: "#F8FAFC", cursor: "pointer", color: "#374151", borderRadius: "3px" }}
                >
                  + 주주 추가
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                    <input placeholder="이름" value={newCollab.name} onChange={(e) => setNewCollab((p) => ({ ...p, name: e.target.value }))}
                      style={{ padding: "4px 6px", border: "1px solid #CBD5E1", fontSize: "14px", borderRadius: "3px" }} />
                    <input placeholder="역할" value={newCollab.role} onChange={(e) => setNewCollab((p) => ({ ...p, role: e.target.value }))}
                      style={{ padding: "4px 6px", border: "1px solid #CBD5E1", fontSize: "14px", borderRadius: "3px" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px" }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "2px" }}>지분율(%)</div>
                      <input type="number" min={0} max={100} step={0.1} value={newCollab.equityPct}
                        onChange={(e) => setNewCollab((p) => ({ ...p, equityPct: Number(e.target.value) }))}
                        style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", fontSize: "14px", borderRadius: "3px" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "2px" }}>투자금(원)</div>
                      <input type="number" min={0} value={newCollab.investmentAmount}
                        onChange={(e) => setNewCollab((p) => ({ ...p, investmentAmount: Number(e.target.value) }))}
                        style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", fontSize: "14px", borderRadius: "3px" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "2px" }}>스킬값(원)</div>
                      <input type="number" min={0} value={newCollab.skillValue}
                        onChange={(e) => setNewCollab((p) => ({ ...p, skillValue: Number(e.target.value) }))}
                        style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", fontSize: "14px", borderRadius: "3px" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button onClick={addCollaborator}
                      style={{ flex: 1, padding: "5px", fontSize: "14px", background: "#0D1F3C", color: "white", border: "none", cursor: "pointer", borderRadius: "3px", fontWeight: 700 }}>
                      추가
                    </button>
                    <button onClick={() => setShowAddCollab(false)}
                      style={{ padding: "5px 10px", fontSize: "14px", background: "#F1F5F9", border: "1px solid #CBD5E1", cursor: "pointer", borderRadius: "3px" }}>
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SidePanel>

          {/* 평가점수 */}
          <SidePanel title="📋 평가점수 (무기명)">
            {scoreCount === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#94A3B8", fontSize: "14px" }}>
                입력된 점수 없음 — 100점 기본 적용
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", padding: "8px 10px", borderBottom: "1px solid #E2E8F0" }}>
                  <MiniStat label="총 제출" value={`${result.scoreCount}명`} color="#3A7BD5" />
                  <MiniStat label="절사 적용" value={result.scoreCount >= 3 ? `${result.scoredCount}명` : "전체"} />
                  <MiniStat label="평가점수" value={result.avgScore.toFixed(1) + "점"} color="#059669" />
                </div>
                <div style={{ padding: "8px 10px" }}>
                  {SCORE_CATEGORIES.map((c) => {
                    const avg = scoreCount > 0 ? scoreEntries.reduce((s, [, cs]) => s + cs[c.key as keyof typeof cs], 0) / scoreCount : 0;
                    return (
                      <div key={c.key} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <div style={{ width: "88px", fontSize: "14px", color: "#64748B", flexShrink: 0 }}>
                          {c.label}<span style={{ color: "#3A7BD5", marginLeft: "3px" }}>×{(c.weight * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ flex: 1, height: "8px", background: "#E2E8F0", borderRadius: "2px" }}>
                          <div style={{ width: `${Math.min(100, avg)}%`, height: "100%", background: "#3A7BD5", borderRadius: "2px" }} />
                        </div>
                        <div style={{ width: "38px", textAlign: "right", fontFamily: "monospace", fontSize: "14px", fontWeight: 700 }}>{avg.toFixed(1)}점</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </SidePanel>

          {/* 프로젝트 정보 */}
          <SidePanel title="ℹ️ 종목 정보">
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", fontSize: "14px" }}>
              {[
                ["PM", project.pm ?? "-"],
                ["시즌", project.season],
                ["상태", project.status ?? "-"],
                ["진행률", project.progress != null ? project.progress + "%" : "-"],
                ["PV 점유율", (result.totalPVShare * 100).toFixed(2) + "%"],
                ["UV 점유율", (result.totalUVShare * 100).toFixed(4) + "%"],
              ].map(([k, v]) => (
                <>
                  <div key={"k" + k} style={{ background: "#F8FAFC", padding: "5px 8px", borderBottom: "1px solid #E2E8F0", borderRight: "1px solid #E2E8F0", fontWeight: 600, color: "#64748B", fontSize: "14px" }}>{k}</div>
                  <div key={"v" + k} style={{ padding: "5px 8px", borderBottom: "1px solid #E2E8F0", fontSize: "14px" }}>{v}</div>
                </>
              ))}
            </div>
          </SidePanel>

          {/* 적용 화면 — 인터랙티브 체크박스 */}
          <ScreenAssignPanel
            screenIds={safeProject.screenIds}
            totalPVShare={result.totalPVShare}
            totalUVShare={result.totalUVShare}
            onToggle={(sid) => {
              const cur = safeProject.screenIds;
              updateProject(safeProject.id, {
                screenIds: cur.includes(sid) ? cur.filter((x) => x !== sid) : [...cur, sid],
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── 공통 컴포넌트 ── */

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", overflow: "hidden" }}>
      <div style={{ background: "#0D1F3C", color: "white", padding: "7px 12px", fontWeight: 700, fontSize: "14px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "6px", borderRadius: "3px" }}>
      <div style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontWeight: 700, color: color ?? "#374151", fontSize: "14px" }}>{value}</div>
    </div>
  );
}

function FormulaBlock({ title, result, children }: { title: string; result: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "5px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: "14px", color: "#0F172A" }}>{title}</span>
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#3A7BD5", fontSize: "14px" }}>{result}</span>
      </div>
      <div style={{ padding: "6px 0" }}>{children}</div>
    </div>
  );
}

function FormulaRow({ label, formula }: { label: string; formula: string }) {
  return (
    <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #F1F5F9", fontSize: "14px" }}>
      <div style={{ width: "70px", background: "#F8FAFC", padding: "3px 10px", color: "#64748B", fontWeight: 600, flexShrink: 0, borderRight: "1px solid #E2E8F0" }}>{label}</div>
      <div style={{ padding: "3px 10px", fontFamily: "monospace", color: "#374151", wordBreak: "break-all" }}>{formula}</div>
    </div>
  );
}

function BreakdownTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div style={{ margin: "4px 10px", border: "1px solid #E2E8F0", borderRadius: "3px" }}>
      {rows.map(([k, v, note], i) => (
        <div key={i} style={{ display: "flex", borderBottom: i < rows.length - 1 ? "1px solid #F1F5F9" : "none", fontSize: "14px" }}>
          <div style={{ width: "150px", padding: "3px 8px", color: "#64748B", flexShrink: 0, borderRight: "1px solid #E2E8F0" }}>{k}</div>
          <div style={{ padding: "3px 8px", fontFamily: "monospace", fontWeight: 600, minWidth: "100px", borderRight: "1px solid #E2E8F0" }}>{v}</div>
          <div style={{ padding: "3px 8px", color: "#94A3B8", fontSize: "14px", flex: 1 }}>{note}</div>
        </div>
      ))}
    </div>
  );
}

function PriceFactorRow({ label, value, multiplier, color, note }: {
  label: string; value: string; multiplier: number | null; color: string; note?: string;
}) {
  const barWidth = multiplier != null ? Math.min(100, multiplier * 80) : 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "110px", fontSize: "14px", color: "#9CA3AF", flexShrink: 0 }}>{label}</div>
      {multiplier != null && (
        <div style={{ flex: 1, height: "4px", background: "#21262D", borderRadius: "2px" }}>
          <div style={{ width: `${barWidth}%`, height: "100%", background: color, borderRadius: "2px", transition: "width 0.3s" }} />
        </div>
      )}
      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "14px", color, flexShrink: 0 }}>{value}</div>
      {note && <div style={{ fontSize: "14px", color: "#6B7280" }}>{note}</div>}
    </div>
  );
}

function ScreenAssignPanel({
  screenIds, totalPVShare, totalUVShare, onToggle,
}: {
  screenIds: string[];
  totalPVShare: number;
  totalUVShare: number;
  onToggle: (id: string) => void;
}) {
  // depth1 그룹 생성
  const groups: Record<string, typeof SCREENS> = {};
  for (const s of SCREENS) {
    if (!groups[s.depth1]) groups[s.depth1] = [];
    groups[s.depth1].push(s);
  }

  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", overflow: "hidden" }}>
      {/* 패널 헤더 */}
      <div style={{ background: "#0D1F3C", color: "white", padding: "7px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontWeight: 700, fontSize: "14px" }}>🖥️ 화면 배정</span>
        <span style={{ fontSize: "14px", color: "#94A3B8" }}>({screenIds.length}개 선택)</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "12px", fontSize: "14px", fontFamily: "monospace" }}>
          <span style={{ color: "#00D4A4" }}>PV {(totalPVShare * 100).toFixed(1)}%</span>
          <span style={{ color: "#3A7BD5" }}>UV {(totalUVShare * 100).toFixed(2)}%</span>
        </div>
      </div>

      {/* PV 점유율 바 */}
      <div style={{ height: "3px", background: "#E2E8F0" }}>
        <div style={{ height: "100%", width: `${Math.min(100, totalPVShare * 100)}%`, background: "#3A7BD5", transition: "width 0.3s" }} />
      </div>

      {/* 그룹별 체크박스 */}
      <div style={{ maxHeight: "260px", overflowY: "auto" }}>
        {Object.entries(groups).map(([depth1, screens]) => {
          const groupChecked = screens.filter((s) => screenIds.includes(s.id)).length;
          const allChecked = groupChecked === screens.length;
          return (
            <div key={depth1}>
              {/* 그룹 헤더 — 전체 토글 */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "5px 10px", background: "#F1F5F9",
                  borderBottom: "1px solid #E2E8F0", cursor: "pointer",
                }}
                onClick={() => {
                  if (allChecked) {
                    screens.forEach((s) => { if (screenIds.includes(s.id)) onToggle(s.id); });
                  } else {
                    screens.forEach((s) => { if (!screenIds.includes(s.id)) onToggle(s.id); });
                  }
                }}
              >
                <div style={{
                  width: "14px", height: "14px", border: "1px solid #CBD5E1",
                  borderRadius: "2px", background: allChecked ? "#3A7BD5" : groupChecked > 0 ? "#BFDBFE" : "white",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {allChecked && <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>✓</span>}
                  {!allChecked && groupChecked > 0 && <span style={{ color: "#3A7BD5", fontSize: "14px", fontWeight: 700 }}>–</span>}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#374151", flex: 1 }}>{depth1}</span>
                <span style={{ fontSize: "14px", color: "#94A3B8", fontFamily: "monospace" }}>
                  {groupChecked}/{screens.length}
                </span>
              </div>

              {/* 개별 화면 */}
              {screens.map((s) => {
                const checked = screenIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => onToggle(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "4px 10px 4px 24px",
                      borderBottom: "1px solid #F8FAFC",
                      background: checked ? "#EFF6FF" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{
                      width: "12px", height: "12px", border: `1px solid ${checked ? "#3A7BD5" : "#CBD5E1"}`,
                      borderRadius: "2px", background: checked ? "#3A7BD5" : "white",
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {checked && <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: "14px", color: checked ? "#1E40AF" : "#6B7280", flex: 1 }}>
                      {[s.depth2, s.depth3].filter(Boolean).join(" › ")}
                    </span>
                    <div style={{ display: "flex", gap: "6px", fontSize: "14px", fontFamily: "monospace" }}>
                      <span style={{ color: checked ? "#3A7BD5" : "#9CA3AF" }}>PV {(s.pvShare * 100).toFixed(1)}%</span>
                      <span style={{ color: checked ? "#00D4A4" : "#9CA3AF" }}>UV {(s.uvShare * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultRow({ value }: { value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "4px 10px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC" }}>
      <span style={{ fontSize: "14px", color: "#64748B", marginRight: "12px" }}>소계</span>
      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#3A7BD5", fontSize: "14px" }}>{value}</span>
    </div>
  );
}
