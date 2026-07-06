import { exec } from "child_process";
import { promisify } from "util";
import { NextRequest, NextResponse } from "next/server";
import { SCREENS } from "@/lib/data";

const execAsync = promisify(exec);

const screenList = SCREENS.map(
  (s) =>
    `- id: "${s.id}" | 화면: ${[s.depth1, s.depth2, s.depth3].filter(Boolean).join(" > ")}${s.hasPick ? " [픽 화면]" : ""}`
).join("\n");

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();

  const prompt = `LIVE스코어 앱 화면 분석. 프로젝트가 영향을 주는 화면 id만 JSON 배열로 반환. 설명 없이 JSON만.

프로젝트: ${name}
설명: ${description || "(없음)"}

화면 목록:
${screenList}

예시: ["live_compare", "toto_compare"]`;

  try {
    const { stdout, stderr } = await execAsync(
      `claude -p "${prompt.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`,
      { timeout: 30000 }
    );

    if (stderr && !stdout) {
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    const match = stdout.match(/\[[\s\S]*?\]/);
    if (!match) {
      return NextResponse.json({ screenIds: [] });
    }

    const screenIds: string[] = JSON.parse(match[0]);
    const validIds = screenIds.filter((id) => SCREENS.some((s) => s.id === id));

    return NextResponse.json({ screenIds: validIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
