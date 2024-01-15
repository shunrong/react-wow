/**
 * 最小堆
 * 使用最小堆数据结构存储任务，提供 3 个操作方法
 * peek: 查看堆顶元素
 * push: 插入元素
 * pop: 移出堆顶元素
 */

export type Node = {
  id: number
  sortIndex: number
}

export type Heap = Array<Node>

export function peek(heap: Heap): Node | null {
  return heap.length === 0 ? null : heap[0]
}

export function push(heap: Heap, node: Node) {
  const index = heap.length
  heap.push(node)
  siftUp(heap, node, index)
}

export function pop(heap: Heap) {
  if (heap.length === 0) {
    return null
  }
  const first = heap[0]
  const last = heap.pop()
  if (last !== first) {
    heap[0] = last!
    siftDown(heap, last!, 0)
  }
  return first
}

// 向上构造最小堆
function siftUp(heap: Heap, node: Node, i: number) {
  let index = i
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1
    const parent = heap[parentIndex]
    if (compare(parent, node) > 0) {
      heap[parentIndex] = node
      heap[index] = parent
      index = parentIndex
    } else {
      return
    }
  }
}

// 向下构造最小堆
function siftDown(heap: Heap, node: Node, i: number) {
  let index = i
  const length = heap.length
  const halfLength = length >>> 1
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1
    const left = heap[leftIndex]
    const rightIndex = leftIndex + 1
    const right = heap[rightIndex]
    if (compare(left, node) < 0) {
      if (rightIndex < length && compare(right, left) < 0) {
        heap[index] = right
        heap[rightIndex] = node
        index = rightIndex
      } else {
        heap[index] = left
        heap[leftIndex] = node
        index = leftIndex
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      heap[index] = right
      heap[rightIndex] = node
      index = rightIndex
    } else {
      return
    }
  }
}

// 比较函数：先比较 sortIndex, 其次 id
function compare(a: Node, b: Node) {
  const diff = a.sortIndex - b.sortIndex
  return diff !== 0 ? diff : a.id - b.id
}
