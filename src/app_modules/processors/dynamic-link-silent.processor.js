import { Processor } from 'core/classes';
import { routingService as routing } from 'core/services';

export var DynamicLinkSilentProcessor = new Processor({
    name: 'link-silent',
    init: (self, node, params) => {
        node.onclick = ev => {
            ev.preventDefault();
            ev.stopPropagation();
            routing.goSilent(node.href);
        }
    }
});