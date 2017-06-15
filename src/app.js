import * as processors from 'app_modules/processors';

const processorByName = Object.keys(processors).reduce((acc, key) => {
    var processor = processors[key];
    acc[processor.name] = processor;
    return acc;
}, {});

export function App() {
    var self = this;

    self.processDom = function() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-processors]'), node => {
            var nodeProcessors = node.getAttribute('data-processors').split(/,\s*/).map(k => processorByName[k]);
            nodeProcessors.forEach(processor => {
                processor.init(processor, node);
                processor.process(processor, node); // This one should work on dom refresh - but I don't have any right now
            });
        });
        for (var k in processors) {
            var processor = processors[k];

        }
    };

    self.init = function() {
        self.processDom();
    }
}