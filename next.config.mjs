/** @type {import('next').NextConfig} */
const nextConfig = {
  // exec()로 node_modules/.bin/claude를 직접 실행하므로, 정적 import 기반
  // 자동 트레이싱이 놓치는 @anthropic-ai/claude-code 패키지 전체를
  // match-screens 서버리스 함수 번들에 명시적으로 포함시킴.
  outputFileTracingIncludes: {
    "/api/match-screens": ["./node_modules/@anthropic-ai/claude-code/**"],
  },
};

export default nextConfig;
