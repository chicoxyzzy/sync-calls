import { exposeApi } from './api.js';

const storageWorker = new Worker('worker.js', {
  type: 'module',
  name: 'storage-worker',
});

const api = {
  getItem(key) {
    const result = localStorage.getItem(key);
    console.log('read', key, result);
    return result;
  },
  setItem(key, value) {
    localStorage.setItem(key, value);
    console.log('write', key, value);
  },
  log(string) {
    console.log(string)
  },
};

exposeApi(storageWorker, api);
