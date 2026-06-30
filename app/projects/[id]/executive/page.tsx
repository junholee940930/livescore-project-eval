"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { calcProject, formatKRW } from "@/lib/calc";
import Link from "next/link";

export default function ExecutivePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { projects, settings, updateProject } = useStore();
  const project = projects.find((p) => p.id === id);

  const [adj, setAdj] = useState(project?.executiveAdj ?? 0);

  if (!project) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#AEAAAA" }}>프로젝트를 찾을 수 없습니다.</div>
  );

  const preview = calcProject({ ...project, executiveAdj: adj }, settings);

  const handleSave = () => {
    updateProject(id, { executiveAdj: adj });
    router.push(`/projects/${id}`);
  };

  return (
    <div style={{ maxWidth: "440px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #D0CECE" }}>
        <Link href={`/projects/${id}`} style={{ color: "#4472C4", textDecoration: "none", fontSize: "12px" }}>← {project.name}</Link>
        <span style={{ color: "#D0CECE" }}>/</span>
        <span style={{ fontWeight: 700, fontSize: "13px" }}>임원 상수 조정</span>
      </div>

      <table className="xl-table" style={{ marginBottom: "10px" }}>
        <tbody>
          <tr>
            <td style={{ width: "200px", background: "#F2F2F2", fontWeight: 600, border: "1px solid #D0CECE" }}>1차 조정 후 값</td>
            <td style={{ textAlign: "right", fontFamily: "monospace", border: "1px solid #D0CECE", paddingRight: "10px" }}>{formatKRW(Math.round(preview.afterScore))}</td>
          </tr>
          <tr>
            <td style={{ background: "#F2F2F2", fontWeight: 600, border: "1px solid #D0CECE", padding: "4px 8px" }}>임원 상수 (±원)</td>
            <td style={{ border: "1px solid #D0CECE", padding: "4px 8px" }}>
              <input
                type="number"
                className="xl-input"
                style={{ width: "160px", textAlign: "right" }}
                value={adj}
                onChange={(e) => setAdj(Number(e.target.value))}
              />
            </td>
          </tr>
          <tr style={{ background: "#E2EFDA" }}>
            <td style={{ fontWeight: 700, border: "1px solid #D0CECE", padding: "6px 8px" }}>최종 평가금 (미리보기)</td>
            <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#217346", fontSize: "14px", border: "1px solid #D0CECE", paddingRight: "10px" }}>
              {formatKRW(Math.round(preview.final))}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: "6px 10px", background: "#FFF4CE", border: "1px solid #FFD700", fontSize: "11px", color: "#595959", marginBottom: "10px" }}>
        ⚠ 임원 상수는 1차 조정값에 가감됩니다. 음수 입력 시 차감됩니다.
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        <button className="xl-btn xl-btn-primary" onClick={handleSave}>저장하기</button>
        <button className="xl-btn" onClick={() => router.back()}>취소</button>
      </div>
    </div>
  );
}
