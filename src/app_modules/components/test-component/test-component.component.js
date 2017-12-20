import { Component } from "core/classes";

@Component({
  selector: 'test-component',
  template: './test-component.component.html',
  styles: './test-component.component.scss'
})
export class TestComponent {
  constructor({ parent }) {
    this.parent = parent;
    this.reset();
  }

  reset() {
    this.x = 10;
    this.params = {
      a: true,
      b: false
    };

    this.str = 'Hello';
  }
}