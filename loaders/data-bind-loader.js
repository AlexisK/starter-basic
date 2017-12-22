const fs = require('fs');
const path = require('path');

const utils = require("./helpers/utils");
const compileTemplate = require('./helpers/compile-template');
const { updateMethodInds } = require('./config');

const reTemplateAll = /@(Component)\(({[\s\d\w:'",.\/\-_=+~\[\]]+})?\)\s*(?:export)?\s+class\s+([\w\d_]+)\s*\{([\s\d\w:'";,.\/\-_=+~(){}[\]<>]*)}\s*$/igm;
const reTemplateKey = /@Component\({[\s\w\d:'",.\-/\\]+selector\s*:\s*'([\s\w\d\-[\]./\\]+)'/gi;
const reConstructor = /constructor\(([\s\w\d_{}\[\],]*)\)\s*\{/;


const knownSelectors = [];
function retrieveSelectors(html) {
  for (let match, re = new RegExp(reTemplateKey); match = re.exec(html);) {
    if (knownSelectors.indexOf(match[1]) === -1) {
      knownSelectors.push(match[1]);
    }
  }
}


function injectToConstructor(classBody, name, params, loader) {
  let match = new RegExp(reConstructor).exec(classBody);
  if (!match) {
    console.error('Can\'t find constructor', name, classBody);
    return '';
  }
  let pos = match.index + match[0].length;
  let beforeContent = match.input.slice(0, pos);
  let afterContent = match.input.slice(pos);

  let i = 0;
  for (let check = 1; check && i < afterContent.length; i++) {
    if (/\{/.test(afterContent[i])) { check += 1; }
    if (/}/.test(afterContent[i])) { check -= 1; }
  }
  i -= 1;

  let constructorContent = afterContent.slice(0, i);
  afterContent = afterContent.slice(i);

  let templatePath = utils.getTemplatePath(loader.request, params.template);
  loader.addDependency(templatePath);

  let selector = utils.formatStr(`[${params.selector || name}]`);

  let result = [
    `export class ${name} {`,
    beforeContent,
    `\nthis.__name=${utils.formatStr(name)};`,
    `\nthis.__selector=${selector}`,
    `\nthis.__template=${name}.__template;\n`,
    params.styles ? `\nthis.__styles=require('${params.styles}');` : '',
    constructorContent,
    afterContent,
    '}',
    `\n${name}.__selector=${selector};`,
    `\n${name}.__template=${compileTemplate(utils.readFileContent(templatePath), {
      selectors: knownSelectors
    })};`
  ].join('');

  // console.log(result);
  return result;
}

function prepareModified(source) {
  return new Promise(resolve => {
    retrieveSelectors(source);

    setTimeout(() => {
      let result = source.replace(reTemplateAll, (match, type, params, name, classBody) => {
        params = utils.retrieveJson(params);

        // console.log(injectToConstructor(classBody, name, params, this));
        return injectToConstructor(classBody, name, params, this);
      });
      resolve(result);
    }, 1);
  });
}

module.exports = function (source, map) {
  const callback = this.async();

  prepareModified.call(this, source).then(modifiedSource => {
    callback(null, modifiedSource, map);
  });

};
