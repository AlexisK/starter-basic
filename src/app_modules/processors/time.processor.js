import { Processor } from 'core/classes';

export var TimeProcessor = new Processor({
    name    : 'time',
    init    : (self, node) => node.value = node.textContent,
    process : (self, node) => {
        var date = new Date(node.value);
        node.textContent = [date.getDate(), date.getMonth()+1, date.getFullYear()].join('/')
    }
});