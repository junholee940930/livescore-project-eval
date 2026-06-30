"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "대시보드", icon: "📊" },
  { href: "/upload", label: "엑셀 업로드", icon: "📁" },
  { href: "/score/bulk", label: "점수 입력", icon: "✏️" },
  { href: "/settings", label: "변수 & 가중치", icon: "⚙️" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <div style={{ background: "#D4D4D4", borderBottom: "2px solid #217346" }}>
      <div style={{ display: "flex", alignItems: "flex-end", paddingLeft: "4px", paddingTop: "2px", gap: "2px" }}>
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
                padding: "5px 14px",
                fontSize: "12px",
                fontFamily: "'Malgun Gothic', '맑은 고딕', Arial, sans-serif",
                textDecoration: "none",
                background: isActive ? "white" : "#E8E8E8",
                color: isActive ? "#217346" : "#444",
                fontWeight: isActive ? 700 : 400,
                border: "1px solid #AEAAAA",
                borderBottom: isActive ? "2px solid white" : "1px solid #AEAAAA",
                borderRadius: "3px 3px 0 0",
                marginBottom: isActive ? "-2px" : "0",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "11px" }}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
