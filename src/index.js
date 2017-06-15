import * as processors from './processors';

function component () {
    var element = document.createElement('div');

    element.textContent = 'Hello, world!';

    return element;
}

document.body.appendChild(component());

// ENV is injected 'runtime' from environment config
console.log(ENV);
