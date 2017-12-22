import { evalRenderMap, evalExpression, lazyTimeframe, runLazy, diff } from 'core/utils';
// import { componentsRendererService } from 'core/services';
import { componentsMapping } from 'app_modules/components/mapping';
import {
  checkRefs, checkInputs, checkBindings,
  checkComponentInputs,
  render_element, createAnchor
} from './component-renderer-helper';

export class ComponentRenderSession {
  constructor(componentInstance, parent) {
    this.parent = parent;
    this.componentInstance = componentInstance;
    this.refreshWorkers = {};

    this.ctx = {};
    this.ctx.__proto__ = this.componentInstance;
    this.evalRenderMap = evalRenderMap.bind(this.ctx);
    this.evalExpression = evalExpression.bind(this.ctx);

    this.componentInstance.refresh = this.refresh.bind(this);

    this._renderBinding = [
      () => { },
      this._render_text.bind(this),
      this._render_tag.bind(this),
      this._render_component.bind(this)
    ];

    setTimeout(() => this.renderTemplate(), 1);
  }

  destructor() {
    let list = Array.prototype.slice.call(this.parent.children);
    for (let i = 0; i < list.length; i++) {
      this._clearTarget(list[i]);
    }
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
      // this.childRenderSessions.forEach(s => s.refresh(targetVar));
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
    // componentsRendererService.clear(this.parent);
    this.refreshWorkers = {};
    let target;
    while (target = this.parent.firstChild) {
      this.parent.removeChild(target);
    }
  }

  renderTemplate() {
    this.clearTemplate();
    this.parent.appendChild(this.render(this.componentInstance.__template));
    // componentsRendererService.process(this.parent);
    // console.log(this.componentInstance.__template);
  }

  render(template) {
    let result = document.createDocumentFragment();

    if (template.constructor === Array) {
      template.forEach(rule => {
        result.appendChild(this.render(rule));
      });
    } else if (template.type && this._renderBinding[template.type]) {

      // ---------------------------------- FOR ----------------------------------
      if (template._for) {
        let [varName, expr] = template._for;
        let anchor = createAnchor(result);
        anchor._savedList = [];
        anchor._renderedItems = [];

        let worker = () => {
          let list = this.evalExpression(expr);

          // console.log('DIFF:');
          diff(anchor._savedList, list, {
            onInsert: (item, pos) => {
              // console.log('onInsert', item, pos, anchor._savedList.length);
              this.ctx[varName] = item;
              let newItem = this._renderBinding[template.type](template);

              // console.log(newItem, pos, anchor._renderedItems);
              if (pos == anchor._renderedItems.length) {
                anchor.parentNode.insertBefore(newItem, anchor);
              } else {
                anchor.parentNode.insertBefore(newItem, anchor._renderedItems[pos]);
              }
              anchor._renderedItems.push(newItem);
            },
            onDelete: (item, pos) => {
              let node = anchor._renderedItems[pos];
              // componentsRendererService.clear(node);
              anchor.parentNode.removeChild(node);
              anchor._renderedItems.splice(pos, 1);
            },
            onMove: (item, posFrom, posTo) => {
              let nodeFrom = anchor._renderedItems[posFrom];
              anchor.parentNode.insertBefore(nodeFrom, anchor._renderedItems[posTo]);
              anchor._renderedItems.splice(posFrom, 1);
              anchor._renderedItems.splice(posTo, 0, nodeFrom);
            }
          });

          // console.log('anchor._savedList = list.slice()');
          anchor._savedList = list.slice();
        }

        template._forVars.forEach(varName => this.registerWorker(varName, worker));
        worker();


        // ---------------------------------- IF ----------------------------------
      } else if (template._if) {
        let expr = template._if;
        let anchor = createAnchor(result);

        anchor._renderedItem = null;
        let worker = () => {
          if (this.evalExpression(expr)) {
            if (!anchor._renderedItem) {
              anchor._renderedItem = this._renderBinding[template.type](template);
              anchor.parentNode ? anchor.parentNode.insertBefore(anchor._renderedItem, anchor) : null;
            }
          } else if (anchor._renderedItem) {
            // componentsRendererService.clear(anchor._renderedItem);
            anchor._renderedItem.parentNode ? anchor._renderedItem.parentNode.removeChild(anchor._renderedItem) : null;
            anchor._renderedItem = null;
          }
        }

        template._ifVars.forEach(varName => this.registerWorker(varName, worker));
        worker();


        // ---------------------------------- FOR ----------------------------------
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
    let newNode = render_element(template);

    checkRefs.call(this, template, newNode);

    let hasInputs = checkInputs.call(this, template, newNode);
    let hasBindings = checkBindings.call(this, template, newNode);
    if (hasInputs || hasBindings) {
      newNode._ctx = this.copyContext();
    }

    if (template.children) {
      template.children.forEach(child => {
        newNode.appendChild(this.render(child));
      });
    }

    return newNode;
  }


  _render_component(template) {
    let component = componentsMapping[template._componentSelector];
    let parent = render_element(template);
    parent._ctx = this.copyContext();

    let componentInstance = new component({ parent, renderer: this });

    parent._renderSession = new ComponentRenderSession(
      componentInstance,
      parent
    );

    checkComponentInputs.call(this, template, parent, componentInstance);

    return parent;
  }


  _clearTarget(target) {
    if (target._renderSession) {
      _renderSession.destructor();
    } else {
      let list = Array.prototype.slice.call(target.children);
      for (let i = 0; i < list.length; i++) {
        this._clearTarget(list[i]);
      }
    }
  }

}
