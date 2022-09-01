export interface CancellationToken {
    isCancellationRequested: boolean,
    throwIfCancelled: () => void,
    registerCancellationCallback: (fn: () => void) => void
}

export interface CancellationTokenSource extends CancellationToken {
    cancel: () => void
}


export function createCancellationTokenSource() {
    const callbacks: (() => void)[] = []
    const cancellationTokenSource : Partial<CancellationTokenSource> = {
        isCancellationRequested: false
    }


    cancellationTokenSource.registerCancellationCallback = fn => {
        if (cancellationTokenSource.isCancellationRequested) {
            fn()
        } else {
            callbacks.push(fn)
        }
    }

    cancellationTokenSource.cancel = () => {
        if (!cancellationTokenSource.isCancellationRequested) {
            cancellationTokenSource.isCancellationRequested = true
            for(const callback of callbacks) {
                callback()
            }
        }
    }

    cancellationTokenSource.throwIfCancelled = () => {
        if (cancellationTokenSource.isCancellationRequested) {
            throw new TypeError(CancelToken.CancelMessage)
        }
    }

    return cancellationTokenSource as CancellationTokenSource
}


export const CancelToken =  {
    get None() : CancellationToken {
        return {
            isCancellationRequested: false,
            throwIfCancelled: () => {},
            registerCancellationCallback: () => {}
        }
    },
    get CancelMessage() : string {
        return 'Operation was cancelled'
    }
}
