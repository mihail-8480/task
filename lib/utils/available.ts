export interface Available {
    available: boolean
}

export function deferUntilAvailable<T>(obj : Available, fn : (value: T) => void) {
    return (value: T) => {
        if (!obj.available) {
            queueMicrotask(() => deferUntilAvailable(obj, fn)(value))
        } else {
            fn(value)
        }
    }
}
