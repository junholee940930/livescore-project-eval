"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";

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

  return (
    <div style={{ maxWidth: "560px" }}>
      <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #D0CECE" }}>
        설정 — 매출 산정 변수
      </div>

      <table className="xl-table" style={{ marginBottom: "0" }}>
        <thead>
          <tr>
            <th style={{ width: "220px" }}>항목</th>
            <th>값</th>
            <th style={{ width: "200px" }}>설명</th>
          </tr>
        </thead>
        <tbody>
          <SectionRow label="PV / UV 기본값" />
          <FieldRow label="앱 전체 PV (연간)" note="연간 총 페이지뷰">
            <input type="number" className="xl-input" style={{ width: "150px", textAlign: "right" }}
              value={form.totalPV} onChange={(e) => set("totalPV", Number(e.target.value))} />
          </FieldRow>
          <FieldRow label="앱 전체 UV" note="총 순이용자 수">
            <input type="number" className="xl-input" style={{ width: "150px", textAlign: "right" }}
              value={form.totalUV} onChange={(e) => set("totalUV", Number(e.target.value))} />
          </FieldRow>
          <FieldRow label="구독 UV" note="구독 중인 UV (비구독UV = 전체UV - 구독UV)">
            <input type="number" className="xl-input" style={{ width: "150px", textAlign: "right" }}
              value={form.subscriptionUV} onChange={(e) => set("subscriptionUV", Number(e.target.value))} />
          </FieldRow>

          <SectionRow label="광고매출" />
          <FieldRow label="1PV당 연 광고매출 (원)" note="PV 기반 · 연간 기준">
            <input type="number" step={0.01} className="xl-input" style={{ width: "150px", textAlign: "right" }}
              value={form.adRevenuePerPV} onChange={(e) => set("adRevenuePerPV", Number(e.target.value))} />
          </FieldRow>
          <FieldRow label="1UV당 연 광고매출 (원)" note="UV 기반 · 연간 기준">
            <input type="number" step={0.01} className="xl-input" style={{ width: "150px", textAlign: "right" }}
              value={form.adRevenuePerUV} onChange={(e) => set("adRevenuePerUV", Number(e.target.value))} />
          </FieldRow>

          <SectionRow label="픽매출" />
          <FieldRow label="픽 1건당 단가 (원)" note="">
            <input type="number" className="xl-input" style={{ width: "150px", textAlign: "right" }}
              value={form.pickPricePerUnit} onChange={(e) => set("pickPricePerUnit", Number(e.target.value))} />
          </FieldRow>

          <SectionRow label="구독매출" />
          <FieldRow label="월정액 (원)" note="">
            <input type="number" className="xl-input" style={{ width: "150px", textAlign: "right" }}
              value={form.subscriptionMonthly} onChange={(e) => set("subscriptionMonthly", Number(e.target.value))} />
          </FieldRow>

          <SectionRow label="선물매출" />
          <FieldRow label="선물 1건당 단가 (원)" note="화면 미정 — 추후 활성화">
            <input type="number" className="xl-input" style={{ width: "150px", textAlign: "right" }}
              value={form.giftPricePerUnit} onChange={(e) => set("giftPricePerUnit", Number(e.target.value))} />
          </FieldRow>
        </tbody>
      </table>

      <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
        <button className={`xl-btn ${saved ? "xl-btn-green" : "xl-btn-primary"}`} onClick={handleSave}>
          {saved ? "✓ 저장됨" : "저장하기"}
        </button>
        <button className="xl-btn" onClick={() => setForm({ ...settings })}>되돌리기</button>
      </div>
    </div>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={3} style={{ background: "#D9E1F2", fontWeight: 700, color: "#1F3864", padding: "4px 8px" }}>
        {label}
      </td>
    </tr>
  );
}

function FieldRow({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return (
    <tr>
      <td style={{ paddingLeft: "16px" }}>{label}</td>
      <td>{children}</td>
      <td style={{ color: "#595959", fontSize: "11px" }}>{note}</td>
    </tr>
  );
}
