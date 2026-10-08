// Strength needed to pass from level N to N+1, +25 per level:
// 1->2: 25, 2->3: 50, 3->4: 75, 4->5: 100, ...
export function strengthForNextLevel(level) {
  return 25 * level
}
