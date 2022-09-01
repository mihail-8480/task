import {CancellationToken, CancelToken} from "./cancellation-token";

export type Part<T> = (resolve: (s: T) => void, reject: (s?: any) => void) => (() => void)|void

export function action<T>(fn: Part<T>, token: CancellationToken = CancelToken.None) {
    return new Promise<T>((resolve, reject) => {
        const cleanup = fn(resolve, reject)
        if (cleanup) {
            token.registerCancellationCallback(cleanup)
        }
    })
}

function delay(ms: number) : Part<void> {
    return resolve => {
        const timeout = setTimeout(resolve, ms)
        return () => {
            clearTimeout(timeout)
        }
    }
}

export const Action = {
    delay
}
