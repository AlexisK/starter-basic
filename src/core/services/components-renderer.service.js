import * as components from 'app_modules/components';
import { ComponentRenderSession } from 'core/classes';

const componentsSelectorsMapping = Object.keys(components).reduce((acc, key) => {
  let component = components[key];
  acc[component.__selector] = component;
  return acc;
}, {});


export class ComponentsRendererService {
  process(target) {
    for (let selector in componentsSelectorsMapping) {
      let component = componentsSelectorsMapping[selector];
      Array.prototype.forEach.call(target.querySelectorAll(selector), node => {
        this.processComponent(node, component);
      });
    }
  }

  clear(target) {
    for (let selector in componentsSelectorsMapping) {
      let component = componentsSelectorsMapping[selector];
      Array.prototype.forEach.call(target.querySelectorAll(selector), node => {
        this.clearComponent(node);
      });
    }
  }

  processComponent(node, component) {
    if (!node._renderSession) {
      node._renderSession = new ComponentRenderSession(
        new component({ parent, renderer: this }),
        node
      );
    } else {
      node._renderSession.refresh();
    }
  }

  clearComponent(target) {
    if (target._renderSession) {
      target._renderSession.destructor();
      delete target._renderSession;
    }
  }
}

export const componentsRendererService = new ComponentsRendererService();
