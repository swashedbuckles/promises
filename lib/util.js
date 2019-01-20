const {PENDING, FULFILLED, REJECTED} = require('./enum');

module.exports = {
  isFn,
  isObj,
  defer,
  isResolved,
  isRejected,
  isFulfilled,
};

function isFn(value) {
  return typeof value === 'function';
}

function isObj(value) {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

function isResolved(p) {
  return p && (p._state === FULFILLED || p._state === REJECTED);
}

function isFulfilled(p) {
  return p && p._state === FULFILLED;
}

function isRejected(p) {
  return p && p._state === REJECTED;
}

function defer(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function')
  }
  var args = [].slice.call(arguments, 1);
  args.unshift(1);
  args.unshift(fn);

  return setTimeout.apply(null, args);
}
