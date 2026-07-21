import "./globals.css";
import Nav from "@/components/Nav";
import StatusBar from "@/components/StatusBar";

export const metadata = {
  title: "LIVE스코어 프로젝트 주식시장",
  description: "프로젝트 광고매출 기여 평가 — 주식시장 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <style>{`
          @keyframes flash-up {
            0%   { background-color: rgba(229,57,53,0.55); }
            100% { background-color: transparent; }
          }
          @keyframes flash-dn {
            0%   { background-color: rgba(21,101,192,0.45); }
            100% { background-color: transparent; }
          }
          @keyframes live-pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.3; }
          }
          .hts-row-up   { animation: flash-up 0.6s ease-out; }
          .hts-row-dn   { animation: flash-dn 0.6s ease-out; }
          .live-dot     { animation: live-pulse 1.4s ease-in-out infinite; }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0D1117", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* 거래소 상단 헤더 */}
        <div style={{
          background: "#0D1117",
          color: "white",
          padding: "7px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "14px",
          fontFamily: "'Malgun Gothic', '맑은 고딕', 'Consolas', monospace",
          borderBottom: "2px solid #00D4A4",
          userSelect: "none",
        }}>
          <span style={{ fontSize: "18px" }}>📈</span>
          <span style={{ fontWeight: 700, letterSpacing: "0.05em", color: "#00D4A4" }}>
            LIVE스코어 PROJECT EXCHANGE
          </span>
          <span style={{ color: "#4B9FEA", fontSize: "14px", fontWeight: 700, fontFamily: "monospace" }}>LPEX</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "20px", fontSize: "14px", alignItems: "center" }}>
            <span style={{ color: "#6B7280" }}>실시간 프로젝트 주식시장</span>
            <span className="live-dot" style={{ color: "#00D4A4", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}>
              ● LIVE
            </span>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <Nav />

        {/* 메인 콘텐츠 */}
        <main style={{
          flex: 1,
          background: "#F0F2F5",
          padding: "12px 16px",
          minHeight: 0,
          overflow: "auto",
        }}>
          {children}
        </main>

        <StatusBar />
      </body>
    </html>
  );
}
