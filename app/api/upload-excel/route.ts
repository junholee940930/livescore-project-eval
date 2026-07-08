import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { Collaborator } from "@/lib/store";

function parseCollaborators(raw: string): Collaborator[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("/");
      if (parts.length < 5) return null;
      const [id, name, role, equityStr, skillStr] = parts;
      const equityPct = parseFloat(equityStr?.replace("%", "") ?? "0") || 0;
      const skillValue = parseInt(skillStr?.replace(/[^0-9]/g, "") ?? "0") || 0;
      return { id: id.trim(), name: name.trim(), role: role.trim(), equityPct, skillValue, investmentAmount: 0 };
    })
    .filter(Boolean) as Collaborator[];
}

function parseSkillValue(raw: string | number): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;
  return parseInt(String(raw).replace(/[^0-9]/g, "")) || 0;
}

function seasonFromNum(num: number, year: number): string {
  const q = num === 2 ? "S2" : num === 3 ? "S3" : "S1";
  return `${year}-${q}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

    const yearParam = formData.get("year");
    const year = yearParam ? parseInt(String(yearParam)) : new Date().getFullYear();

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const SKIP_NAMES = ["총계", "합계", "소계", "total", "subtotal"];
    const projects = rows
      .filter((row) => {
        const name = row["프로젝트명"]?.toString().trim();
        if (!name) return false;
        if (SKIP_NAMES.some((s) => name.toLowerCase() === s.toLowerCase())) return false;
        return true;
      })
      .map((row) => {
        const collaborators = parseCollaborators(
          row["협업자 목록 (아이디/이름/역할/지분율/스킬값)"] as string
        );
        return {
          id: crypto.randomUUID(),
          excelId: row["프로젝트 ID"]?.toString().trim() || "",
          name: row["프로젝트명"]?.toString().trim() || "",
          description: row["프로젝트 설명"]?.toString().trim() || "",
          season: seasonFromNum(parseFloat(row["시즌"]?.toString() || "1"), year),
          status: row["상태"]?.toString().trim() || "",
          progress: parseFloat(row["진행률(%)"]?.toString() || "0") || 0,
          pm: row["PM명"]?.toString().trim() || "",
          skillValueTotal: parseSkillValue(row["스킬값 합계"] as string),
          collaborators,
          screenIds: [],
          pickCount: 0,
          giftCount: 0,
          scores: {},
          executiveAdj: 0,
        };
      });

    return NextResponse.json({ projects, count: projects.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
