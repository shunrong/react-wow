import { createFiber } from './ReactFiber'
import type { Container, FiberRoot } from './ReactInternalTypes'
import { HostRoot } from './ReactWorkTags'

export function createFiberRoot(containerInfo: Container): FiberRoot {
  const root: FiberRoot = new FiberRootNode(containerInfo)
  root.current = createFiber(HostRoot, null, null, null)
  root.current.stateNode = root
  return root
}

export function FiberRootNode(containerInfo: Container) {
  this.containerInfo = containerInfo
  this.current = null
  this.finishedWork = null
  this.callbackNode = null
}
