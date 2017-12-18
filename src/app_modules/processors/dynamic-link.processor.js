import { Processor } from 'core/classes';
import { routingService as routing } from 'core/services';

export const DynamicLinkProcessor = new Processor({
    name: 'link',
    init: (self, params) => {
        self.node.onclick = ev => {
            ev.preventDefault();
            ev.stopPropagation();
            if ( params && params.history === false ) {
                routing.goSilent(self.node.href);
            } else {
                routing.navigate(self.node.href);
            }
        }
    }
});