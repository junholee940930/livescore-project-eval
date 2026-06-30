import { exec } from "child_process";
import { promisify } from "util";
import { NextRequest, NextResponse } from "next/server";
import { SCREENS } from "@/lib/data";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();

  const screenList = SCREENS.map(
    (s) =>
      `- id: "${s.id}" | 화면: ${[s.depth1, s.depth2, s.depth3].filter(Boolean).join(" > ")}${s.hasPick ? " [픽 화면]" : ""}`
  ).join("\n");

  const prompt = `당신은 LIVE스코어 앱의 화면 구조를 알고 있는 분석가입니다.
아래 프로젝트가 어떤 앱 화면에 영향을 주는지 분석해주세요.

[프로젝트명]
${name}

[프로젝트 설명]
${description || "(설명 없음)"}

[앱 화면 목록]
${screenList}

위 화면 목록 중 이 프로젝트가 영향을 주는 화면의 id만 JSON 배열로 반환하세요.
다른 설명 없이 JSON만 반환하세요.
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
      return NextResponse.json({ error: "파싱 실패", raw: stdout }, { status: 500 });
    }

    const screenIds: string[] = JSON.parse(match[0]);
    const validIds = screenIds.filter((id) => SCREENS.some((s) => s.id === id));

    return NextResponse.json({ screenIds: validIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
