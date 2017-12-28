import { Component } from "core/classes";
export * from './todo-list-item/todo-list-item.component';

@Component({
  selector: 'todo-list',
  template: './todo-list.component.html',
  styles: './todo-list.component.scss'
})
export class TodoListComponent {
  constructor() {
    this.inputNode = null;
    this.inputValue = '';
    this.stressTestString = '';

    this.data = [
      [true, 'Option 1'],
      [false, 'Option 2'],
      [false, 'Option 3'],
      ...new Array(1000).fill().map((v, k) => [false, k])
    ]
  }

  onKeyUp(ev) {
    if (ev.keyCode === 13) {
      this.addOption(ev.target.value);
    } else {
      this.inputValue = ev.target.value;
    }
    this.refresh('inputValue');
  }

  addOption(text) {
    this.inputValue = '';
    this.data.push([false, text]);
    this.refresh();
  }

  removeOption(option) {
    let ind = this.data.indexOf(option);
    if (ind >= 0) {
      this.data.splice(ind, 1);
      this.refresh('data');
    }
  }
}