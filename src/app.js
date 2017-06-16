import { rendererService as renderer } from 'core/services';

export function App() {
    var self = this;

    self.init = function() {
        renderer.process(document.body);
    }
}