import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SCREENS } from "@/lib/data";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) {
      return NextResponse.json({ error: "파싱 실패", raw: text }, { status: 500 });
    }

    const screenIds: string[] = JSON.parse(match[0]);
    const validIds = screenIds.filter((id) => SCREENS.some((s) => s.id === id));

    return NextResponse.json({ screenIds: validIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
