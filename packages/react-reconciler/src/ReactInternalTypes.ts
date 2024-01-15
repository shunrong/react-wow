import type { WorkTag } from './ReactWorkTags'
import type { Flags } from './ReactFiberFlags'
import { ReactContext } from 'shared'

export type Fiber = {
  // 标记组件类型
  tag: WorkTag
  // 标记组件在当前层级下的唯一性，方便 diff 更新时复用 fiber 节点
  key: null | string
  // 节点类型，elementType 用于记录在 reconciliation 阶段的类型
  elementType: any
  type: any
  // 原生组件：保存真实 dom; 类组件：保存实例
  stateNode: any

  // 父节点、第一个子节点、下一个兄弟节点
  return: Fiber | null
  child: Fiber | null
  sibling: Fiber | null

  // 子节点的下标，用于 diff 时判断节点是否发生位置移动
  index: number

  pendingProps: any
  memoizedProps: any
  updateQueue: any

  // 类组件：state；函数组件：hook0 第一个 hook，其他hook 是链表后面节点
  memoizedState: any

  // Effect 组件更新的操作标记
  flages: Flags
  subtreeFlages: Flags
  // 要删除的子节点
  deletions: Array<Fiber> | null

  nextEffect: Fiber | null

  // 双缓冲架构，用于 diff 阶段
  alternate: Fiber | null

  // context 单链表结构存储
  dependencies: Dependencies | null
}

export type Container = Element | Document | DocumentFragment

export type FiberRoot = {
  containerInfo: Container
  current: Fiber
  // 将要被 commit 的 workInProgress HostRoot
  finished: Fiber | null
  // Scheduler.scheduleCallback 返回的节点，记录下一个任务
  callbackNode: any
}

export type ContextDependency<T> = {
  context: ReactContext<T>
  next: ContextDependency<unknown> | null
  memoizedValue: T
}

export type Dependencies = {
  firstContext: ContextDependency<unknown> | null
}
