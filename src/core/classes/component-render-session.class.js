import { evalRenderMap, evalExpression } from '../utils/eval-expression';

const attributesMapping = {
  class: 'className'
};

export class ComponentRenderSession {
  constructor(componentInstance, parent) {
    this.parent = parent;
    this.componentInstance = componentInstance;
    this.evalRenderMap = evalRenderMap.bind(this.componentInstance);
    this.evalExpression = evalExpression.bind(this.componentInstance);
    this.refreshWorkers = {};
    this.componentInstance['$event'] = new Event(null);

    this.componentInstance.refresh = () => this.refresh();

    this._renderBinding = [
      () => { },
      this._render_text.bind(this),
      this._render_tag.bind(this)
    ];

    this.renderTemplate();
  }

  destructor() {
    this.clearTemplate();
    delete this.componentInstance['$event'];
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

  clearTemplate() {
    this.refreshWorkers = {};
    let target;
    while (target = this.parent.firstChild) {
      this.parent.removeChild(target);
    }
  }

  renderTemplate() {
    this.clearTemplate();
    this.parent.appendChild(this.render(this.componentInstance.__template));
    // console.log(this.componentInstance.__template);
  }

  render(template) {
    let result = document.createDocumentFragment();

    if (template.constructor === Array) {
      template.forEach(rule => {
        result.appendChild(this.render(rule));
      });
    } else if (template.type && this._renderBinding[template.type]) {
      result.appendChild(this._renderBinding[template.type](template));
    } else {
      console.log('Failed to render template', { template, ctx });
    }
    return result;
  }

  _render_text(template) {
    if (template._renderMap) {
      let newNode = document.createTextNode('');
      let worker = () => newNode.textContent = this.evalRenderMap(template._renderMap);

      template._renderVars.forEach(varName => this.registerWorker(varName, worker));
      worker();

      return newNode;
    }
    return document.createTextNode(template.data);
  }

  _render_tag(template) {
    let newNode = this._render_element(template);

    if (template._inputs) {
      for (let attr in template._inputs) {
        let expr = template._inputs[attr];

        let worker = () => {
          if (!(document.activeElement === newNode && attr === 'value')) {
            newNode[attributesMapping[attr] || attr] = this.evalExpression(expr);
          }
        }

        template._inputVars[attr].forEach(varName => this.registerWorker(varName, worker));
        worker();
      }
    }

    if (template._bindings) {
      for (let eventName in template._bindings) {
        let expr = template._bindings[eventName];

        newNode.addEventListener(eventName, ev => {
          this.componentInstance['$event'] = ev;
          this.evalExpression(expr);
          template._bindVars[eventName].forEach(varName => this.refresh(varName));
        });
      }
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
        newNode[pair[0]] = pair[1];
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
