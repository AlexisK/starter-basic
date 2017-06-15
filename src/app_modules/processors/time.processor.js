import { Processor } from 'core';

export const TimeProcessor = new Processor({
    name    : 'time',
    init    : (self, node) => node.value = node.textContent,
    process : (self, node) => {
        node.textContent = new Date(node.value)
    }
});