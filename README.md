# NodeJS - Worker threads - Basic example using multiple workers

In Node.js, worker threads are a feature introduced **to allow developers to run JavaScript code in parallel, taking advantage of multi-core systems**. Node.js traditionally operates in a single-threaded, event-driven manner.

Worker threads are particularly useful for handling CPU-bound operations such as cryptographic operations, data compression/decompression, image processing, video encoding/decoding, and mathematical computations.

In this basic example, we've set three endpoints to test this feature using multiple workers to efficiently utilize multi-core CPUs:

- `/normal`: this endpoint responds with a "Normal" string and doesn't have any other logic;
- `/slow-blocking`: this endpoint responds with a "Slow blocking" string after executing a basic cpu-intensive task (counter);
- `/slow-non-blocking`: this endpoint responds with a "Slow non-blocking" string after executing a basic cpu-intensive task (counter) using a number of worker threads based on available cpu's cores;

## What should I test and how?

### First scenario: blocking task (without worker thread)

1. Open two browser tabs;
2. Go to [localhost:3010/slow-blocking](localhost:3010/slow-blocking) on the first tab
3. Go to [localhost:3010/normal](localhost:3010/normal) on the second tab

This will take some time to display "Slow non-blocking ..." text in the "/slow-non-blocking" tab, while keeping "/normal" tab waiting for response. Once finished the cpu-intensive task on "/slow-non-blocking" it will respond with the above mentioned text, and only after that "/normal" request will be executed and will respond with a "Normal" text.

If we had executed "/normal" first and "/slow..." second (you can test it), we wouldn't have had to wait for "/slow-blocking" to finish to have the "/normal" tab response. We would receive "Normal" inmediately, and would have to wait for "/slow..." until it finish.

The core issue here is that in this scenario both tasks "/normal" and "/slow-blocking" are executed in the Main Thread in the same order that they were executed. So, if we execute the blocking task first we will have to wait for it to finish to be able to receive the normal task response.

### Second scenario: non-blocking task (with worker thread)

1. Open two browser tabs;
2. Go to [localhost:3010/slow-non-blocking](localhost:3010/slow-non-blocking) on the first tab
3. Go to [localhost:3010/normal](localhost:3010/normal) on the second tab

This will show "Normal" text inmediately on the "/normal" tab, and will take some time to display "Slow non-blocking" text in the "/slow-non-blocking" tab.

In this one, the fundamental aspect to understand is that unlike the previous scenario and thanks to the use of "worker threads" the "/slow-non-blocking" endpoint is not blocking the "/normal" tab execution, because the cpu-intensive task from "/slow..." is being executed in one or many parallel threads aside from the Main Thread.

### Added information

This example goes one step further from the one on the other project ([nodejs-worker-threads-basic-example](https://github.com/cristhianjg/nodejs-worker-threads-basic-example)).

Firstly, we're using multiple worker threads, splitting the counter number evenly between available cpu cores.

We've also used event handlers to send a message with a parameter to the worker to trigger the job:

From index.js (main)

```
worker.postMessage(Math.round(MAX_TASKS / cpuCount));
```

From counter.js (worker)

```
parentPort.on("message", (countUpTo) => {
  ...
}
```

Finally, we use data received from the workers to handle workers termination, and server response:

Terminate worker execution from index.js

```
worker.on("message", (data) => {
  console.log(`Worker ${i} completed.`);
  counterCount += data;
  completed++;

  worker.terminate();
});
```

Handle exit and server response from index.js:

````
worker.on("exit", () => {
      exit++;

      if (completed + errors === cpuCount) {
        if (errors === cpuCount) {
          res
            .status(400)
            .send(
              `Slow non-blocking:\nCompleted: ${completed}\nError: ${errors}\nCount: ${counterCount}\nExit: ${exit}`
            );
        } else {
          res
            .status(200)
            .send(
              `Slow non-blocking:\nCompleted: ${completed}\nError: ${errors}\nCount: ${counterCount}\nExit: ${exit}`
            );
        }
      }
    });
```
````
