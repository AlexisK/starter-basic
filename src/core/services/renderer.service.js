import * as processors from 'app_modules/processors';

var processorByName = Object.keys(processors).reduce((acc, key) => {
    var processor       = processors[key];
    acc[processor.name] = processor;
    return acc;
}, {});

function RendererService() {
    var self = this;

    self.process = function (target) {
        Array.prototype.forEach.call(target.querySelectorAll('[data-processors]'), node => {
            node._processed       = node._processed || {};
            node._processorParams = node._processorParams || {};
            var nodeProcessors    = node.getAttribute('data-processors').split(/,\s*/).map(k => processorByName[k]);
            nodeProcessors.forEach(processor => {
                var params = node.getAttribute('data-processor-' + processor.name);
                if ( params ) { params = JSON.parse(params); }
                node._processorParams[processor.name] = params;

                if ( !node._processed[processor.name] ) {
                    processor.init(processor, node, params);
                    node._processed[processor.name] = true;
                }
                processor.process(processor, node, params); // This one should work on dom refresh - but I don't have any right now
            });
        });
    };

    self.clear = function (target) {
        Array.prototype.forEach.call(target.querySelectorAll('[data-processors]'), node => {
            if ( node._processed ) {
                for (var processorName in node._processed) {
                    var processor = processorByName[processorName];
                    processor.destroy(processor, node, node._processorParams[processor.name]);
                }
            }
        });
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }
    };

    self.destroy = function (target) {
        self.clear(target);

        if ( target.parentNode ) {
            target.parentNode.removeChild(target);
        }
    };
}

export var rendererService = new RendererService();
