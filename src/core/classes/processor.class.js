export function Processor(params) {
    var self = this;
    Object.assign(self, {
        init: () => {},
        process: () => {},
        destroy: () => {}
    }, params);
}
