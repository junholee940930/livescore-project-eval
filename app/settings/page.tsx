"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatKRW } from "@/lib/calc";

const SEASON_DAYS = 120;

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof form, value: number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 실시간 프리뷰 계산
  const seasonPV = form.dailyPV * SEASON_DAYS;
  const seasonAdPV = form.dailyPV * form.adRevenuePerPVDaily * SEASON_DAYS;
  const nonSubUV = Math.max(0, form.dailyUV - form.subscriptionUV);
  const seasonAdUV = nonSubUV * form.adRevenuePerUVDaily * SEASON_DAYS;

  return (
    <div style={{ maxWidth: "640px", fontFamily: "'Malgun Gothic', '맑은 고딕', monospace" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", paddingBottom: "8px", borderBottom: "2px solid #0D1F3C" }}>
        <h1 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>⚙️ 주가 산정 변수 설정</h1>
        <span style={{ fontSize: "11px", color: "#94A3B8" }}>일 단위 기준 · 시즌 {SEASON_DAYS}일 적용</span>
      </div>

      {/* 일평균 지표 */}
      <Section title="📊 일평균 트래픽">
        <FieldRow
          label="일평균 PV"
          note={`시즌 PV ≈ ${seasonPV.toLocaleString("ko-KR")}`}
          hint="하루 평균 앱 전체 페이지뷰"
        >
          <NumInput value={form.dailyPV} onChange={(v) => set("dailyPV", v)} />
        </FieldRow>
        <FieldRow
          label="일평균 UV"
          note={`시즌 UV ≈ ${(form.dailyUV * SEASON_DAYS).toLocaleString("ko-KR")}`}
          hint="하루 평균 순이용자 수"
        >
          <NumInput value={form.dailyUV} onChange={(v) => set("dailyUV", v)} />
        </FieldRow>
        <FieldRow
          label="구독 UV"
          note={`비구독 UV ≈ ${nonSubUV.toLocaleString("ko-KR")}`}
          hint="총 구독자 수 (시간 무관)"
        >
          <NumInput value={form.subscriptionUV} onChange={(v) => set("subscriptionUV", v)} />
        </FieldRow>
      </Section>

      {/* 일 광고매출 단가 */}
      <Section title="💰 광고매출 단가 (일 기준)">
        <FieldRow
          label="1PV당 일 광고매출"
          note={`100% 점유율 시 시즌 PV 광고 ≈ ${formatKRW(Math.round(seasonAdPV))}`}
          hint="PV 1회당 하루 벌어들이는 광고수익"
        >
          <NumInput value={form.adRevenuePerPVDaily} onChange={(v) => set("adRevenuePerPVDaily", v)} step={0.00001} decimals={5} />
          <span style={{ marginLeft: "6px", fontSize: "11px", color: "#94A3B8" }}>원/PV/일</span>
        </FieldRow>
        <FieldRow
          label="1UV당 일 광고매출"
          note={`100% 점유율 시 시즌 UV 광고 ≈ ${formatKRW(Math.round(seasonAdUV))}`}
          hint="UV 1명당 하루 벌어들이는 광고수익"
        >
          <NumInput value={form.adRevenuePerUVDaily} onChange={(v) => set("adRevenuePerUVDaily", v)} step={0.001} decimals={3} />
          <span style={{ marginLeft: "6px", fontSize: "11px", color: "#94A3B8" }}>원/UV/일</span>
        </FieldRow>
      </Section>

      {/* 픽/구독/선물 */}
      <Section title="🎯 기타 매출 단가">
        <FieldRow label="픽 1건당 단가" note="" hint="픽 구매 1건 단가">
          <NumInput value={form.pickPricePerUnit} onChange={(v) => set("pickPricePerUnit", v)} />
          <span style={{ marginLeft: "6px", fontSize: "11px", color: "#94A3B8" }}>원</span>
        </FieldRow>
        <FieldRow label="구독 월정액" note="" hint="구독 1명당 월 결제금액">
          <NumInput value={form.subscriptionMonthly} onChange={(v) => set("subscriptionMonthly", v)} />
          <span style={{ marginLeft: "6px", fontSize: "11px", color: "#94A3B8" }}>원/월</span>
        </FieldRow>
        <FieldRow label="선물 1건당 단가" note="화면 미정 — 추후 활성화" hint="">
          <NumInput value={form.giftPricePerUnit} onChange={(v) => set("giftPricePerUnit", v)} />
          <span style={{ marginLeft: "6px", fontSize: "11px", color: "#94A3B8" }}>원</span>
        </FieldRow>
      </Section>

      {/* 시즌 정의 안내 */}
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "4px", padding: "10px 14px", marginBottom: "12px", fontSize: "12px", color: "#1E40AF" }}>
        <strong>시즌 = {SEASON_DAYS}일</strong> &nbsp;·&nbsp;
        S1 (1~4월) · S2 (5~8월) · S3 (9~12월) &nbsp;|&nbsp;
        주가 기준가 = 일평균 트래픽 × 점유율 × 일단가 × {SEASON_DAYS}일
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "7px 18px", fontSize: "13px", fontWeight: 700,
            background: saved ? "#059669" : "#0D1F3C", color: "white",
            border: "none", borderRadius: "4px", cursor: "pointer",
          }}
        >
          {saved ? "✓ 저장 완료" : "저장하기"}
        </button>
        <button
          onClick={() => setForm({ ...settings })}
          style={{ padding: "7px 14px", fontSize: "12px", border: "1px solid #CBD5E1", background: "white", borderRadius: "4px", cursor: "pointer" }}
        >
          되돌리기
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px", border: "1px solid #E2E8F0", borderRadius: "6px", overflow: "hidden" }}>
      <div style={{ background: "#0D1F3C", color: "white", padding: "7px 14px", fontWeight: 700, fontSize: "12px" }}>
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function FieldRow({ label, note, hint, children }: { label: string; note: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRight: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>{label}</div>
        {hint && <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "2px" }}>{hint}</div>}
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>{children}</div>
        {note && (
          <div style={{ marginTop: "4px", fontSize: "11px", color: "#059669", fontFamily: "monospace" }}>
            → {note}
          </div>
        )}
      </div>
    </div>
  );
}

function NumInput({
  value, onChange, decimals = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  decimals?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  const display = editing
    ? raw
    : decimals > 0
      ? value.toLocaleString("ko-KR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : value.toLocaleString("ko-KR");

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onFocus={() => { setEditing(true); setRaw(String(value)); }}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        setEditing(false);
        const parsed = parseFloat(raw.replace(/,/g, ""));
        onChange(isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(decimals)));
      }}
      style={{
        width: "160px",
        padding: "5px 8px",
        border: "1px solid #CBD5E1",
        borderRadius: "4px",
        fontSize: "13px",
        fontFamily: "monospace",
        textAlign: "right",
      }}
    />
  );
}
