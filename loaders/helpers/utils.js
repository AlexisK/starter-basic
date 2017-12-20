const fs = require('fs');
const path = require('path');

const { STR } = require('../config');

function retrieveJson(str) {
  try {
    return eval(STR.xeq + str);
  } catch (err) {
    return {};
  }
}

function formatStr(str) {
  return [STR.q, str.trim().replace(/'/g, "\\'").replace(/(?:\r?\n|\r)\s*/g, STR.space), STR.q].join(STR.empty);
}

function getTemplatePath(reqPath, tplPath) {
  let parts = reqPath.split(STR.mark);
  return path.resolve(parts[parts.length - 1].split(STR.slash).slice(0, -1).join(STR.slash), tplPath)
}

function readFileContent(filePath) {
  let resp = fs.readFileSync(filePath, STR.utf);
  //console.log(resp);
  return resp;
}

function iterateObject(target, callback) {
  if (target) {
    callback(target);

    if (typeof (target) === STR.object) {
      if (target.constructor === Array) {
        target.forEach(v => iterateObject(v, callback));
      } else {
        Object.keys(target).forEach(key => iterateObject(target[key], callback));
      }
    }
  }
}

function mapObject(target, callback) {
  if (target) {
    if (typeof (target) === STR.object) {
      if (target.constructor === Array) {
        return target.map(v => mapObject(v, callback));
      } else {
        for (let key in target) {
          target[key] = mapObject(target[key], callback);
        }
        return target;
      }
    }
    return callback(target);
  }
}

module.exports = { retrieveJson, formatStr, getTemplatePath, readFileContent, iterateObject, mapObject };