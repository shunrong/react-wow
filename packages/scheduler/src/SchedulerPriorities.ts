export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5

// 任务优先级，值越小，优先级越高
export const NoPriority = 0
export const ImmediatePriority = 1
export const UserBlockingPriority = 2
export const NormalPriority = 3
export const LowPriority = 4
export const IdlePriority = 5

// 任务等待时间
const maxSigned31BitInt = 1073741823
export const IMMEDIATE_PRIORITY_TIMEOUT = -1
export const USER_BLOCKING_PRIORITY_TIMEOUT = 250
export const NORMAL_PRIORITY_TIMEOUT = 5000
export const LOW_PRIORITY_TIMEOUT = 10000
export const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt

// 根据任务优先级获取等待时间
export function getTimeoutByPriorityLevel(priority: PriorityLevel) {
  let timeout: number
  switch (priority) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT
      break
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT
      break
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT
      break
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT
      break
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT
      break
  }
  return timeout
}
