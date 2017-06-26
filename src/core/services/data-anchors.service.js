import { forEach } from 'core/helpers';
import { rendererService as renderer } from 'core/services';

function DataAnchorsService() {
    var self = this;

    self.retrieveAnchors = function (target) {
        return Array.prototype.reduce.call(target.querySelectorAll('[data-anchor]'), (acc, node) => {
            var key  = node.getAttribute('data-anchor');
            acc[key] = acc[key] || [];
            acc[key].push(node);
            node._fetchEmpty = (node.getAttribute('data-anchor-fetchempty') === 'true');
            return acc;
        }, {});
    };

    self.updateAnchorsWithElements = function (currentAnchors, newAnchors) {
        forEach(newAnchors, (nodes, key) => {
            if ( currentAnchors[key] ) {
                currentAnchors[key].forEach((element, i) => self.updateAnchorWithElement(element, nodes[i] || nodes[nodes.length-1]));
            }
        })
    };

    self.updateAnchorWithElement = function (target, newElement) {
        if ( target._fetchEmpty || newElement.firstChild ) {
            newElement = newElement.cloneNode(true);
            self.clear(target);
            while (newElement.firstChild) {
                target.appendChild(newElement.firstChild);
            }
            renderer.process(target);
        }
    };

    self.clear = function(target) {
        return renderer.clear(target);
    };

}

export var dataAnchorsService = new DataAnchorsService();
