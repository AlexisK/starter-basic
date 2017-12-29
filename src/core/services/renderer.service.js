import * as processors from 'app_modules/processors';
import { componentsRendererService } from './components-renderer.service';


var processorByName = [processors].reduce((acc, procesorLike) => {

  Object.keys(procesorLike).forEach(key => {
    var processor = procesorLike[key];
    acc[processor.name] = processor;
  });

  return acc;
}, {})

export class RendererService {

  process(target) {
    Array.prototype.forEach.call(target.querySelectorAll('[data-processors]'), node => {
      node._processed = node._processed || {};
      node._processorInstances = node._processorInstances || {};
      node._processorParams = node._processorParams || {};
      var nodeProcessors = node.getAttribute('data-processors').split(/,\s*/).map(k => processorByName[k]);

      nodeProcessors.forEach(processor => this.applyProcessor(node, processor));
    });
    componentsRendererService.process(target);
  };


  applyProcessor(node, processor) {
    var params = node.getAttribute('data-processor-' + processor.name);
    if (params) { params = JSON.parse(params); }

    node._processorParams[processor.name] = params;
    let instance = this._getProcessorInstance(processor, node);

    if (!node._processed[processor.name]) {
      processor.preInit(instance, params);
      processor.init(instance, params);
      node._processed[processor.name] = true;
    }
    processor.process(instance, params); // This one should work on dom refresh - but I don't have any right now
  }


  _getProcessorInstance(processor, node) {
    if (node._processorInstances[processor.name]) {
      return node._processorInstances[processor.name];
    }
    var instance = node._processorInstances[processor.name] = { node, processor };

    processor._class.instanceMethods.forEach(function (methodName) {
      instance[methodName] = processor[methodName].bind(instance);
    });
    return instance;
  };

  clear(target) {
    Array.prototype.forEach.call(target.querySelectorAll('[data-processors]'), node => {
      if (node._processed) {
        for (var processorName in node._processed) {
          let processor = processorByName[processorName];
          let instance = this._getProcessorInstance(processor, node);

          processor.destroy(processor, node, node._processorParams[processor.name]);
          processor.postDestroy(instance);
        }
      }
    });
    componentsRendererService.clear(target);
    while (target.firstChild) {
      target.removeChild(target.firstChild);
    }
  };

  destroy(target) {
    this.clear(target);

    if (target.parentNode) {
      target.parentNode.removeChild(target);
    }
  };
}

export const rendererService = new RendererService();
