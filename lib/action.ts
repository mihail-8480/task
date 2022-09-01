import {CancellationToken, CancelToken} from "./cancellation-token";

export type Action<T> = (resolve: (s: T) => void, reject: (s?: any) => void) => (() => void)|void

export function action<T>(fn: Action<T>, token: CancellationToken = CancelToken.None) {
    return new Promise<T>((resolve, reject) => {
        const cleanup = fn(resolve, reject)
        if (cleanup) {
            token.registerCancellationCallback(cleanup)
        }
    })
}

function delay(ms: number) : Action<void> {
    return resolve => {
        const timeout = setTimeout(resolve, ms)
        return () => {
            clearTimeout(timeout)
        }
    }
}

export const Actions = {
    delay
}
