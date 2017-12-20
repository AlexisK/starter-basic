import { Component } from "core/classes";


@Component({
  selector: 'todo-list',
  template: './todo-list.component.html',
  styles: './todo-list.component.scss'
})
export class TodoListComponent {
  constructor() {
    this.inputNode = null;
    this.inputValue = '';

    this.data = [
      [true, 'Option 1'],
      [false, 'Option 2'],
      [false, 'Option 3'],
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