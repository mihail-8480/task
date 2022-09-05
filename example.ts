import {queueTask, Actions, action, CancellationToken, setDefaultDebugStatus, setDefaultQueueLimit} from "./lib"

setDefaultQueueLimit(40)
setDefaultDebugStatus(true);


(async() => {
    for(let i = 0; i < 1000; i++) {
        queueTask(async (token: CancellationToken) => {
            await action(Actions.delay(1000), token)
            console.log("task complete", i)
        })
        await action(Actions.delay(20))
    }
})()


