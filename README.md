# This is a proof of concept of exposing a sync calls API from the Web Worker

## The problem

It's only possible to make async calls when a Web Worker sends messages to the
main thread or other Worker threads, ie `postMessage` and `addEventListener`.
Sometimes we want to use synchronous calls instead for various reasons.

## Solution
It is possible to use [`SharedArrayBuffer`][SharedArrayBuffer],
[`Atomics.wait`][Atomics.wait] and [`Atomics.notify`][Atomics.notify] to
achieve that.

Files:
- [main.js](./src/main.js) — main thread which exposes API to the Worker thread
- [worker.js](./src/worker.js) — Worker thread with sync calls
- [api.js](./src/api.js) — this file includes both main thread logic and Worker
thread logic implementation

### In general, this approach can help turn asynchronous calls into synchronous calls.

[SharedArrayBuffer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
[Atomics.wait]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait
[Atomics.notify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/notify
