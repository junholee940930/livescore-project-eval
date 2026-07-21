"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "시장현황", icon: "📊" },
  { href: "/portfolio", label: "내 포트폴리오", icon: "💼" },
  { href: "/score/bulk", label: "평가 입력", icon: "✏️" },
  { href: "/settings", label: "변수 & 가중치", icon: "⚙️" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <div style={{ background: "#0D1117", borderBottom: "2px solid #1C2A3A" }}>
      <div style={{ display: "flex", alignItems: "flex-end", paddingLeft: "8px", paddingTop: "3px", gap: "2px" }}>
        {tabs.map((t) => {
          const isActive = t.href === "/"
            ? pathname === "/"
            : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 14px",
                fontSize: "14px",
                fontFamily: "'Malgun Gothic', '맑은 고딕', monospace",
                textDecoration: "none",
                background: isActive ? "#F8FAFC" : "#161B22",
                color: isActive ? "#0A0E1A" : "#8B949E",
                fontWeight: isActive ? 700 : 400,
                border: isActive ? "1px solid #30363D" : "1px solid #21262D",
                borderBottom: isActive ? "2px solid #F8FAFC" : "1px solid #21262D",
                borderRadius: "4px 4px 0 0",
                marginBottom: isActive ? "-2px" : "0",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
            >
              <span style={{ fontSize: "14px" }}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
