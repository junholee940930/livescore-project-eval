import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { SCREENS } from "@/lib/data";

const execAsync = promisify(exec);

// node_modules에 함께 배포되는 @anthropic-ai/claude-code 바이너리를 직접 가리켜
// 서버리스 환경 PATH에 claude가 없어도 실행 가능하게 함. 인증은 CLAUDE_CODE_OAUTH_TOKEN
// (subscription OAuth token, `claude setup-token`으로 발급) 환경변수로 처리.
const CLAUDE_BIN = path.join(process.cwd(), "node_modules", ".bin", "claude");

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
      `"${CLAUDE_BIN}" -p "${prompt.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`,
      {
        timeout: 30000,
        env: { ...process.env, CI: "true" },
      }
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
