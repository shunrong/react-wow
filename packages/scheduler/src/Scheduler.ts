import { peek, pop, push } from './SchedulerMinHeap'
import { NormalPriority, PriorityLevel, getTimeoutByPriorityLevel } from './SchedulerPriorities'
import { getCurrentTime } from 'shared'

type Callback = any
type HostCallback = (hasTimeRemaining: boolean, currentTime: number) => boolean
type Option = { delay?: number }

interface Task {
  id: number
  callback: Callback
  priorityLevel: PriorityLevel
  startTime: number
  expirationTime: number
  sortIndex: number
}

// 最小堆存储任务
const taskQueue: Task[] = [] // 即时任务
const timerQueue: Task[] = [] // 延时任务

let taskIdCounter = 0 // 任务id，自增的数字
let taskTimeoutId: any = -1
let isHostTimeoutScheduled = false
let isHostCallbackScheduled = false
let isPerformingWork = false
let isMessageLoopRunning = false
let scheduledHostCallback: HostCallback | null = null
let currentTask: Task | null = null
let currentPriorityLevel: PriorityLevel = NormalPriority
let frameInterval = 5 // 每一帧预留的任务空闲时间
let startTime: number = -1

// 浏览器宿主消息通道，用于通过事件循环模拟 requestIdleCallback
// 让浏览器在空闲时间执行任务
const channel = new MessageChannel()
const { port1, port2 } = channel

export function scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  option?: Option
) {
  const currentTime = getCurrentTime()

  let delay: number = 0
  if (option?.delay && option.delay > 0) {
    delay = option.delay
  }

  const startTime: number = currentTime + delay
  const timeout: number = getTimeoutByPriorityLevel(priorityLevel)
  const expirationTime: number = startTime + timeout

  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  }

  if (startTime > currentTime) {
    // 延时任务
    newTask.sortIndex = startTime
    push(timerQueue, newTask)

    // 如果即时任务为空了，而当前任务又恰好是延时任务里优先级最高的任务(堆顶元素)
    // 那么，给它做倒计时，时间到了就放到即时任务队列里来
    // 否则，就先在延时任务队列里待着吧
    if (peek(taskQueue) === null && peek(timerQueue) === newTask) {
      if (isHostTimeoutScheduled) {
        cancelHostTimeout()
      } else {
        isHostTimeoutScheduled = true
      }
      requestHostTimeout(handleTimeout, startTime - currentTime)
    }
  } else {
    // 即时任务
    newTask.sortIndex = expirationTime
    push(taskQueue, newTask)

    // 当前没有即时任务被调度，那么立即调度
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true
      requestHostCallback(flushWork)
    }
  }
}

// 给延时任务设置定时器
function requestHostTimeout(callback: Callback, ms: number) {
  taskTimeoutId = setTimeout(() => {
    callback(getCurrentTime())
  }, ms)
}

// 延时任务时间到了，要从演示任务队列拿出来，加入到即时任务队列
function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false
  advanceTimers(currentTime)

  // 如果此时没有即时任务被调度，那么开始调度
  if (!isHostCallbackScheduled) {
    // 即时任务队列中有任务，立即调度
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true
      requestHostCallback(flushWork)
    } else {
      // 即时任务队列中没有有任务，继续处理延时队列中的任务
      const firstTimer = peek(timerQueue) as Task
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime)
      }
    }
  }
}

// 取消延时任务的计时
function cancelHostTimeout() {
  clearTimeout(taskTimeoutId)
  taskTimeoutId = -1
}

// 检查延时任务队列，如果有到时间的，转移到即时任务队列里
function advanceTimers(currentTime: number) {
  let timer = peek(timerQueue) as Task
  while (timer !== null) {
    if (timer.callback === null) {
      pop(timerQueue)
    } else if (timer.startTime <= currentTime) {
      pop(timerQueue)
      timer.sortIndex = timer.expirationTime
      push(taskQueue, timer)
    } else {
      // 如果前面的都没有到时间，那后面的肯定也没有到时间，直接退出循环
      return
    }
    timer = peek(timerQueue) as Task
  }
}

function requestHostCallback(callback: Callback) {
  scheduledHostCallback = callback
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true
    schedulePerformWorkUntilDeadline()
  }
}

// 告诉浏览器，我这里有活儿，你有空了记得来干活儿
function schedulePerformWorkUntilDeadline() {
  port1.postMessage(null)
}

// 浏览器响应调度器，我现在有空了，我来干你的活儿啦
port2.onmessage = performWorkUntilDeadline

// 此时 JS 单线程事件循环轮到我们啦，开始处理任务
function performWorkUntilDeadline() {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime()
    startTime = currentTime
    const hasTimeRemaining = true
    let hasMoreWork = true
    try {
      // 因为前面 requestHostCallback 的时候赋值过，这里实际上就是调用 flushWork
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime)
    } finally {
      // 还有活儿，继续让浏览器排班，有空再接着干！
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline()
      } else {
        isMessageLoopRunning = false
        scheduledHostCallback = null
      }
    }
  } else {
    isMessageLoopRunning = false
  }
}

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  isHostCallbackScheduled = false
  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false
    cancelHostTimeout()
  }
  isPerformingWork = true
  let previousPriorityLevel = currentPriorityLevel
  try {
    return workLoop(hasTimeRemaining, initialTime)
  } finally {
    currentTask = null
    currentPriorityLevel = previousPriorityLevel
    isPerformingWork = false
  }
}

// 循环处理任务：把即时任务从队列中逐个取出来处理
function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime
  advanceTimers(currentTime)
  currentTask = peek(taskQueue) as Task

  while (currentTask !== null) {
    const shouldYield = shouldYieldToTost()
    if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYield)) {
      break
    }

    const callback = currentTask.callback
    currentPriorityLevel = currentTask.priorityLevel
    if (callback) {
      currentTask.callback = null
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime
      // 真正的任务就是 callback，执行 callback 就是在干活儿
      const continuationCallback = callback(didUserCallbackTimeout)
      currentTime = getCurrentTime()
      if (continuationCallback) {
        currentTask.callback = continuationCallback
        advanceTimers(currentTime)
        return true
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue)
        }
        advanceTimers(currentTime)
      }
    } else {
      pop(taskQueue)
    }
    currentTask = peek(taskQueue) as Task
  }

  if (currentTask !== null) {
    return true
  } else {
    // 即时任务里没有了，把延时任务拿出来计时
    const firstTimer = peek(timerQueue) as Task
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime)
    }
    return false
  }
}

// 判断是否需要把控制权交还给主线程
function shouldYieldToTost() {
  // 主线程预留给你的时间不够用了，要中断了
  // 给你预留了 5ms 的时间，但是从开始处理任务到现在，时间超过 5ms 了，你要停下来，把时间交还给浏览器
  const timeElapsed = getCurrentTime() - startTime
  if (timeElapsed < frameInterval) {
    return false
  }
  return true
}

// 获取当前任务优先级
export function getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel
}
