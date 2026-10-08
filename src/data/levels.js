// Strength needed to pass from level N to N+1, in multiples of 10, two levels per step:
// 1->2: 10, 2->3: 10, 3->4: 20, 4->5: 20, 5->6: 30, 6->7: 30, ...
export function strengthForNextLevel(level) {
  return 10 * Math.ceil(level / 2)
}
