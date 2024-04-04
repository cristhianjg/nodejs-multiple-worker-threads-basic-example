import { parentPort } from "worker_threads";

parentPort.on("message", (countUpTo) => {
  const randomError = Math.floor(Math.random() * 2);

  if (randomError) {
    throw new Error(`Random Error`);
  }

  const tick = performance.now();

  let count = 0;

  for (let i = 0; i < countUpTo; i++) {
    count++;
  }

  const tock = performance.now();

  console.log("Final count: ", count);
  console.log(
    `Count took ${Math.trunc(tock - tick) / 1000} seconds to execute`
  );

  parentPort.postMessage(count);
});
