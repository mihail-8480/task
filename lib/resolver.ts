import {Available} from "./utils/available";

export interface Resolver<T> extends Available {
    future: Promise<T>,
    resolve: (value: T) => void,
    reject: (err: any) => void,
    complete: boolean
}

export function createResolver<T>() : Resolver<T> {
    const resolver : Partial<Resolver<T>> = {
        resolve: () => {},
        available: false,
        complete: false
    }
    resolver.future = new Promise<T>((resolve, reject) => {
        resolver.resolve = obj => {
            if (!resolver.complete) {
                resolver.complete = true
                resolve(obj)
            }
        }
        resolver.reject = obj => {
            if (!resolver.complete) {
                resolver.complete = true
                reject(obj)
            }
        }
        resolver.available = true
    })
    return resolver as Resolver<T>
}
