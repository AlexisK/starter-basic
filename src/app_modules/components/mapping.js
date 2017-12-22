import * as components from './index';

export const componentsMapping = Object.keys(components).reduce((acc, key) => {
  let component = components[key];
  acc[component.__selector] = component;
  return acc;
}, {});
