import { Processor } from 'core/classes';
import { routingService as routing } from 'core/services';

export const DynamicLinkSilentProcessor = new Processor({
    name: 'link-silent',
    init: (self, params) => {
        self.node.onclick = ev => {
            ev.preventDefault();
            ev.stopPropagation();
            routing.goSilent(self.node.href);
        }
    }
});
