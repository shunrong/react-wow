import { Fiber } from './ReactInternalTypes'

// 协调子节点，diff 算法的核心就在这里，最终会标记 flags 来记录如何最小化更新 dom
export function reconcileChildren(
  current: Fiber | null,
  returnFiber: Fiber,
  nextChildren: any
): Fiber | null {
  return null
}
