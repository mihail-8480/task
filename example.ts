import {queueTask, cancelTask, Actions, action, CancellationToken} from "./lib"


async function myTask(token: CancellationToken) {
    while (!token.isCancellationRequested) {
        await action(Actions.delay(100), token)
        console.log("test")
    }
}

const task = queueTask(myTask)

setTimeout(async() => {
    await cancelTask(task)
}, 1000)

