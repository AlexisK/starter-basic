import { Processor } from 'core/classes';

export const TimeProcessor = new Processor({
    name    : 'time',
    init    : (self) => self.node.value = self.node.textContent,
    process : (self) => {
        let date = new Date(self.node.value);
        self.node.textContent = [date.getDate(), date.getMonth()+1, date.getFullYear()].join('/')
    }
});