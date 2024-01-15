import {
  REACT_CONTEXT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PROVIDER_TYPE,
  ReactElement,
  isFn,
  isStr,
} from 'shared'
import { NoFlags } from './ReactFiberFlags'
import { Fiber } from './ReactInternalTypes'
import {
  ClassComponent,
  ContextConsumer,
  ContextProvider,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
  IndeterminateComponent,
  WorkTag,
} from './ReactWorkTags'

export function createFiber(
  tag: WorkTag,
  pendingProps: any,
  key: null | string,
  returnFiber: Fiber | null
) {
  return new FiberNode(tag, pendingProps, key, returnFiber)
}

export function FiberNode(
  tag: WorkTag,
  pendingProps: any,
  key: null | string,
  returnFiber: Fiber | null
) {
  // 实例
  this.tag = tag
  this.key = key
  this.elementType = null
  this.type = null
  this.stateNode = null

  // Fiber
  this.return = returnFiber
  this.child = null
  this.sibling = null
  this.index = 0
  this.pendingProps = pendingProps
  this.memoizedProps = null
  this.updateQueue = null
  this.memoizedState = null

  // Effect
  this.flags = NoFlags
  this.subtreeFlages = NoFlags
  this.deletions = null

  // 缓存 fiber
  this.alternate = null

  // Context
  this.dependencies = null
}

// 根据虚拟 dom 对象，创建  fiber 对象
export function createFiberFromElement(element: ReactElement, returnFiber: Fiber) {
  const { type, key } = element
  const pendingProps = element.props
  const fiber = createFiberFromTypeAndProps(type, key, pendingProps, returnFiber)
  return fiber
}

export function createFiberFromTypeAndProps(
  type: any,
  key: null | string,
  pendingProps: any,
  returnFiber: Fiber
) {
  let fiberTag: WorkTag = IndeterminateComponent
  if (isFn(type)) {
    // type 是函数，需要进一步判断是类组件函数函数组件
    if (shouldConstruct(type)) {
      // 类组件
      fiberTag = ClassComponent
    } else {
      // 函数组件
      fiberTag = FunctionComponent
    }
  } else if (isStr(type)) {
    // 原生标签组件
    fiberTag = HostComponent
  } else if (type === REACT_FRAGMENT_TYPE) {
    fiberTag = Fragment
  } else if (type.$$typeof === REACT_PROVIDER_TYPE) {
    fiberTag = ContextProvider
  } else if (type.$$typeof === REACT_CONTEXT_TYPE) {
    fiberTag = ContextConsumer
  }

  const fiber = createFiber(fiberTag, pendingProps, key, returnFiber)
  fiber.elementType = type
  fiber.type = type
  return fiber
}

export function shouldConstruct(Component: Function) {
  const prototype = Component.prototype
  return !!(prototype && prototype.isReactComponent)
}

// 将文件节点创建为 fiber 对象
export function createFiberFromText(content: string, returnFiber: Fiber) {
  const fiber = createFiber(HostText, content, null, returnFiber)
  return fiber
}
