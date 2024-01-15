import { isNum, isStr } from 'shared'
import { Fiber } from './ReactInternalTypes'
import {
  ClassComponent,
  ContextConsumer,
  ContextProvider,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './ReactWorkTags'
import { reconcileChildren } from './ReactChildFiber'

// 根据组件类型分别处理：本质上是要通过 vdom 树，创建 fiber 树
export function beginWork(current: Fiber | null, workInProgress: Fiber) {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress)
    case HostComponent:
      return updateHostComponent(current, workInProgress)
    case HostText:
      return updateHostText(current, workInProgress)
    case ClassComponent:
      return updateClassComponent(current, workInProgress)
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress)
    case Fragment:
      return updateFragment(current, workInProgress)
    case ContextProvider:
      return updateContextProvider(current, workInProgress)
    case ContextConsumer:
      return updateContextConsumer(current, workInProgress)
  }
}

// 根 fiber 节点
function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
  return workInProgress.child
}

// 原生标签节点
function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
  // 原生标签组件的 type 就是字符串，比如 div span input
  const { type } = workInProgress
  if (!workInProgress.stateNode) {
    workInProgress.stateNode = document.createElement(type)
    updateNode(workInProgress.stateNode, {}, workInProgress.pendingProps)
  }

  let nextChildren = workInProgress.pendingProps.children

  workInProgress.child = reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}

// 原生文本节点
function updateHostText(current: Fiber | null, workInProgress: Fiber) {
  return workInProgress.child
}

// 类组件节点
function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress
  const instance = new type(pendingProps)
  workInProgress.stateNode = instance

  const children = instance.render()
  workInProgress.child = reconcileChildren(current, workInProgress, children)
  return workInProgress.child
}

// 函数组件节点
function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
  // TODO: 处理 hook
  const { type, pendingProps } = workInProgress
  const children = type(pendingProps)

  workInProgress.child = reconcileChildren(current, workInProgress, children)
  return workInProgress.child
}

// Fragment 组件节点
function updateFragment(current: Fiber | null, workInProgress: Fiber) {
  return workInProgress.child
}

// Provider 组件节点
function updateContextProvider(current: Fiber | null, workInProgress: Fiber) {
  return workInProgress.child
}

// Consumer 组件节点
function updateContextConsumer(current: Fiber | null, workInProgress: Fiber) {
  return workInProgress.child
}

// 更新原生标签节点属性
function updateNode(node, prevProps, nextProps) {
  Object.keys(prevProps).forEach((k) => {
    if (k === 'children') {
      if (isStr(nextProps[k] || isNum(nextProps[k]))) {
        node.textContent = ''
      }
    } else if (k.slice(0, 2) === 'on') {
      // 事件
      const eventName = k.slice(2).toLocaleLowerCase()
      node.removeEventListener(eventName, nextProps[k])
    } else {
      if (!(k in nextProps)) {
        delete node[k]
      }
    }
  })

  Object.keys(nextProps).forEach((k) => {
    if (k === 'children') {
      if (isStr(nextProps[k] || isNum(nextProps[k]))) {
        node.textContent = ''
      }
    } else if (k.slice(0, 2) === 'on') {
      // 事件
      const eventName = k.slice(2).toLocaleLowerCase()
      node.addEventListener(eventName, nextProps[k])
    } else {
      node[k] = nextProps[k]
    }
  })
}
