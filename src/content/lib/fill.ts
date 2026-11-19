/** Replace the `____` line with the learner's line (keeping indentation). */
export function fillCode(code: string, line: string) {
  return code
    .split('\n')
    .map((l) => (l.trim() === '____' ? l.replace('____', line.trim()) : l))
    .join('\n');
}
