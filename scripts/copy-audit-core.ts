const forbiddenPatterns = [
  /\bcheat(?:ing)?\b/iu,
  /gian\s+lận/iu,
  /\bplagiarism\b/iu,
  /\bplagiaris(?:e|ed)\b/iu,
  /\bplagiariz(?:e|ed)\b/iu,
  /đạo\s+văn/iu,
  /\bAI[- ](?:generated|written)\b/iu,
  /\bfraud\b/iu,
  /gian\s+dối/iu,
  /sao\s+chép\s+bài/iu,
  /(?:^|[^\p{L}])Sai(?:$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])Wrong(?:$|[^\p{L}])/iu,
  /Điểm\s+thấp/iu,
  /Nghi\s+ngờ/iu,
] as const

export type CopyViolation = {
  readonly line: number
  readonly pattern: string
}

export function findCopyViolations(content: string): readonly CopyViolation[] {
  return content
    .split('\n')
    .flatMap((line, lineIndex) =>
      forbiddenPatterns
        .filter((pattern) => pattern.test(line))
        .map((pattern) => ({ line: lineIndex + 1, pattern: pattern.source })),
    )
}
