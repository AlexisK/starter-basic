import { forEach } from 'core/helpers';
import { rendererService as renderer } from 'core/services';

export class DataAnchorsService {
    
    retrieveAnchors(target) {
        return Array.prototype.reduce.call(target.querySelectorAll('[data-anchor]'), (acc, node) => {
            var key  = node.getAttribute('data-anchor');
            acc[key] = acc[key] || [];
            acc[key].push(node);
            node._fetchEmpty = (node.getAttribute('data-anchor-fetchempty') === 'true');
            return acc;
        }, {});
    };

    updateAnchorsWithElements(currentAnchors, newAnchors) {
        forEach(newAnchors, (nodes, key) => {
            if ( currentAnchors[key] ) {
                currentAnchors[key].forEach((element, i) => this.updateAnchorWithElement(element, nodes[i] || nodes[nodes.length-1]));
            }
        })
    };

    updateAnchorWithElement(target, newElement) {
        if ( target._fetchEmpty || newElement.firstChild ) {
            newElement = newElement.cloneNode(true);
            this.clear(target);
            while (newElement.firstChild) {
                target.appendChild(newElement.firstChild);
            }
            renderer.process(target);
        }
    };

    clear(target) {
        return renderer.clear(target);
    };

}

export const dataAnchorsService = new DataAnchorsService();
