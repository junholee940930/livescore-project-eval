import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import StatusBar from "@/components/StatusBar";

export const metadata: Metadata = {
  title: "LIVE스코어 프로젝트 평가 시스템",
  description: "프로젝트 광고매출 기여 평가 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, background: "#F0F0F0", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Excel 타이틀 바 */}
        <div style={{
          background: "#217346",
          color: "white",
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px",
          fontFamily: "'Malgun Gothic', '맑은 고딕', Arial, sans-serif",
          fontWeight: 600,
          userSelect: "none",
        }}>
          <span style={{ fontSize: "16px" }}>📗</span>
          <span>LIVE스코어 프로젝트 평가 시스템.xlsx</span>
          <span style={{ marginLeft: "auto", fontSize: "11px", opacity: 0.8, fontWeight: 400 }}>
            Microsoft Excel
          </span>
        </div>

        {/* 시트 탭 네비게이션 */}
        <Nav />

        {/* 셀 영역 (흰 배경) */}
        <main style={{
          flex: 1,
          background: "white",
          padding: "16px 20px",
          minHeight: 0,
          overflow: "auto",
        }}>
          {children}
        </main>

        {/* 상태 표시줄 */}
        <StatusBar />
      </body>
    </html>
  );
}
