const ELEMENT_LENGTH = Int32Array.BYTES_PER_ELEMENT // 4 bytes

/*
  |     Cell     |       Size      |
  |--------------|-----------------|
  | lock flag    | Int32 (4 bytes) |
  | value length | Int32 (4 bytes) |
  | value        | 5 MB            |
*/

// Main thread part
function serialize(sab, rawValue) {
  const te = new TextEncoder();
  const value = te.encode(rawValue); // UInt8Array
  const dv = new DataView(sab);
  dv.setInt32(1, value.byteLength); // second Int32 is a length of a value
  const valueView = new Uint8Array(sab, ELEMENT_LENGTH * 2);
  valueView.set(value); // the rest is an actual value
}

export function exposeApi(worker, api) {
  const sab = new SharedArrayBuffer(ELEMENT_LENGTH * 2 + 1024 * 1024 * 5);
  const i32v = new Int32Array(sab);

  const methods = Object.keys(api);

  // Send SAB and methods names to the Worker thread
  worker.postMessage([sab, ...methods]);

  // listen to the messages from the Worker thread
  worker.addEventListener('message', ({ data }) => {
    const [method, ...args] = data;
    // call the API method
    const result = api[method](...args);
    // if the method has a return value, serialize it
    if (result != null) {
      serialize(sab, result);
    }
    // lock the Worker thread
    i32v[0] = 1;
    // notify that value is ready
    Atomics.notify(i32v, 0);
  });
}
// End of main thread part

// Worker thread part
function deserialize(sab) {
  const dv = new DataView(sab);
  const length = dv.getInt32(1);
  if (length === 0) return;
  const valueView = new Uint8Array(sab, ELEMENT_LENGTH * 2, length);

  // this is implemented in WebKit only
  // const dc = new TextDecoder();
  // return dc.decode(valueView);

  // so we use this for now
  return String.fromCharCode.apply(null, valueView);
}

function createApi(scheme, sab) {
  const i32v = new Int32Array(sab);
  return Object.fromEntries(scheme.map(name => [
    name,
    (...args) => {
      // send a call to the main thread
      self.postMessage([name, ...args]);
      // wait for the main thread to return a value
      Atomics.wait(i32v, 0, 0);
      // deserialize the resulting value
      const value = deserialize(sab);
      // TODO: support async calls too
      //  if (isPromiseLike) { ... }
      // unlock the Worker thread
      i32v[0] = 0;
      return value;
    }
  ]));
}

export function useApi() {
  return new Promise(resolve => {
    // get method names from the main thread
    self.addEventListener('message', ({ data }) => {
      const [sab, ...methods] = data;
      resolve(createApi(methods, sab));
    }, { once: true });
  });
}
// End of Worker thread part
