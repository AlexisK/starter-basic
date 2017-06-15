import {App} from './app';

// ENV is injected 'runtime' from environment config
console.log('Environment', ENV);

new App().init();

