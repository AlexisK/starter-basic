const HL = require('node-html-light');
const toSource = require('tosource');
const utils = require('./utils');
const breakExpression = require('./break-expression');

const CONFIG = require('../config');
const { STR, CHECK, TYPE } = CONFIG;



const NSElements = (() => {
  let result = {};
  for (let namespace in CONFIG.NSRules) {
    CONFIG.NSRules[namespace].forEach(tag => result[tag] = namespace);
  }
  return result;
})();

// helpers
function getBindingsVarsFromExpr(expr) {
  let bindings = [];

  expr.workMap.forEach(pair => {
    if (pair[0] === TYPE.expression) {
      bindings.push(pair[1]);
    } else if (pair[0] === TYPE.expressionMap) {
      bindings.push(pair[1][0]);
    }
  });

  return bindings;
}

function checkFor(obj) {
  if (obj.attribs && obj.attribs[STR.checkFor]) {
    obj._for = obj.attribs[STR.checkFor].split(' in ');
    obj._for[1] = breakExpression(obj._for[1]);
    obj._forVars = getBindingsVarsFromExpr(obj._for[1]);
    delete obj.attribs[STR.checkFor];
  }
}

function checkIf(obj) {
  if (obj.attribs && obj.attribs[STR.checkIf]) {
    obj._if = breakExpression(obj.attribs[STR.checkIf]);
    obj._ifVars = getBindingsVarsFromExpr(obj._if);
    delete obj.attribs[STR.checkIf];
  }
}

function checkRef(obj) {
  if (obj.attribs && obj.attribs[STR.checkRef]) {
    obj._ref = obj.attribs[STR.checkRef];
    delete obj.attribs[STR.checkRef];
  }
}

function extractDecoratedAttribute(obj, storeKey, varsKey, decoratorStart, decoratorEnd) {
  Object.keys(obj.attribs).forEach(key => {
    if (key.indexOf(decoratorStart) === 0 && key.lastIndexOf(decoratorEnd) === key.length - decoratorEnd.length) {
      let clearKey = key.slice(decoratorStart.length, -decoratorEnd.length);

      obj[storeKey] = obj[storeKey] || {};
      obj[storeKey][clearKey] = breakExpression(obj.attribs[key]);

      obj[varsKey] = obj[varsKey] || {};
      obj[varsKey][clearKey] = [];

      //for (let match, re = new RegExp(CHECK.reNameTest); match = re.exec(obj.attribs[key]);) {
      //    if ( obj[varsKey][clearKey].indexOf(match[1]) === -1 ) {
      //        obj[varsKey][clearKey].push(match[1]);
      //    }
      //}

      obj[storeKey][clearKey].workMap.forEach(pair => {
        if (pair[0] === TYPE.expression) {
          if (pair[1][0] !== '$') {
            obj[varsKey][clearKey].push(pair[1]);
          }
        } else if (pair[0] === TYPE.expressionMap) {
          if (pair[1][0][0] !== '$') {
            obj[varsKey][clearKey].push(pair[1][0]);
          }  
        }
      });

      delete obj.attribs[key];
    }
  });
}


function extractBindings(obj) {
  extractDecoratedAttribute(obj, STR._bindings, STR._bindVars, CHECK.attributeBindingStart, CHECK.attributeBindingEnd);
  let iterObj = obj[STR._bindings];
  for (let k in iterObj) {
    if (iterObj.hasOwnProperty(k) && !!~CHECK.domEvents.indexOf(k)) {
      //if ( iterObj.hasOwnProperty(k) ) {
      obj._bindDom = obj._bindDom || {};
      obj._bindDom[k] = iterObj[k];
      delete iterObj[k];
    }
  }
  //if ( obj._bindDom ) {
  //    console.log(obj);
  //}
}


function extractInputs(obj) {
  extractDecoratedAttribute(obj, STR._inputs, STR._inputVars, CHECK.attributeInputStart, CHECK.attributeInputEnd);
}

function breakTwoWayBindingIntoInputAndBinding(obj) {// YEAH, BABY!
  let decoratorStart = CHECK.attributeInputStart + CHECK.attributeBindingStart;
  let decoratorEnd = CHECK.attributeBindingEnd + CHECK.attributeInputEnd;

  for (let key in obj.attribs) {
    let val = obj.attribs[key];

    if (key.indexOf(decoratorStart) === 0 && key.lastIndexOf(decoratorEnd) === key.length - decoratorEnd.length) {
      let clearKey = key.slice(decoratorStart.length, -decoratorEnd.length);

      obj.attribs[CHECK.attributeInputStart + clearKey + CHECK.attributeInputEnd] = val;
      obj.attribs[CHECK.attributeBindingStart + clearKey + CHECK.attributeBindingEnd] = val + '=$event';

      delete obj.attribs[key];
    }
  }
}


