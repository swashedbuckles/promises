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
 * @param  {any} value
 * @return {boolean}
 */
function isFn(value) {
  return typeof value === 'function';
}

/**
 * is something an object?
 * @param  {any} value
 * @return {boolean}
 */
function isObj(value) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

/**
 * is this thing thenable?
 * @param  {any} value
 * @return {boolean}
 */
function isPromiseLike(value) {
  return value && isObj(value) && isFn(value.then);
}

/**
 * @param {any} value
 * @return {boolean}
 */
function isArray(value) {
  return value && Array.isArray(value);
}

/**
 * @param  {any} value
 * @return {boolean}
 */
function isEmpty(value) {
  return value && value.length === 0;
}

/**
 * @param  {any} value
 * @return {boolean}
 */
function isNil(value) {
  return value == null;
}

/**
 * @param  {any} p
 * @return {boolean}
 */
function isPending(p) {
  return p && p._state === PENDING;
}

/**
 * @param  {any} p
 * @return {boolean}
 */
function isResolved(p) {
  return p && (p._state === FULFILLED || p._state === REJECTED);
}

/**
 * @param  {any} p
 * @return {boolean}
 */
function isFulfilled(p) {
  return p && p._state === FULFILLED;
}

/**
 * @param  {any} p
 * @return {boolean}
 */
function isRejected(p) {
  return p && p._state === REJECTED;
}

/**
 * @param {function} fn
 * @return {number}
 */
function deferCall(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }
  var args = [].slice.call(arguments, 1);
  args.unshift(1);
  args.unshift(fn);

  return setTimeout.apply(null, args);
}
