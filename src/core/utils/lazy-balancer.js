export const lazyTimeframe = 5;
export const lazyTimeLimit = 10;

export function runLazy(worker) {
  let control = {
    isRunning: true
  };
  _runLazy(worker, control);
  return () => control.isRunning = false;
}

export function _runLazy(worker, control) {
  runLazyOnce(worker, control).then(result => {
    if (result) {
      setTimeout(() => _runLazy(worker, control), lazyTimeframe);
    }
  })
}

export function runLazyOnce(worker, control) {
  return new Promise(resolve => {
    let result = true;
    let timeLimit = Date.now() + lazyTimeLimit;

    for (; control.isRunning && (result = worker()) && (Date.now() < timeLimit);) { }
    resolve(result);
  });
}