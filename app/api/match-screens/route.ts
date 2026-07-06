import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import { SCREENS } from "@/lib/data";

const screenList = SCREENS.map(
  (s) =>
    `- id: "${s.id}" | 화면: ${[s.depth1, s.depth2, s.depth3].filter(Boolean).join(" > ")}${s.hasPick ? " [픽 화면]" : ""}`
).join("\n");

// 구독제 Claude CLI를 -p로 호출 (API key 불필요, 로컬 실행 환경 기준).
// - shell:false로 실행 파일을 직접 spawn → Windows cmd.exe의 escaping/코드페이지
//   변환으로 한글 프롬프트가 깨지는 문제 회피 (win32는 claude.exe, 그 외는 claude)
// - 프롬프트를 argv로 직접 전달 → stdin race 및 인코딩 문제 차단
// - Claude Code 세션 안에서 서버를 띄운 경우 상속되는 CLAUDE_* env를 제거해
//   중첩 호출로 오인되는 것을 방지
const CLAUDE_BIN = process.platform === "win32" ? "claude.exe" : "claude";

function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cleanEnv = { ...process.env };
    for (const k of Object.keys(cleanEnv)) {
      if (k.startsWith("CLAUDE_") || k === "CLAUDECODE") delete cleanEnv[k];
    }

    const child = spawn(CLAUDE_BIN, ["-p", prompt], { shell: false, env: cleanEnv });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("timeout"));
    }, 30000);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", () => {
      clearTimeout(timer);
      if (!stdout && stderr) return reject(new Error(stderr));
      resolve(stdout);
    });
    child.stdin.end();
  });
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();

  const prompt = `LIVE스코어 앱 화면 분석. 프로젝트가 영향을 주는 화면 id만 JSON 배열로 반환. 설명 없이 JSON만.

프로젝트: ${name}
설명: ${description || "(없음)"}

화면 목록:
${screenList}

예시: ["live_compare", "toto_compare"]`;

  try {
    const stdout = await runClaude(prompt);
    const match = stdout.match(/\[[\s\S]*?\]/);
    if (!match) return NextResponse.json({ screenIds: [] });

    const screenIds: string[] = JSON.parse(match[0]);
    const validIds = screenIds.filter((id) => SCREENS.some((s) => s.id === id));
    return NextResponse.json({ screenIds: validIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
