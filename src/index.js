import express from "express";
import { Worker } from "node:worker_threads";
import * as os from "os";
const cpuCount = os.cpus().length;

const app = express();

const port = 3010;

app.get("/normal", (req, res) => {
  const tick = performance.now();

  res.status(200).send("Normal");

  const tock = performance.now();

  console.log(
    `Normal took ${Math.trunc(tock - tick) / 1000} seconds to execute`
  );
});

app.get("/slow-non-blocking", (req, res) => {
  const MAX_TASKS = 20_000_000_000;
  const cpuCount = os.cpus().length;

  if (!cpuCount || isNaN(cpuCount)) {
    return res
      .status(400)
      .send("Error: could not retrieve cpu count information from OS");
  }

  let completed = 0;
  let errors = 0;
  let counterCount = 0;
  let exit = 0;

  for (let i = 0; i < cpuCount; i++) {
    const worker = new Worker("./src/counter.js", {
      execArgv: [...process.execArgv, "--unhandled-rejections=strict"],
    });

    worker.postMessage(Math.round(MAX_TASKS / cpuCount));

    worker.on("message", (data) => {
      console.log(`Worker ${i} completed.`);
      counterCount += data;
      completed++;

      worker.terminate();
    });

    worker.on("error", (error) => {
      errors++;

      console.log(`Worker ${i} error: `, error);

      worker.terminate();
    });

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
  }
});

app.get("/slow-blocking", (req, res) => {
  let count = 0;

  const tick = performance.now();

  for (let i = 0; i < 20_000_000_000; i++) {
    count++;
  }

  const tock = performance.now();

  console.log("Final count: ", count);
  console.log(
    `Count took ${Math.trunc(tock - tick) / 1000} seconds to execute`
  );

  res.status(200).send("Slow blocking count: " + count);
});

app.listen(port, () => {
  console.log("Server listening on port ", port);
});
