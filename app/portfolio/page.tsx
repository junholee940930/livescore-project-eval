"use client";
import { useStore, TOTAL_SHARES } from "@/lib/store";
import { calcProject, formatKRW } from "@/lib/calc";
import { generatePriceHistory, todayPrice } from "@/lib/stock";
import Link from "next/link";

export default function PortfolioPage() {
  const { projects, settings } = useStore();

  // 전체 구매 내역을 구매자별로 집계
  const byBuyer = new Map<string, {
    buyerName: string;
    entries: { projectId: string; projectName: string; excelId?: string; qty: number; pricePerShare: number; purchasedAt: string; currentSharePrice: number }[];
  }>();

  for (const project of projects) {
    const result = calcProject(project, settings);
    const history = generatePriceHistory(project.id, result.stockPrice);
    const todayP = todayPrice(history);
    const currentSharePrice = Math.round((todayP?.price ?? result.stockPrice) / TOTAL_SHARES);

    for (const pu of project.purchases ?? []) {
      if (!byBuyer.has(pu.buyerName)) byBuyer.set(pu.buyerName, { buyerName: pu.buyerName, entries: [] });
      byBuyer.get(pu.buyerName)!.entries.push({
        projectId: project.id,
        projectName: project.name,
        excelId: project.excelId,
        qty: pu.qty,
        pricePerShare: pu.pricePerShare,
        purchasedAt: pu.purchasedAt,
        currentSharePrice,
      });
    }
  }

  const buyers = Array.from(byBuyer.values());
  const allEntries = buyers.flatMap((b) => b.entries);
  const totalPaid = allEntries.reduce((s, e) => s + e.qty * e.pricePerShare, 0);
  const totalCurrentValue = allEntries.reduce((s, e) => s + e.qty * e.currentSharePrice, 0);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <Link href="/" style={{ fontSize: "12px", color: "#6B7280", textDecoration: "none" }}>← 시장현황</Link>
        <span style={{ color: "#D1D5DB" }}>|</span>
        <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>내 포트폴리오</h1>
        <span style={{ fontSize: "12px", color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: "10px" }}>
          {allEntries.length}건 구매
        </span>
      </div>

      {allEntries.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
          {[
            { label: "구매자 수", value: `${buyers.length}명`, color: undefined as string | undefined },
            { label: "총 구매 건수", value: `${allEntries.length}건`, color: undefined as string | undefined },
            { label: "총 투자금", value: formatKRW(totalPaid), color: "#3A7BD5" as string | undefined },
            { label: "현재 가치", value: formatKRW(totalCurrentValue), color: totalCurrentValue >= totalPaid ? "#059669" : "#D32F2F" as string | undefined },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: color ?? "#111827", fontFamily: "monospace" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {allEntries.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>구매 내역이 없습니다</div>
          <div style={{ fontSize: "13px", color: "#9CA3AF" }}>프로젝트 상세 페이지에서 주식을 구매하면 여기에 표시됩니다.</div>
          <Link href="/" style={{ display: "inline-block", marginTop: "16px", padding: "8px 20px", background: "#111827", color: "#fff", borderRadius: "4px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            시장으로 이동 →
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "6px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E5E7EB" }}>
                {(["구매자", "종목", "수량", "구매단가", "현재단가", "투자금", "현재가치", "손익", "구매일", ""] as const).map((h) => (
                  <th key={h} style={{
                    padding: "9px 12px",
                    textAlign: (["수량","구매단가","현재단가","투자금","현재가치","손익"].includes(h) ? "right" : h === "" ? "center" : "left") as "right" | "center" | "left",
                    color: "#64748B", fontWeight: 600, whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buyers.flatMap((b) =>
                b.entries.map((e, i) => {
                  const paid = e.qty * e.pricePerShare;
                  const current = e.qty * e.currentSharePrice;
                  const pnl = current - paid;
                  return (
                    <tr key={`${b.buyerName}-${e.projectId}-${i}`} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "9px 12px", fontWeight: 700 }}>{b.buyerName}</td>
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{e.projectName}</div>
                        {e.excelId && <div style={{ fontSize: "10px", color: "#4B9FEA" }}>{e.excelId}</div>}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", color: "#D32F2F", fontWeight: 700 }}>{e.qty}주</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>{formatKRW(e.pricePerShare)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>{formatKRW(e.currentSharePrice)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>{formatKRW(paid)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{formatKRW(current)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: pnl >= 0 ? "#059669" : "#D32F2F" }}>
                        {pnl >= 0 ? "+" : ""}{formatKRW(pnl)}
                      </td>
                      <td style={{ padding: "9px 12px", color: "#6B7280", fontSize: "11px" }}>{e.purchasedAt.slice(0, 10)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        <Link href={`/projects/${e.projectId}`} style={{ fontSize: "11px", color: "#3A7BD5", textDecoration: "none", fontWeight: 600 }}>보기</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
