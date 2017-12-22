import {componentsMapping} from 'app_modules/components/mapping';
import { ComponentRenderSession } from 'core/classes';


export class ComponentsRendererService {
  process(target) {
    for (let selector in componentsMapping) {
      let component = componentsMapping[selector];
      Array.prototype.forEach.call(target.querySelectorAll(selector), node => {
        this.processComponent(node, component);
      });
    }
  }

  clear(target) {
    for (let selector in componentsMapping) {
      let component = componentsMapping[selector];
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
