"use client";
import { useParams } from "next/navigation";
import { useStore, SCORE_CATEGORIES } from "@/lib/store";
import { calcProject, formatKRW } from "@/lib/calc";
import { SCREENS } from "@/lib/data";
import Link from "next/link";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { projects, settings } = useStore();
  const project = projects.find((p) => p.id === id);

  if (!project) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#AEAAAA" }}>프로젝트를 찾을 수 없습니다.</div>
  );

  const result = calcProject(project, settings);
  const appliedScreens = SCREENS.filter((s) => project.screenIds.includes(s.id));
  const totalPVShare = result.totalPVShare;
  const totalUVShare = result.totalUVShare;
  const nonSubUV = result.nonSubUV;
  const scoreEntries = Object.entries(project.scores);
  const scoreCount = scoreEntries.length;

  return (
    <div>
      {/* 브레드크럼 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", paddingBottom: "8px", borderBottom: "2px solid #4472C4" }}>
        <Link href="/" style={{ color: "#4472C4", textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>← 대시보드</Link>
        <span style={{ color: "#D0CECE" }}>/</span>
        <span style={{ fontWeight: 700, fontSize: "14px" }}>{project.name}</span>
        {project.excelId && <span style={{ color: "#595959", fontSize: "11px" }}>({project.excelId})</span>}
        {project.status && (
          <span style={{ background: "#D9E1F2", color: "#1F3864", fontSize: "11px", padding: "2px 8px", border: "1px solid #AEAAAA", fontWeight: 600 }}>
            {project.status}
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <Link href={`/projects/${project.id}/executive`}>
            <button className="xl-btn xl-btn-primary">임원 상수 조정</button>
          </Link>
          <Link href="/score/bulk">
            <button className="xl-btn">점수 입력</button>
          </Link>
        </div>
      </div>

      {/* 상단 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", marginBottom: "14px" }}>
        {[
          { label: "기본값 합계", value: formatKRW(Math.round(result.totalBase)), color: "#4472C4" },
          { label: "평가점수", value: result.avgScore.toFixed(1) + "점", color: "#8B5CF6" },
          { label: "1차 조정 후", value: formatKRW(Math.round(result.afterScore)), color: "#217346" },
          { label: "임원 상수", value: (result.executiveAdj >= 0 ? "+" : "") + formatKRW(result.executiveAdj), color: result.executiveAdj < 0 ? "#C00000" : "#595959" },
          { label: "최종 평가금", value: formatKRW(Math.round(result.final)), color: "#185430", bg: "#E2EFDA", bold: true },
        ].map((c) => (
          <div key={c.label} style={{ border: `1px solid ${c.bg ? "#217346" : "#D0CECE"}`, background: c.bg ?? "#FAFAFA", padding: "8px 10px" }}>
            <div style={{ fontSize: "10px", color: "#595959", marginBottom: "3px" }}>{c.label}</div>
            <div style={{ fontFamily: "monospace", fontWeight: c.bold ? 700 : 600, fontSize: "13px", color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "14px", alignItems: "start" }}>

        {/* ── 왼쪽: 계산식 ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

          {/* ① PV 광고매출 */}
          <FormulaBlock title="① 광고매출 — PV 기반 (시즌)" result={formatKRW(Math.round(result.adRevenuePV))} resultColor="#4472C4">
            <FormulaRow label="계산식" formula="전체 PV × PV점유율 × 1PV당 연매출 × (1/3)" />
            <FormulaRow label="수식 대입"
              formula={`${settings.totalPV.toLocaleString("ko-KR")} × ${(totalPVShare * 100).toFixed(2)}% × ${settings.adRevenuePerPV}원 × 0.3333`} />
            <BreakdownTable rows={[
              ["앱 전체 PV (연간)", settings.totalPV.toLocaleString("ko-KR"), "페이지뷰"],
              ["PV 점유율 합계", (totalPVShare * 100).toFixed(2) + "%", "적용 화면 합산"],
              ["1PV당 연 광고매출", settings.adRevenuePerPV + "원", "연간 기준"],
              ["시즌 보정", "÷ 3", "4개월 = 1/3년"],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.adRevenuePV))} color="#4472C4" />
          </FormulaBlock>

          {/* ② UV 광고매출 */}
          <FormulaBlock title="② 광고매출 — UV 기반 (시즌)" result={formatKRW(Math.round(result.adRevenueUV))} resultColor="#4472C4">
            <FormulaRow label="계산식" formula="비구독 UV × UV점유율 × 1UV당 연매출 × (1/3)" />
            <FormulaRow label="수식 대입"
              formula={`${nonSubUV.toLocaleString("ko-KR")} × ${(totalUVShare * 100).toFixed(4)}% × ${settings.adRevenuePerUV.toLocaleString("ko-KR")}원 × 0.3333`} />
            <BreakdownTable rows={[
              ["앱 전체 UV", settings.totalUV.toLocaleString("ko-KR"), "명"],
              ["구독 UV (제외)", settings.subscriptionUV.toLocaleString("ko-KR"), "명"],
              ["비구독 UV", nonSubUV.toLocaleString("ko-KR"), "명"],
              ["UV 점유율 합계", (totalUVShare * 100).toFixed(4) + "%", "적용 화면 합산"],
              ["1UV당 연 광고매출", settings.adRevenuePerUV.toLocaleString("ko-KR") + "원", "연간"],
              ["시즌 보정", "÷ 3", "4개월 = 1/3년"],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.adRevenueUV))} color="#4472C4" />
          </FormulaBlock>

          {/* 광고 소계 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 12px", background: "#EEF3FA", border: "1px solid #BDD7EE" }}>
            <span style={{ fontSize: "12px", color: "#1F3864", fontWeight: 600 }}>광고매출 소계 (① + ②)</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4472C4", fontSize: "13px" }}>{formatKRW(Math.round(result.adRevenue))}</span>
          </div>

          {/* ③ 픽매출 */}
          <FormulaBlock title="③ 픽매출 기여" result={formatKRW(Math.round(result.pickRevenue))} resultColor="#4472C4">
            <FormulaRow label="계산식" formula="픽 구매 건수 × 픽 1건 단가" />
            <FormulaRow label="수식 대입"
              formula={`${project.pickCount.toLocaleString("ko-KR")}건 × ${settings.pickPricePerUnit.toLocaleString("ko-KR")}원`} />
            <BreakdownTable rows={[
              ["픽 구매 건수 (시즌)", project.pickCount.toLocaleString("ko-KR"), "건"],
              ["픽 1건 단가", settings.pickPricePerUnit.toLocaleString("ko-KR") + "원", ""],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.pickRevenue))} color="#4472C4" />
          </FormulaBlock>

          {/* ④ 구독매출 */}
          <FormulaBlock title="④ 구독매출 기여 (시즌)" result={formatKRW(Math.round(result.subscriptionRevenue))} resultColor="#4472C4">
            <FormulaRow label="계산식" formula="구독 UV × 월정액 × 4개월 × UV점유율" />
            <FormulaRow label="수식 대입"
              formula={`${settings.subscriptionUV.toLocaleString("ko-KR")} × ${settings.subscriptionMonthly.toLocaleString("ko-KR")}원 × 4 × ${(totalUVShare * 100).toFixed(4)}%`} />
            <BreakdownTable rows={[
              ["구독 UV", settings.subscriptionUV.toLocaleString("ko-KR"), "명"],
              ["월정액", settings.subscriptionMonthly.toLocaleString("ko-KR") + "원", ""],
              ["시즌 기간", "4개월", "S1·S2·S3 각 4개월"],
              ["UV 점유율", (totalUVShare * 100).toFixed(4) + "%", ""],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.subscriptionRevenue))} color="#4472C4" />
          </FormulaBlock>

          {/* ⑤ 선물매출 */}
          <FormulaBlock title="⑤ 선물매출 기여" result={formatKRW(Math.round(result.giftRevenue))} resultColor="#4472C4">
            <FormulaRow label="계산식" formula="선물 건수 × 선물 1건 단가" />
            <FormulaRow label="수식 대입"
              formula={`${project.giftCount.toLocaleString("ko-KR")}건 × ${settings.giftPricePerUnit.toLocaleString("ko-KR")}원`} />
            <BreakdownTable rows={[
              ["선물 건수 (시즌)", project.giftCount.toLocaleString("ko-KR"), "건"],
              ["선물 1건 단가", settings.giftPricePerUnit.toLocaleString("ko-KR") + "원", "화면 미정"],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.giftRevenue))} color="#4472C4" />
          </FormulaBlock>

          {/* 기본값 합계 */}
          <div style={{ border: "2px solid #4472C4", background: "#D9E1F2" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px" }}>
              <span style={{ fontWeight: 700, color: "#1F3864", fontSize: "12px" }}>기본값 합계 = (①+②) + ③ + ④ + ⑤</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "15px", color: "#1F3864" }}>{formatKRW(Math.round(result.totalBase))}</span>
            </div>
            <div style={{ padding: "3px 12px 6px", fontSize: "11px", color: "#1F3864", borderTop: "1px solid #AEAAAA" }}>
              {formatKRW(Math.round(result.adRevenue))} + {formatKRW(Math.round(result.pickRevenue))} + {formatKRW(Math.round(result.subscriptionRevenue))} + {formatKRW(Math.round(result.giftRevenue))}
            </div>
          </div>

          {/* 1차 조정 */}
          <FormulaBlock title="1차 조정 — 프로젝트 평가점수 반영" result={formatKRW(Math.round(result.afterScore))} resultColor="#217346">
            <FormulaRow label="계산식" formula="기본값 × (프로젝트 평가점수 ÷ 100)" />
            <FormulaRow label="수식 대입"
              formula={`${formatKRW(Math.round(result.totalBase))} × (${result.avgScore.toFixed(1)}점 ÷ 100)`} />
            <BreakdownTable rows={[
              ["기본값", formatKRW(Math.round(result.totalBase)), ""],
              ["프로젝트 평가점수", result.avgScore.toFixed(1) + "점", scoreCount === 0 ? "입력 없음 → 100점 적용" : `${scoreCount}명 가중평균`],
              ...SCORE_CATEGORIES.map((c) => {
                const catAvg = scoreCount > 0
                  ? scoreEntries.reduce((s, [, cs]) => s + cs[c.key as keyof typeof cs], 0) / scoreCount
                  : 0;
                return [`  └ ${c.label} ×${(c.weight * 100).toFixed(0)}%`, scoreCount > 0 ? catAvg.toFixed(1) + "점" : "-", `기여: ${(catAvg * c.weight).toFixed(1)}점`] as [string, string, string];
              }),
              ["적용 배율", (result.avgScore / 100).toFixed(4), `× ${result.avgScore.toFixed(1)} / 100`],
            ]} />
            <ResultRow value={formatKRW(Math.round(result.afterScore))} color="#217346" />
          </FormulaBlock>

          {/* 2차 조정 */}
          <FormulaBlock
            title="2차 조정 — 임원 상수"
            result={(result.executiveAdj >= 0 ? "+" : "") + formatKRW(result.executiveAdj)}
            resultColor={result.executiveAdj >= 0 ? "#4472C4" : "#C00000"}
          >
            <FormulaRow label="계산식" formula="1차 조정값 + 임원 상수" />
            <FormulaRow label="수식 대입"
              formula={`${formatKRW(Math.round(result.afterScore))} ${result.executiveAdj >= 0 ? "+" : ""} ${formatKRW(result.executiveAdj)}`} />
            <BreakdownTable rows={[
              ["1차 조정 후 값", formatKRW(Math.round(result.afterScore)), ""],
              ["임원 상수", (result.executiveAdj >= 0 ? "+" : "") + formatKRW(result.executiveAdj), result.executiveAdj === 0 ? "미입력" : "임원 직접 입력"],
            ]} />
          </FormulaBlock>

          {/* 최종 평가금 */}
          <div style={{ border: "2px solid #217346", background: "#E2EFDA" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#185430", fontSize: "14px" }}>최종 평가금</div>
                <div style={{ fontSize: "11px", color: "#217346", marginTop: "2px" }}>
                  {formatKRW(Math.round(result.afterScore))} {result.executiveAdj >= 0 ? "+" : ""} {formatKRW(result.executiveAdj)}
                </div>
              </div>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "24px", color: "#185430" }}>
                {formatKRW(Math.round(result.final))}
              </span>
            </div>
          </div>
        </div>

        {/* ── 오른쪽 패널 ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* 프로젝트 정보 */}
          <SidePanel title="프로젝트 정보">
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", fontSize: "12px" }}>
              {[
                ["PM", project.pm ?? "-"],
                ["시즌", project.season],
                ["상태", project.status ?? "-"],
                ["진행률", project.progress != null ? project.progress + "%" : "-"],
                ["협업자", project.collaborators.length + "명"],
                ["스킬값", project.skillValueTotal ? formatKRW(project.skillValueTotal) : "-"],
              ].map(([k, v]) => (
                <>
                  <div key={"k" + k} style={{ background: "#F2F2F2", padding: "5px 8px", borderBottom: "1px solid #E0E0E0", borderRight: "1px solid #D0CECE", fontWeight: 600, color: "#595959" }}>{k}</div>
                  <div key={"v" + k} style={{ padding: "5px 8px", borderBottom: "1px solid #E0E0E0" }}>{v}</div>
                </>
              ))}
            </div>
          </SidePanel>

          {/* 프로젝트 평가점수 */}
          <SidePanel title="프로젝트 평가점수 (무기명)" action={<Link href="/score/bulk" style={{ color: "#BDD7EE", fontSize: "11px", textDecoration: "none" }}>입력 →</Link>}>
            {scoreCount === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#AEAAAA", fontSize: "12px" }}>
                입력된 점수 없음<br /><span style={{ fontSize: "11px" }}>→ 100점 기본 적용</span>
              </div>
            ) : (
              <>
                {/* 제출 현황 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", padding: "8px 10px", borderBottom: "1px solid #D0CECE" }}>
                  <div style={{ textAlign: "center", background: "#EEF3FA", padding: "6px", border: "1px solid #BDD7EE" }}>
                    <div style={{ fontSize: "10px", color: "#595959", marginBottom: "2px" }}>총 제출</div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#4472C4", fontSize: "16px" }}>{result.scoreCount}명</div>
                  </div>
                  <div style={{ textAlign: "center", background: "#EEF3FA", padding: "6px", border: "1px solid #BDD7EE" }}>
                    <div style={{ fontSize: "10px", color: "#595959", marginBottom: "2px" }}>절사 적용</div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#595959", fontSize: "16px" }}>
                      {result.scoreCount >= 3 ? `${result.scoredCount}명` : "전체"}
                    </div>
                    <div style={{ fontSize: "9px", color: "#AEAAAA" }}>
                      {result.scoreCount >= 3 ? "최고·최저 각 1명 제외" : "3명 미만 — 절사 미적용"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", background: "#E2EFDA", padding: "6px", border: "1px solid #A9C96A" }}>
                    <div style={{ fontSize: "10px", color: "#595959", marginBottom: "2px" }}>평가점수</div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#217346", fontSize: "16px" }}>{result.avgScore.toFixed(1)}점</div>
                  </div>
                </div>
                {/* 항목별 평균 (익명 집계) */}
                <div style={{ padding: "6px 10px" }}>
                  <div style={{ fontSize: "10px", color: "#595959", marginBottom: "4px", fontWeight: 600 }}>항목별 평균 점수</div>
                  {SCORE_CATEGORIES.map((c) => {
                    const catAvg = scoreCount > 0
                      ? scoreEntries.reduce((s, [, cs]) => s + cs[c.key as keyof typeof cs], 0) / scoreCount
                      : 0;
                    const barWidth = Math.min(100, catAvg);
                    return (
                      <div key={c.key} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <div style={{ width: "90px", fontSize: "11px", color: "#595959", flexShrink: 0 }}>
                          {c.label}
                          <span style={{ color: "#4472C4", marginLeft: "4px" }}>×{(c.weight * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ flex: 1, height: "10px", background: "#E8E8E8", position: "relative" }}>
                          <div style={{ width: `${barWidth}%`, height: "100%", background: "#4472C4" }} />
                        </div>
                        <div style={{ width: "40px", textAlign: "right", fontFamily: "monospace", fontSize: "11px", fontWeight: 700, color: "#1F3864" }}>
                          {catAvg.toFixed(1)}점
                        </div>
                        <div style={{ width: "36px", textAlign: "right", fontFamily: "monospace", fontSize: "10px", color: "#217346" }}>
                          {(catAvg * c.weight).toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </SidePanel>

          {/* 적용 화면 */}
          <SidePanel title={`적용 화면 (${appliedScreens.length}개)`}>
            {/* 점유율 요약 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", padding: "8px 10px", borderBottom: "1px solid #D0CECE" }}>
              <div style={{ textAlign: "center", background: "#EEF3FA", padding: "6px", border: "1px solid #BDD7EE" }}>
                <div style={{ fontSize: "10px", color: "#595959", marginBottom: "2px" }}>PV 점유율 합계</div>
                <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#4472C4", fontSize: "14px" }}>{(totalPVShare * 100).toFixed(2)}%</div>
              </div>
              <div style={{ textAlign: "center", background: "#EEF3FA", padding: "6px", border: "1px solid #BDD7EE" }}>
                <div style={{ fontSize: "10px", color: "#595959", marginBottom: "2px" }}>UV 점유율 합계</div>
                <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#4472C4", fontSize: "14px" }}>{(totalUVShare * 100).toFixed(4)}%</div>
              </div>
            </div>
            {appliedScreens.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#AEAAAA", fontSize: "12px" }}>선택된 화면 없음</div>
            ) : (
              <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 72px", borderBottom: "1px solid #AEAAAA", fontSize: "10px", fontWeight: 700, color: "#1F3864", background: "#EEF3FA" }}>
                  <div style={{ padding: "3px 8px" }}>화면</div>
                  <div style={{ padding: "3px 4px", textAlign: "right", borderLeft: "1px solid #D0CECE" }}>PV</div>
                  <div style={{ padding: "3px 4px", textAlign: "right", borderLeft: "1px solid #D0CECE" }}>UV</div>
                </div>
                {appliedScreens.map((s, i) => (
                  <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 64px 72px", borderBottom: "1px solid #F0F0F0", fontSize: "11px", background: i % 2 === 0 ? "#fff" : "#F9F9F9" }}>
                    <div style={{ padding: "3px 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[s.depth1, s.depth2, s.depth3].filter(Boolean).join(" > ")}
                    </div>
                    <div style={{ padding: "3px 4px", fontFamily: "monospace", textAlign: "right", borderLeft: "1px solid #E8E8E8" }}>{(s.pvShare * 100).toFixed(2)}%</div>
                    <div style={{ padding: "3px 4px", fontFamily: "monospace", textAlign: "right", borderLeft: "1px solid #E8E8E8" }}>{(s.uvShare * 100).toFixed(4)}%</div>
                  </div>
                ))}
              </div>
            )}
          </SidePanel>

        </div>
      </div>
    </div>
  );
}

/* ── 공통 컴포넌트 ── */

function SidePanel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #D0CECE", overflow: "hidden" }}>
      <div style={{ background: "#4472C4", color: "white", padding: "5px 10px", fontWeight: 700, fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {title}
        {action}
      </div>
      {children}
    </div>
  );
}

function FormulaBlock({ title, result, resultColor, children }: {
  title: string; result: string; resultColor: string; children: React.ReactNode;
}) {
  return (
    <div style={{ border: "1px solid #D0CECE" }}>
      <div style={{ background: "#F2F2F2", borderBottom: "1px solid #D0CECE", padding: "5px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: "12px", color: "#1F3864" }}>{title}</span>
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: resultColor, fontSize: "13px" }}>{result}</span>
      </div>
      <div style={{ padding: "6px 0" }}>{children}</div>
    </div>
  );
}

function FormulaRow({ label, formula }: { label: string; formula: string }) {
  return (
    <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #F0F0F0", fontSize: "11px" }}>
      <div style={{ width: "80px", background: "#F9F9F9", padding: "3px 10px", color: "#595959", fontWeight: 600, flexShrink: 0, borderRight: "1px solid #D0CECE" }}>
        {label}
      </div>
      <div style={{ padding: "3px 10px", fontFamily: "monospace", color: "#1F3864", wordBreak: "break-all" }}>
        {formula}
      </div>
    </div>
  );
}

function BreakdownTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div style={{ margin: "4px 10px", border: "1px solid #E0E0E0" }}>
      {rows.map(([k, v, note], i) => (
        <div key={i} style={{ display: "flex", borderBottom: i < rows.length - 1 ? "1px solid #F0F0F0" : "none", fontSize: "11px" }}>
          <div style={{ width: "160px", padding: "2px 8px", color: "#595959", flexShrink: 0, borderRight: "1px solid #E0E0E0" }}>{k}</div>
          <div style={{ padding: "2px 8px", fontFamily: "monospace", fontWeight: 600, minWidth: "110px", borderRight: "1px solid #E0E0E0" }}>{v}</div>
          <div style={{ padding: "2px 8px", color: "#AEAAAA", fontSize: "10px", flex: 1 }}>{note}</div>
        </div>
      ))}
    </div>
  );
}

function ResultRow({ value, color }: { value: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "4px 10px", borderTop: "1px solid #D0CECE", background: "#FAFAFA" }}>
      <span style={{ fontSize: "11px", color: "#595959", marginRight: "12px" }}>소계</span>
      <span style={{ fontFamily: "monospace", fontWeight: 700, color, fontSize: "13px" }}>{value}</span>
    </div>
  );
}
