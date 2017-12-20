import {Processor} from 'core/classes';
import { rendererService, dataAnchorsService } from 'core/services';

export class Component extends Processor {
  constructor(params) {
    super(params);

    this.events = params.events || {};
    this.template = params.template || null;
    this.style = params.style || null;
  }

  preInit(instance, params) {
    super.preInit(instance, params);

    if ( this.template ) {
      let rendered = this.renderTemplate(this.template, instance.node);
      instance.anchors = rendered.anchors;
      instance._destroyWorkers.push(rendered.removeDom);
    }
    for ( let selector in this.events ) {
      let [event, worker] = this.events[selector];

      if ( instance.anchors[selector] ) {
        instance.anchors[selector].forEach(node => {
          node.addEventListener(event, worker.bind(instance));
        })
      }
    }
  }

  postDestroy(instance) {
    super.postDestroy(instance);
  }

  renderTemplate(html, target) {
    target = target || this.node;

    let docFragment = document.createDocumentFragment();
    let buffer = document.createElement('div');
    let child;
    let nodes = [];

    buffer.innerHTML = html;
    while( child = buffer.firstChild ) {
      docFragment.appendChild(child);
      nodes.push(child);
    }
    let anchors = dataAnchorsService.retrieveAnchors(docFragment);
    rendererService.process(docFragment);
    target.appendChild(docFragment);

    let removeDom = () => {
      nodes.forEach(node => {
        if ( node && node.parentNode ) {
          node.parentNode.removeChild(node);
        }
      });
      nodes = [];
    };

    return {anchors, nodes, removeDom};
  }
}

Component.instanceMethods = [...Processor.instanceMethods, 'renderTemplate'];
