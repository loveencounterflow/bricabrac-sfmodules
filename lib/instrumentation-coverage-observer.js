(function() {
  
"use strict";

function createMethodCoverage(objects) {
  const defined = new Map(); // objName -> Set(methods)
  const used = new Map();    // objName -> Set(methods)

  function recordDefined(objName, prop) {
    if (!defined.has(objName)) defined.set(objName, new Set());
    defined.get(objName).add(prop);
  }

  function recordUsed(objName, prop) {
    if (!used.has(objName)) used.set(objName, new Set());
    used.get(objName).add(prop);
  }

  function wrapObject(obj, objName) {
    // Record all own + prototype methods
    let proto = obj;
    while (proto && proto !== Object.prototype) {
      for (const name of Object.getOwnPropertyNames(proto)) {
        if (typeof obj[name] === "function" && name !== "constructor") {
          recordDefined(objName, name);
        }
      }
      proto = Object.getPrototypeOf(proto);
    }

    return new Proxy(obj, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (typeof value !== "function") return value;

        return function (...args) {
          recordUsed(objName, prop);
          return value.apply(this, args);
        };
      }
    });
  }

  function report() {
    const result = {};

    for (const [objName, methods] of defined.entries()) {
      const usedMethods = used.get(objName) || new Set();
      result[objName] = {
        used: [...usedMethods],
        unused: [...methods].filter(m => !usedMethods.has(m))
      };
    }

    return result;
  }

  return {
    wrapObject,
    report
  };
}

module.exports = { createMethodCoverage };
;


}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2luc3RydW1lbnRhdGlvbi1jb3ZlcmFnZS1vYnNlcnZlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuYGBgXG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gY3JlYXRlTWV0aG9kQ292ZXJhZ2Uob2JqZWN0cykge1xuICBjb25zdCBkZWZpbmVkID0gbmV3IE1hcCgpOyAvLyBvYmpOYW1lIC0+IFNldChtZXRob2RzKVxuICBjb25zdCB1c2VkID0gbmV3IE1hcCgpOyAgICAvLyBvYmpOYW1lIC0+IFNldChtZXRob2RzKVxuXG4gIGZ1bmN0aW9uIHJlY29yZERlZmluZWQob2JqTmFtZSwgcHJvcCkge1xuICAgIGlmICghZGVmaW5lZC5oYXMob2JqTmFtZSkpIGRlZmluZWQuc2V0KG9iak5hbWUsIG5ldyBTZXQoKSk7XG4gICAgZGVmaW5lZC5nZXQob2JqTmFtZSkuYWRkKHByb3ApO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVjb3JkVXNlZChvYmpOYW1lLCBwcm9wKSB7XG4gICAgaWYgKCF1c2VkLmhhcyhvYmpOYW1lKSkgdXNlZC5zZXQob2JqTmFtZSwgbmV3IFNldCgpKTtcbiAgICB1c2VkLmdldChvYmpOYW1lKS5hZGQocHJvcCk7XG4gIH1cblxuICBmdW5jdGlvbiB3cmFwT2JqZWN0KG9iaiwgb2JqTmFtZSkge1xuICAgIC8vIFJlY29yZCBhbGwgb3duICsgcHJvdG90eXBlIG1ldGhvZHNcbiAgICBsZXQgcHJvdG8gPSBvYmo7XG4gICAgd2hpbGUgKHByb3RvICYmIHByb3RvICE9PSBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvdG8pKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqW25hbWVdID09PSBcImZ1bmN0aW9uXCIgJiYgbmFtZSAhPT0gXCJjb25zdHJ1Y3RvclwiKSB7XG4gICAgICAgICAgcmVjb3JkRGVmaW5lZChvYmpOYW1lLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJveHkob2JqLCB7XG4gICAgICBnZXQodGFyZ2V0LCBwcm9wLCByZWNlaXZlcikge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHZhbHVlO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgIHJlY29yZFVzZWQob2JqTmFtZSwgcHJvcCk7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVwb3J0KCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBbb2JqTmFtZSwgbWV0aG9kc10gb2YgZGVmaW5lZC5lbnRyaWVzKCkpIHtcbiAgICAgIGNvbnN0IHVzZWRNZXRob2RzID0gdXNlZC5nZXQob2JqTmFtZSkgfHwgbmV3IFNldCgpO1xuICAgICAgcmVzdWx0W29iak5hbWVdID0ge1xuICAgICAgICB1c2VkOiBbLi4udXNlZE1ldGhvZHNdLFxuICAgICAgICB1bnVzZWQ6IFsuLi5tZXRob2RzXS5maWx0ZXIobSA9PiAhdXNlZE1ldGhvZHMuaGFzKG0pKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB3cmFwT2JqZWN0LFxuICAgIHJlcG9ydFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgY3JlYXRlTWV0aG9kQ292ZXJhZ2UgfTtcbmBgYFxuXG4iXX0=
