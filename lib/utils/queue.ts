export function enqueue<T>(array: T[], object: T) {
    return [object].concat(array)
}

export function dequeue<T>(array: T[], amount: number) : T[] {
    const result = []
    while(amount && array.length) {
        const value = array.pop()
        if (value !== undefined) {
            result.push(value)
            amount--
        }
    }
    return result
}
