import { evalRenderMap, evalExpression } from '../utils/eval-expression';
import { componentsRendererService } from '../services/components-renderer.service';
import { lazyTimeframe, runLazy } from '../utils/lazy-balancer';

const attributesMapping = {
  class: 'className'
};

const attributesWithoutValue = {
  disabled: true,
  checked: true
}


export class ComponentRenderSession {
  constructor(componentInstance, parent) {
    this.parent = parent;
    this.componentInstance = componentInstance;
    this.refreshWorkers = {};

    this.ctx = {};
    this.ctx.__proto__ = this.componentInstance;
    this.evalRenderMap = evalRenderMap.bind(this.ctx);
    this.evalExpression = evalExpression.bind(this.ctx);

    this.componentInstance.refresh = () => this.refresh();

    this._renderBinding = [
      () => { },
      this._render_text.bind(this),
      this._render_tag.bind(this)
    ];

    setTimeout(() => this.renderTemplate(), 1);
  }

  destructor() {
    this.clearTemplate();
    delete this.componentInstance.refresh;
  }

  refresh(targetVar) {
    if (!targetVar) {
      for (let varName in this.refreshWorkers) {
        this.refresh(varName);
      }
    } else if (this.refreshWorkers[targetVar]) {
      this.refreshWorkers[targetVar].forEach(w => w());
    }
  }

  registerWorker(varName, worker) {
    this.refreshWorkers[varName] = this.refreshWorkers[varName] || [];
    this.refreshWorkers[varName].push(worker);
  }

  copyContext() {
    let ctxCopy = Object.assign({}, this.ctx);
    ctxCopy.__proto__ = this.ctx;
    return ctxCopy;
  }

  clearTemplate() {
    componentsRendererService.clear(this.parent);
    this.refreshWorkers = {};
    let target;
    while (target = this.parent.firstChild) {
      this.parent.removeChild(target);
    }
  }

  renderTemplate() {
    this.clearTemplate();
    this.parent.appendChild(this.render(this.componentInstance.__template));
    componentsRendererService.process(this.parent);
    // console.log(this.componentInstance.__template);
  }

  render(template) {
    let result = document.createDocumentFragment();

    if (template.constructor === Array) {
      template.forEach(rule => {
        result.appendChild(this.render(rule));
      });
    } else if (template.type && this._renderBinding[template.type]) {

      if (template._for) {
        let [varName, expr] = template._for;
        let anchor = this.createAnchor(result);

        anchor._renderedItems = [];
        let stopBalancer = () => { };
        let worker = () => {
          let list = this.evalExpression(expr);

          anchor._renderedItems.forEach(node => {
            componentsRendererService.clear(node);
            node.parentNode ? node.parentNode.removeChild(node) : null;
          });
          anchor._renderedItems = [];

          // let domBundle = document.createDocumentFragment();

          let index = 0;
          let lazyWorker = () => {
            let item = list[index];
            this.ctx[varName] = item;
            let newItem = this._renderBinding[template.type](template);
            anchor._renderedItems.push(newItem);
            // domBundle.appendChild(newItem, anchor);
            anchor.parentNode ? anchor.parentNode.insertBefore(newItem, anchor) : null;
            index++;
            return index < list.length;
          }

          stopBalancer();
          stopBalancer = runLazy(lazyWorker);
          // list.forEach(item => {
          //   this.ctx[varName] = item;
          //   let newItem = this._renderBinding[template.type](template);
          //   anchor._renderedItems.push(newItem);
          //   domBundle.appendChild(newItem, anchor);
          // });
          // delete this.ctx[varName];
          // anchor.parentNode ? anchor.parentNode.insertBefore(domBundle, anchor) : null;
        }

        template._forVars.forEach(varName => this.registerWorker(varName, worker));
        worker();
      } else if (template._if) {
        let expr = template._if;
        let anchor = this.createAnchor(result);

        anchor._renderedItem = null;
        let worker = () => {
          if (this.evalExpression(expr)) {
            if (!anchor._renderedItem) {
              anchor._renderedItem = this._renderBinding[template.type](template);
              anchor.parentNode ? anchor.parentNode.insertBefore(anchor._renderedItem, anchor) : null;
            }
          } else if (anchor._renderedItem) {
            componentsRendererService.clear(anchor._renderedItem);
            anchor._renderedItem.parentNode ? anchor._renderedItem.parentNode.removeChild(anchor._renderedItem) : null;
            anchor._renderedItem = null;
          }
        }
        
        template._ifVars.forEach(varName => this.registerWorker(varName, worker));
        worker();
      } else {
        result.appendChild(this._renderBinding[template.type](template));
      }

    } else {
      console.log('Failed to render template', { template, ctx });
    }
    return result;
  }

  _render_text(template) {
    if (template._renderMap) {
      let newNode = document.createTextNode('');
      let worker = () => newNode.textContent = this.evalRenderMap(template._renderMap, newNode._ctx);

      newNode._ctx = this.copyContext();
      template._renderVars.forEach(varName => this.registerWorker(varName, worker));
      worker();

      return newNode;
    }
    return document.createTextNode(template.data);
  }

  _render_tag(template) {
    let newNode = this._render_element(template);
    let needContextCopy = false;

    if (template._ref) {
      this.componentInstance[template._ref] = newNode;
    }

    if (template._inputs) {
      needContextCopy = true;
      for (let attr in template._inputs) {
        let expr = template._inputs[attr];

        let worker = () => {
          if (!(document.activeElement === newNode && attr === 'value')) {
            newNode[attributesMapping[attr] || attr] = this.evalExpression(expr, newNode._ctx);
          }
        }

        template._inputVars[attr].forEach(varName => this.registerWorker(varName, worker));
        worker();
      }
    }

    if (template._bindings) {
      needContextCopy = true;
      for (let eventName in template._bindings) {
        let expr = template._bindings[eventName];

        newNode.addEventListener(eventName, ev => {
          (newNode._ctx || this.ctx)['$event'] = ev;
          this.evalExpression(expr, newNode._ctx);
          delete this.ctx['$event'];
          template._bindVars[eventName].forEach(varName => this.refresh(varName));
        });
      }
    }

    if (needContextCopy) {
      newNode._ctx = this.copyContext();
    }

    if (template.children) {
      template.children.forEach(child => {
        newNode.appendChild(this.render(child));
      });
    }

    return newNode;
  }

  _render_element(template) {
    let newNode;

    if (template._NS) {
      newNode = document.createElementNS(template._NS, template.name);
      newNode._NS = template._NS;

      template.attribs.forEach(pair => {
        newNode.setAttribute(pair[0], pair[1]);
      });
    } else {
      newNode = document.createElement(template.name);

      template.attribs.forEach(pair => {
        newNode.setAttribute(pair[0], pair[1]);
        if (pair[1] || !attributesWithoutValue[pair[0]]) {
          newNode[pair[0]] = pair[1];
        }
      });
    }
    return newNode;
  }

  createAnchor(target) {
    let newNode = document.createComment('');
    target.appendChild(newNode);
    return newNode;
  }
}
