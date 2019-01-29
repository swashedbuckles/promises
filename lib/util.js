const { PENDING, FULFILLED, REJECTED } = require('./enum');

module.exports = {
  isFn,
  isObj,
  isPromiseLike,
  isArray,
  isEmpty,
  isNil,

  isPending,
  isResolved,
  isRejected,
  isFulfilled,

  deferCall,
};

/**
 * is something a function?
 * @param  {*} value
 * @return {Boolean}
 */
function isFn(value) {
  return typeof value === 'function';
}

/**
 * is something an object?
 * @param  {*} value
 * @return {Boolean}
 */
function isObj(value) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

/**
 * is this thing thenable?
 * @param  {*} value
 * @return {Boolean}
 */
function isPromiseLike(value) {
  return value && isObj(value) && isFn(value.then);
}

function isArray(value) {
  return value && Array.isArray(value);
}

function isEmpty(value) {
  return value && value.length === 0;
}

function isNil(value) {
  return value == null;
}

function isPending(p) {
  return p && p._state === PENDING;
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

function deferCall(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }
  var args = [].slice.call(arguments, 1);
  args.unshift(1);
  args.unshift(fn);

  return setTimeout.apply(null, args);
}
