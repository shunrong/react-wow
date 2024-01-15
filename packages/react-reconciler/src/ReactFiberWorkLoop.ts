import { ReactElement } from 'shared'
import { NormalPriority, Scheduler } from 'scheduler'
import { Fiber, FiberRoot } from './ReactInternalTypes'
import { createFiberFromElement } from './ReactFiber'
import { Placement } from './ReactFiberFlags'
import { beginWork } from './ReactFiberBeginWork'

let workInProgressRoot: FiberRoot | null = null
let workInProgress: Fiber | null = null

// 组件开始渲染的起点：element 是整个 React 应用的组件
function updateContainer(element: ReactElement, root: FiberRoot) {
  // 应用级别的根 fiber
  const rootFiber = root.current
  const appFiber = createFiberFromElement(element, rootFiber)
  // 初次渲染是直接替换，更新的时候是根据 diff 来确定
  appFiber.flages = Placement
  rootFiber.child = appFiber
  scheduleUpdateOnFiber(root, rootFiber)
}

function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root
  workInProgress = fiber
  Scheduler.scheduleCallback(NormalPriority, workLoop)
}

function workLoop() {
  // render 阶段
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }

  // commit 阶段
  if (!workInProgress && workInProgressRoot) {
    commitRoot()
  }
}

function performUnitOfWork(unitOfWork: Fiber) {
  const current = unitOfWork.alternate

  // next 是 beginWork 执行后返回的前一个 fiber 的子 fiber 节点
  let next = beginWork(current, unitOfWork)

  if (next === null) {
    // 没有子节点，找兄弟 -> 找爸爸的兄弟 -> 找爷爷的兄弟
  } else {
    // 有子节点
    workInProgress = next
  }
}

function completeUnitOfWork() {}

function commitRoot() {}

export { updateContainer }
