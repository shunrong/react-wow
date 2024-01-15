import type { Container, FiberRoot } from 'react-reconciler'
import { createFiberRoot, updateContainer } from 'react-reconciler'

function createRoot(container: Container) {
  const root: FiberRoot = createFiberRoot(container)
  return new ReactDOMRoot(root)
}

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot
}

ReactDOMRoot.prototype.render = function (children: any) {
  updateContainer(children, this._internalRoot)
}

export default { createRoot }
