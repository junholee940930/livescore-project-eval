"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Project } from "@/lib/store";

type ParsedProject = Project & { _matching?: boolean; _matchDone?: boolean };

export default function UploadPage() {
  const router = useRouter();
  const { addProjects } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear());

  const handleFile = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("year", String(uploadYear));
      const res = await fetch("/api/upload-excel", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParsed(data.projects);
      setStep("preview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "파싱 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAutoMatchAll = async () => {
    setMatching(true);
    setMatchProgress(0);
    const updated = [...parsed];
    for (let i = 0; i < updated.length; i++) {
      const p = updated[i];
      try {
        const res = await fetch("/api/match-screens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: p.name, description: p.description }),
        });
        const data = await res.json();
        if (res.ok) updated[i] = { ...p, screenIds: data.screenIds };
      } catch {}
      setMatchProgress(i + 1);
      setParsed([...updated]);
    }
    setMatching(false);
  };

  const handleRegister = () => {
    addProjects(parsed);
    setStep("done");
  };

  if (step === "done") {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <div style={{ fontSize: "24px", color: "#217346", fontWeight: 700, marginBottom: "8px" }}>✓ 등록 완료</div>
        <div style={{ color: "#595959", marginBottom: "20px" }}>{parsed.length}개 프로젝트가 등록되었습니다.</div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button className="xl-btn xl-btn-primary" onClick={() => router.push("/")}>대시보드로</button>
          <button className="xl-btn" onClick={() => router.push("/score/bulk")}>점수 일괄 입력 →</button>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div>
        {/* 상단 툴바 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #D0CECE" }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>업로드 미리보기</span>
            <span style={{ color: "#595959", marginLeft: "12px", fontSize: "14px" }}>{parsed.length}개 행 파싱됨</span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="xl-btn" onClick={handleAutoMatchAll} disabled={matching} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {matching ? `AI 매칭 중... (${matchProgress}/${parsed.length})` : "✨ 전체 AI 화면 매칭"}
            </button>
            <button className="xl-btn xl-btn-primary" onClick={handleRegister} disabled={matching}>등록하기</button>
          </div>
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #D0CECE" }}>
          <table className="xl-table">
            <thead>
              <tr>
                <th style={{ width: "140px" }}>프로젝트 ID</th>
                <th style={{ minWidth: "220px" }}>프로젝트명</th>
                <th>PM</th>
                <th>시즌</th>
                <th>상태</th>
                <th>참여인원</th>
                <th>스킬값</th>
                <th>협업자</th>
                <th>매칭 화면</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: "#595959", fontFamily: "monospace", fontSize: "14px" }}>{p.excelId}</td>
                  <td style={{ fontWeight: 600, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                  <td>{p.pm}</td>
                  <td style={{ textAlign: "center" }}>{p.season}</td>
                  <td style={{ textAlign: "center" }}>{p.status}</td>
                  <td style={{ textAlign: "right" }}>{p.collaborators.length}명</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                    {p.skillValueTotal ? p.skillValueTotal.toLocaleString("ko-KR") + "원" : "-"}
                  </td>
                  <td style={{ fontSize: "14px", color: "#595959", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.collaborators.map((c) => c.name).join(", ")}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {p.screenIds.length > 0
                      ? <span style={{ color: "#217346", fontWeight: 600 }}>✓ {p.screenIds.length}개</span>
                      : <span style={{ color: "#AEAAAA" }}>미매칭</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 요약 */}
        <div style={{ marginTop: "6px", background: "#E2EFDA", border: "1px solid #A9C96A", padding: "4px 12px", fontSize: "14px", color: "#217346" }}>
          합계: {parsed.length}건 · 협업자 {new Set(parsed.flatMap((p) => p.collaborators.map((c) => c.name))).size}명 (중복제거) · 스킬값 {parsed.reduce((s, p) => s + (p.skillValueTotal ?? 0), 0).toLocaleString("ko-KR")}원
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px" }}>
      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #D0CECE" }}>
        엑셀 파일 업로드
      </div>

      {/* 년도 선택 */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", padding: "8px 12px", background: "#F2F2F2", border: "1px solid #D0CECE" }}>
        <span style={{ fontSize: "14px", fontWeight: 600 }}>업로드 시즌 년도</span>
        <select className="xl-input" value={uploadYear} onChange={(e) => setUploadYear(Number(e.target.value))} style={{ width: "90px" }}>
          {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <span style={{ fontSize: "14px", color: "#595959" }}>엑셀의 시즌(1/2/3) 앞에 이 년도가 붙습니다 → {uploadYear}-S1, {uploadYear}-S2, {uploadYear}-S3</span>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          border: "2px dashed #AEAAAA",
          padding: "48px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: "#FAFAFA",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#EFF4FF"; (e.currentTarget as HTMLDivElement).style.borderColor = "#4472C4"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"; (e.currentTarget as HTMLDivElement).style.borderColor = "#AEAAAA"; }}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {loading ? (
          <div>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>⏳</div>
            <div style={{ color: "#595959" }}>파싱 중...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>엑셀 파일을 드래그하거나 클릭해서 업로드</div>
            <div style={{ color: "#595959", fontSize: "14px" }}>프로젝트 목록_26 S2.xlsx 형식</div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: "8px", padding: "6px 10px", background: "#FFE7E7", border: "1px solid #FF9999", color: "#C00000", fontSize: "14px" }}>
          오류: {error}
        </div>
      )}

      <div style={{ marginTop: "12px", padding: "10px 12px", background: "#F2F2F2", border: "1px solid #D0CECE", fontSize: "14px", color: "#595959" }}>
        <div style={{ fontWeight: 700, color: "#000", marginBottom: "4px" }}>파싱되는 항목</div>
        <div>• 프로젝트 ID, 프로젝트명, 설명, 시즌, 상태, PM</div>
        <div>• 협업자 목록 (이름, 역할, 지분율, 스킬값)</div>
        <div>• AI 화면 자동 매칭 (업로드 후 일괄 실행)</div>
      </div>
    </div>
  );
}
