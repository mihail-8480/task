import {
    createExecutableTaskFromInternal,
    createInternalTask,
    Executable,
    ExecutableTask,
    Task,
    TaskGenerator
} from "./task";
import {dequeue, enqueue} from "./utils/queue";

export interface TaskQueueContext {
    queue: Executable[],
    active: boolean,
    limit: number
}

export function createQueueContext(limit: number = 8) : TaskQueueContext {
    return {
        queue: [],
        active: false,
        limit
    }
}

const defaultContext : TaskQueueContext = createQueueContext()

export function setDefaultQueueLimit(limit: number) {
    defaultContext.limit = limit
}

function createContextExecutor(context: TaskQueueContext) {
    return async () => {
        if (!context.active) {
            context.active = true
            try {
                while (context.queue.length) {
                    const values = dequeue(context.queue, context.limit)
                    const promises = values.map(ex => ex.execute())
                    await Promise.all(promises)
                }
            } finally {
                context.active = false
            }
        }
    }
}



export function deferTask<T>(task: ExecutableTask<T>, context: TaskQueueContext = defaultContext) {
    context.queue = enqueue(context.queue, task)
    queueMicrotask(createContextExecutor(context))
}

export function queueTask<T>(generator: TaskGenerator<T>, context: TaskQueueContext = defaultContext) : Task<T> {
    const task = createInternalTask(generator)
    const executable = createExecutableTaskFromInternal(task)

    task.source.registerCancellationCallback(() => {
        context.queue = context.queue.filter(executor => executor !== executable)
    })
    deferTask<T>(executable, context)
    return executable
}
