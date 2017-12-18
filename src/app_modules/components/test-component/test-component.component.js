import { Component } from "core/classes";

export const TestComponent = new Component({
  name: 'test-component',
  template: require('./test-component.component.html'),
  style: require('./test-component.component.scss')
});