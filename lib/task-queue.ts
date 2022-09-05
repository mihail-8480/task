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
    active: number,
    limit: number,
    debug: boolean,
    executorId: number
}

export function createQueueContext(limit: number = 8, debug: boolean = false) : TaskQueueContext {
    return {
        queue: [],
        active: 0,
        limit,
        debug: debug,
        executorId: 0
    }
}

const defaultContext : TaskQueueContext = createQueueContext()

export function setDefaultQueueLimit(limit: number) {
    defaultContext.limit = limit
}

export function setDefaultDebugStatus(debug: boolean) {
    defaultContext.debug = debug
}

function pauseUntilAny(promises: Promise<any>[]) {
    let resolved : boolean = false;
    return new Promise<{resolved: Promise<any>}>(resolve => {
        for(const promise of promises) {
            promise.then(() => {
                if (!resolved) {
                    resolved = true
                    resolve({resolved: promise})
                }
            })
        }
    })
}

function createContextExecutor(context: TaskQueueContext) {
    return async () => {
        if (context.active < context.limit) {
            const selfId = context.executorId++

            const debug = function(...args: any[]) {
                if (context.debug) {
                    console.log(`[Executor #${selfId}] `, ...args)
                }
            }

            debug('Executor created due to load')
            let promises: Promise<any>[] = []
            try {
                while (context.queue.length || context.active) {
                    if (context.queue.length) {
                        debug('Getting', context.limit - context.active, 'task(s) from queue')
                        const values = dequeue(context.queue, context.limit - context.active)
                        context.active += values.length
                        debug('Got', values.length, 'task(s) from queue, activating them')
                        promises.push(...values.map((ex) => ex.execute()))
                    }

                    debug('Waiting for a promise to resolve')
                    const result = await pauseUntilAny(promises)
                    debug('Promise resolved, removing from active')
                    promises = promises.filter(x => x !== result.resolved)
                    context.active--
                }
            } finally {
                debug('Reducing the active task amount by', promises.length, 'because this executor is complete')
                context.active -= promises.length
                debug('Executor exited with', context.active, 'active task(s)')
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
