import { useApi } from './api.js';

const syncApi = await useApi();

syncApi.setItem('Earth', 'Mostly harmless');
console.log('this should be 2nd line');
const earth = syncApi.getItem('Earth');
syncApi.log('this should be 4th line');
console.log(earth);
