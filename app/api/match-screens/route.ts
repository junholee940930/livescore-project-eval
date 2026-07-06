import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { SCREENS } from "@/lib/data";
import claudeCodePkg from "@anthropic-ai/claude-code/package.json";

const execAsync = promisify(exec);

// node_modules/.bin/claude는 심볼릭 링크라 서버리스 트레이싱에서 누락되고,
// bin 파일명은 플랫폼마다 다름(Windows: claude.exe, Linux: claude) — 그래서
// 배포 플랫폼에서 npm이 실제로 설치한 파일을 package.json의 bin 필드로 런타임에 찾음.
// 인증은 CLAUDE_CODE_OAUTH_TOKEN(subscription OAuth, `claude setup-token`) 환경변수로 처리.
const CLAUDE_BIN = path.join(
  process.cwd(),
  "node_modules",
  "@anthropic-ai",
  "claude-code",
  (claudeCodePkg as { bin: Record<string, string> }).bin.claude
);

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
