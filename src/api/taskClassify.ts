import { sendAssistantMessage } from './assistant';

export interface ClassifyResult {
  urgent: boolean;
  important: boolean;
}

/**
 * Calls the /assistant endpoint to auto-classify a task title
 * into the Eisenhower matrix quadrant (urgent × important).
 * Falls back to Q2 (important, not urgent) on any error.
 */
export async function classifyTask(title: string): Promise<ClassifyResult> {
  try {
    const response = await sendAssistantMessage({
      message: `다음 할 일이 긴급한지(지금 당장 해야 하는지)와 중요한지(장기적 가치가 있는지) 판단해줘.

할 일: "${title}"

반드시 아래 JSON 형식으로만 응답해줘 (다른 텍스트 없이):
{"urgent": true/false, "important": true/false}`,
      context: '아이젠하워 매트릭스 태스크 자동 분류 요청입니다.',
    });

    const content = response.message.content ?? '';
    const match = content.match(/\{[^}]+\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as { urgent?: unknown; important?: unknown };
      return {
        urgent: parsed.urgent === true,
        // Default to important=true when the field is missing: new tasks are assumed worth doing
        important: parsed.important !== false,
      };
    }
  } catch {
    // Network / parse errors → fall through to default
  }

  // Default: Q2 (important, not urgent)
  return { urgent: false, important: true };
}
