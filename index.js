/** @typedef {import('./lib/enum').STATE} STATE */
/**
 * @callback Resolver
 * @param {function} onFulfilled
 * @param {function} onRejected
 */

const {PENDING, FULFILLED, REJECTED} = require('./lib/enum');
const {
  isFn,
  isPromiseLike,
  isArray,
  isEmpty,
  isNil,

  isPending,
  isResolved,
  isRejected,
  isFulfilled,

  deferCall
} = require('./lib/util');


/**
 * @class
 * @constructor
 * @param {Resolver} [fn]
 */
class P {
  constructor(fn) {
    /**@type {STATE} */ this._state = PENDING;
    /**@type {any} */   this._value = null;
    /**@type {Array<Object.<STATE,function>>}*/
    this._subscribers = [];

    if (isFn(fn)) {
      try {
        fn(transition(this, FULFILLED), transition(this, REJECTED));
      }
      catch (err) {
        const reason = err && err.message;
        transition(this, REJECTED)(reason);
      }
    }
  }
  /**
   * @param {function} onFulfilled
   * @param {function} onRejected
   * @return {P}
   */
  then(onFulfilled, onRejected) {
    if (isPending(this)) {
      const subscriber = {};
      subscriber[FULFILLED] = onFulfilled;
      subscriber[REJECTED] = onRejected;
      this._subscribers.push(subscriber);
      return this;
    }
    if (isFulfilled(this) && isFn(onFulfilled)) {
      return call(onFulfilled, this._value);
    }
    if (isFulfilled(this) && !isFn(onFulfilled)) {
      return new P(f => f(this._value));
    }
    if (isRejected(this) && isFn(onRejected)) {
      return call(onRejected, this._value);
    }
    if (isRejected(this) && !isFn(onRejected)) {
      return new P((f, r) => r(this._value));
    }
  }

  /**
   * @param {function} onRejected
   * @return {P}
   */
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  /**
   * @param {any} value
   * @return {P}
   */
  static resolve(value) {
    return new P(f => f(value));
  }

  /**
   * @param {any} reason
   * @return {P}
   */
  static reject(reason) {
    return new P((_, r) => r(reason));
  }

  /**
   * @param {Array<P>} promises
   * @return {P}
   */
  static race(promises) {
    promises = [].concat(promises).filter(x => !isNil(x));
    promises = promises.filter(x => !isNil(x));
    if (isEmpty(promises)) {
      return new P();
    }
    return new P((resolve, reject) => {
      for (let i = 0, len = promises.length; i < len; i++) {
        let val = promises[i];
        if (!isPromiseLike(val)) {
          resolve(val);
          return;
        }
        val.then(resolve, reject);
      }
    });
  }

  /**
   * @param {Array<P>} promises
   * @return {P}
   */
  static all(promises) {
    if (isArray(promises) && isEmpty(promises)) {
      return new P(f => f());
    }
    return new P((resolve, reject) => {
      const values = [];
      const count = promises.length;
      promises.forEach((p, index) => {
        if (isPromiseLike(p)) {
          p.then(val => { values[index] = val; tryResolve(values, count, resolve); }, reject);
          return;
        }
        values[index] = p;
        tryResolve(values, count, resolve);
      });
    });
  }
};

/**
 * @param {Array<any>} values,
 * @param {number} count
 * @param {function} resolver
 */
function tryResolve(values, count, resolver) {
  if(values.length === count) {
    resolver(values)
  }
}

/**
 * @param {function} fn
 * @param {any} value
 */
function call(fn, value) {
  let resolve;
  let reject;

  let promise = new P(function(f, r) {
    resolve = f;
    reject  = r;
  });

  let wrapped = () => {
    let result;
    try {
      result = fn.call(null, value);
    } catch (err) {
      let reason = err && err.message ? err.message : err;
      reject.call(promise, reason);
    }

    if(result instanceof P) {
    } else {
      resolve.call(promise, result);
    }
  };

  deferCall(wrapped);
  return promise;
}

/**
 * @param {P} p
 * @param {STATE} state
 */
function transition(p, state){
  return function(val) {
    if(isResolved(p)) {
      return;
    }

    if(val === p) {
      transition(p, REJECTED)(new TypeError('Chaining cycle detected for promise'))
      return;
    }

    if (isPromiseLike(val)) {
      try {
        val.then(
          x => transition(p, FULFILLED)(x),
          x => transition(p, REJECTED)(x)
        );
      } catch (err) {
        let reason = err && err.message ? err.message : err;
        transition(p, REJECTED)(reason);
      }
      return;
    }

    p._value = val;
    p._state = state;
    notifySubscribers(p);
  }
}

/**
 * @param {P} p promise
 */
function notifySubscribers(p) {
  p._subscribers.forEach(subscriber => {
    const key = p._state.val;
    const callback = subscriber[key];
    if(isFn(callback)) {
      call(callback, p._value);
    }
  });

  p._subscribers.length = 0;
}

module.exports = P;