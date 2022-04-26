const ELEMENT_LENGTH = Int32Array.BYTES_PER_ELEMENT

/*
| Flag | Length | String
--------------------------
| 1/0  |   1    | value  |
|   4  |   1    | 5 MiB  |
*/

function serialize(sab, rawValue) {
  const te = new TextEncoder();
  const value = te.encode(rawValue); // UInt8Array
  const dv = new DataView(sab);
  dv.setInt32(1, value.byteLength);
  const valueView = new Uint8Array(sab, ELEMENT_LENGTH * 2);
  valueView.set(value);
}

function deserialize(sab) {
  const dv = new DataView(sab);
  const length = dv.getInt32(1);
  if (length === 0) return;
  const valueView = new Uint8Array(sab, ELEMENT_LENGTH * 2, length);
  const dc = new TextDecoder();
  return dc.decode(valueView);
  // return String.fromCharCode.apply(null, valueView);
}

export function exposeApi(worker, api) {
  const sab = new SharedArrayBuffer(ELEMENT_LENGTH * 2 + 1024 * 1024 * 5); // 4
  const i32v = new Int32Array(sab);

  const methods = Object.keys(api);

  worker.postMessage([sab, ...methods]);

  worker.addEventListener('message', ({ data }) => {
    const [method, ...args /* 'Earth', 'Mostly harmless', 1  */] = data;
    const result = api[method](...args);
    if (result != null) {
      serialize(sab, result);
    }
    i32v[0] = 1;
    Atomics.notify(i32v, 0);
  });
}

function createApi(scheme, sab) {
  const i32v = new Int32Array(sab);
  return Object.fromEntries(scheme.map(name => [
    name,
    (...args) => {
      self.postMessage([name, ...args]);
      Atomics.wait(i32v, 0, 0);

      const value = deserialize(sab);
      // if (isPromiseLike)
      i32v[0] = 0;
      return value;
    }
  ]));
}

export function useApi() {
  return new Promise(resolve => {
    self.addEventListener('message', ({ data }) => {
      const [sab, ...methods] = data;
      resolve(createApi(methods, sab));
    });
  });
}