function checkRenderContent(obj) {
  if (obj.data && obj.data.indexOf(CHECK.renderContentStart) >= 0) {
    let parseMap = [];
    let str = obj.data;
    let vars = [];


    for (let i = 0, mode = false; i < str.length;) {
      if (mode) {
        let ind = str.indexOf(CHECK.renderContentEnd, i);
        if (ind === -1) { ind = str.length; }
        let ex = str.slice(i, ind);

        for (let match, re = new RegExp(CHECK.reNameTest); match = re.exec(ex);) {
          if (vars.indexOf(match[1]) === -1) {
            vars.push(match[1]);
          }
        }

        parseMap.push(ex.split(';').map(breakExpression));
        i = ind + CHECK.renderContentEnd.length;
      } else {
        let ind = str.indexOf(CHECK.renderContentStart, i);
        if (ind === -1) { ind = str.length; }
        parseMap.push(str.slice(i, ind));
        i = ind + CHECK.renderContentStart.length;
      }
      mode = !mode;
    }

    obj._renderMap = parseMap;
    obj._renderVars = vars;
  }
}

const replacementKeys = CONFIG.attributesMapping.html;
const nsReplacementKeys = CONFIG.attributesMapping.ns;

function convertAttribs(ref) {
  let result = [];

  if (ref._NS) {
    Object.keys(ref.attribs).forEach(key => {
      result.push([(nsReplacementKeys[key] || key), ref.attribs[key]]);
    });
  } else {
    Object.keys(ref.attribs).forEach(key => {
      result.push([(replacementKeys[key] || key), ref.attribs[key]]);
    });
  }

  ref.attribs = result;
}

function clearEmptyTextNodes(ref) {
  for (let k in ref.children) {
    let data;
    if (ref.children.hasOwnProperty(k) && (data = ref.children[k])) {
      if (data.type === STR.text) {
        if (!data.data.trim().length) {
          delete ref.children[k];
        }
      } else if (typeof (data) === STR.object && ref.constructor !== Array) {
        clearEmptyTextNodes(data);
      }
    }
  }

}

function mapStructure(target, callback) {
  if (target) {
    if (typeof (target) === STR.object && target.constructor === Array) {
      return target.map(v => mapStructure(v, callback));
    }
    target = callback(target);
    if (target.children) {
      target.children = target.children.map(v => mapStructure(v, callback));
    }
    return target;
  }
}

function removeCircularDeps(obj) {
  ['parent', 'next', 'prev'].forEach(k => {
    delete obj[k];
  });

  for (let k in obj) {
    let c = obj[k];
    if (typeof (c) === STR.object) {
      if (c.constructor === Array) {
        c.forEach(removeCircularDeps);
      } else {
        removeCircularDeps(c);
      }
    }
  }

  return obj;
}

// main processor
function createTemplate(obj, params) {

  let knownSelectors = params.selectors || [];

  let result = mapStructure(obj, ref => {
    if (ref._element) {
      let data = ref._element;
      delete ref._element;

      ref = Object.assign({}, ref, data);
    }

    clearEmptyTextNodes(ref);

    if (ref.type === STR.tag) {
      ref.type = 2;
      checkIf(ref);
      checkFor(ref);
      checkRef(ref);
      for (let attr in ref.attribs) {
        if (ref.attribs[attr] === "" && CONFIG.emptyAttributes.indexOf(attr) === -1) {
          // component
          ref.type = 3;
          ref._componentSelector = '['+attr+']';
        }
      }
      if (NSElements[ref.name]) {
        ref._NS = NSElements[ref.name];
      }
      breakTwoWayBindingIntoInputAndBinding(ref);
      extractBindings(ref);
      extractInputs(ref);
      convertAttribs(ref);
    } else if (ref.type === STR.text) {
      ref.type = 1;
      checkRenderContent(ref);
    } else if (ref.type) {
      ref.type = 0;
    }
    return ref;
  });
  return toSource(result);
}

// exporting
module.exports = function (html, params) {
  let parsed = createTemplate(removeCircularDeps(HL.Node.fromString(html)), params);

  //console.log('--TPL:\n\n', html, '\n');
  //console.log('--NODE:\n\n', parsed, '\n');

  //return utils.formatStr(html);
  return parsed;
};
