import { useApi } from './api.js';

const localStorage = await useApi();

localStorage.setItem('Earth', 'Mostly harmless');
console.log('this should be 2nd line');
const earth = localStorage.getItem('Earth');
localStorage.foo('this should be 4th line');
console.log(earth);
