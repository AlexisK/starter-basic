import { Processor } from 'core/classes';
import { routingService as routing } from 'core/services';

export const DynamicLinkProcessor = new Processor({
    name: 'link',
    init: (self, node, params) => {
        node.onclick = ev => {
            ev.preventDefault();
            ev.stopPropagation();
            if ( params && params.history === false ) {
                routing.goSilent(node.href);
            } else {
                routing.navigate(node.href);
            }
        }
    }
});