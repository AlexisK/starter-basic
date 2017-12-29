const attributesMapping = {
  class: 'className'
};

const attributesWithoutValue = {
  disabled: true,
  checked: true
}


export function checkRefs(template, newNode) {
  if (template._ref) {
    this.componentInstance[template._ref] = newNode;
  }
}

export function checkInputs(template, newNode) {
  if (template._inputs) {
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
    return true;
  }
}

export function checkComponentInputs(template, parent, componentInstance) {
  if (template._inputs) {
    for (let attr in template._inputs) {
      let expr = template._inputs[attr];
      let attrMapped = attributesMapping[attr] || attr;

      let worker = () => {
        componentInstance[attrMapped] = this.evalExpression(expr, parent._ctx);
        componentInstance.refresh(attrMapped);
      }

      template._inputVars[attr].forEach(varName => this.registerWorker(varName, worker));
      worker();
    }
  }
}

export function checkBindings(template, newNode) {
  newNode._eventListenerWorkers = newNode._eventListenerWorkers || [];
  if (template._bindings) {
    for (let eventName in template._bindings) {
      let expr = template._bindings[eventName];

      let worker = ev => {
        (newNode._ctx || this.ctx)['$event'] = ev;
        this.evalExpression(expr, newNode._ctx);
        delete this.ctx['$event'];
        template._bindVars[eventName].forEach(varName => this.refresh(varName));
      };

      newNode.addEventListener(eventName, worker);
      newNode._eventListenerWorkers.push([eventName, worker]);
    }
    return true;
  }
}

export function render_element(template) {
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

export function createAnchor(target) {
  let newNode = document.createComment('');
  target.appendChild(newNode);
  return newNode;
}