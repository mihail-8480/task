import {
    CancellationToken,
    CancellationTokenSource,
    CancelToken,
    createCancellationTokenSource
} from "./cancellation-token";

import {createResolver, Resolver} from "./resolver";
import {deferUntilAvailable} from "./utils/available";

export type TaskGenerator<T> = (cancellationToken: CancellationToken) => Promise<T>
type TaskValue = [TaskGenerator<any>, Resolver<any>, CancellationTokenSource]
export interface Executable {
    execute: () => Promise<void>
}

export interface Task<T> {
    promise: Promise<T>,
    cancel: () => void
}

type InternalTaskDetails<T> = {source: CancellationTokenSource, resolver: Resolver<T>} & Executable
export type ExecutableTask<T> = Executable&Task<T>

export function createExecutableTaskFromInternal<T>(details: InternalTaskDetails<T>) : ExecutableTask<T> {
    return {
        promise: details.resolver.future,
        execute: details.execute,
        cancel: details.source.cancel
    }
}


function executeTask(value: TaskValue) {
    const [gen, res, ccl] = value
    return gen(ccl)
        .then(deferUntilAvailable(res, res.resolve))
        .catch(deferUntilAvailable(res, res.reject))
}

export function createInternalTask<T>(generator: TaskGenerator<T>) : InternalTaskDetails<T> {
    const resolver = createResolver<T>();
    const cancellationTokenSource = createCancellationTokenSource()
    const obj : TaskValue = [generator, resolver, cancellationTokenSource]
    cancellationTokenSource.registerCancellationCallback(() => {
        queueMicrotask(() => {
            if (!resolver.complete) {
                resolver.reject(new TypeError(CancelToken.CancelMessage))
            }
        })
    })
    return {
        execute: () => executeTask(obj),
        source: cancellationTokenSource,
        resolver
    }
}

export function createTask<T>(generator: TaskGenerator<T>) : ExecutableTask<T> {
    return createExecutableTaskFromInternal(createInternalTask(generator))
}


export function cancelTask<T>(task: Task<T>) {
    const promise = task.promise.then(() => false).catch(error => {
        if (error instanceof TypeError) {
            if (error.message === CancelToken.CancelMessage) {
                return true
            }
        }
        throw error
    })
    task.cancel()
    return promise
}
