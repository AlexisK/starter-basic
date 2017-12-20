import { logWarning, logException } from "./log-exception";

//                                                               //
//                    E X P E R I M E N T A L                    //
//                                                               //


const TYPE = {
  constant: 0,
  string: 1,
  operator: 2,
  expression: 3,
  expressionMap: 4,
  scope: 5,
  number: 6,
  function: 7
};

const OPERATOR = {
  plus: 1,
  minus: 2,
  mult: 3,
  div: 4,
  perc: 5,
  and: 6,
  or: 7,
  eq: 8,
  ass: 9
};


let __updateInterval = null;

export function evalRenderMap(renderMap, ctx) {
  let result = [];

  renderMap.forEach(expr => {
    if (expr.constructor === Array) {
      result.push(evalExpression.call(ctx || this, expr[0]));
    } else {
      result.push(expr)
    }
  });

  return result.join('');
}

export function evalExpression(expr, ctx) {
  let result = handleWork(ctx || this, expr.workMap);
  // console.log(expr, this);
  // console.log(result);
  return result.result[0];
}


function addr(obj, keyChain, index = 0) {
  if (!obj || keyChain.length === index) {
    return obj;
  }
  return addr(obj[keyChain[index]], keyChain, index + 1);
}

function addrWrite(obj, keyChain, value) {
  if (keyChain.length == 0) {
    return null;
  }
  if (typeof (keyChain) === 'string') {
    return _addrWrite(obj, [keyChain], value, 0);
  }
  let result = _addrWrite(obj, keyChain, value, 0);

  // if (keyChain.length > 1) {
  //   // trigger setter
  //   obj[keyChain[0]] = obj[keyChain[0]];
  // }

  return result;
}

function _addrWrite(obj, keyChain, value, index) {
  if (!obj || keyChain.length - 1 === index) {
    return getBasicPrototype(obj)[keyChain[index]] = value;
  }
  return _addrWrite(obj[keyChain[index]], keyChain, value, index + 1);
}


function extractVars(workMap) {
  let result = [];
  workMap.forEach(pair => {
    if (pair[0] === TYPE.expression) {
      result.push(pair[1]);
    } else if (pair[0] === TYPE.expressionMap) {
      result.push(pair[1][0]);
    }
  });
  return result;
}

function getBasicPrototype(ref) {
  while (ref.__proto__ instanceof ref.constructor) { ref = ref.__proto__; }
  return ref;
}


// Work by index

const itemHandlers = {
  def: () => undefined,
  [TYPE.constant]: (ctx, pair) => pair[1],
  [TYPE.scope]: (ctx, pair) => handleWork(ctx, pair[1]).result,
  [TYPE.string]: (ctx, pair) => pair[1],
  [TYPE.number]: (ctx, pair) => pair[1],
  [TYPE.expression]: (ctx, pair) => ctx[pair[1]],
  [TYPE.expressionMap]: (ctx, pair) => addr(ctx, pair[1])
};

function handleItem(ctx, pair) {
  if (!pair) { return null; }
  return (itemHandlers[pair[0]] || itemHandlers.def)(ctx, pair);
}

const operatorHandlers = {
  [OPERATOR.plus]: (result, pair, ctx, workMap, i) => result.push(result.pop() + handleItem(ctx, workMap[i])),
  [OPERATOR.minus]: (result, pair, ctx, workMap, i) => result.push(result.pop() - handleItem(ctx, workMap[i])),
  [OPERATOR.mult]: (result, pair, ctx, workMap, i) => result.push(result.pop() * handleItem(ctx, workMap[i])),
  [OPERATOR.div]: (result, pair, ctx, workMap, i) => result.push(result.pop() / handleItem(ctx, workMap[i])),
  [OPERATOR.perc]: (result, pair, ctx, workMap, i) => result.push(result.pop() % handleItem(ctx, workMap[i])),
  [OPERATOR.and]: (result, pair, ctx, workMap, i) => result.push(result.pop() && handleItem(ctx, workMap[i])),
  [OPERATOR.or]: (result, pair, ctx, workMap, i) => result.push(result.pop() || handleItem(ctx, workMap[i])),
  [OPERATOR.eq]: (result, pair, ctx, workMap, i) => result.push(result.pop() == handleItem(ctx, workMap[i])),
  [OPERATOR.ass]: (result, pair, ctx, workMap, i) => {
    return result.push(addrWrite(ctx, workMap[0][1], handleItem(ctx, workMap[i])));
  }
};

function handleOperator(result, pair, ctx, workMap, i) {
  operatorHandlers[pair[1]](result, pair, ctx, workMap, i);
}

// Build work & index jumps
function handleWork(ctx, workMap) {
  let result = [];
  let isFunctionExecuted = false;

  for (let i = 0; i < workMap.length; i++) {
    let pair = workMap[i];

    let handled = handleItem(ctx, pair);
    if (typeof (handled) !== 'undefined') {
      result.push(handled);
    } else {
      if (pair[0] === TYPE.function) {
        let args = workMap[i + 1];
        if (args) { args = args[1]; } else { args = []; }
        //console.log(pair[1], args);

        ctx[pair[1]].apply(getBasicPrototype(ctx), handleWork(ctx, args).result);
        isFunctionExecuted = true;

        i++;
      } else if (pair[0] === TYPE.operator) {
        //let leftOperand = result.pop();
        i++;
        handleOperator(result, pair, ctx, workMap, i)
      }
    }

  }
  //console.log(result);
  return {
    result,
    isFunctionExecuted
  };
}
