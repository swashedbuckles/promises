const {PENDING, FULFILLED, REJECTED} = require('./lib/enum');
const $ = require('./lib/util');
const enableLogging = false;

function log(...args) {
  if(enableLogging) {
    console.log(...args);
  }
}


function P(fn) {
  this._state  = PENDING;
  this._value  = null;
  this._subscribers = [];

  if($.isFn(fn)) {
    try {
      fn(transition(this, FULFILLED), transition(this, REJECTED))
    } catch (err) {
      const reason = err && err.message;
      transition(this, REJECTED)(reason);
    }
  }
};

P.prototype.then = function then(onFulfilled, onRejected) {
  log('P then', this);
  if(this._state === PENDING) {
    const subscriber = {};

    subscriber[FULFILLED] = onFulfilled;
    subscriber[REJECTED] = onRejected;

    this._subscribers.push(subscriber);
    log('state is pending, returning new P');
    return new P();
  }

  if(this._state === FULFILLED && $.isFn(onFulfilled)) {
    log('P calling onFulfilled...', onFulfilled);
    return call(onFulfilled, this._value)
  }

  if(this._state === REJECTED && $.isFn(onRejected)) {
    log('P calling onRejected...', onFulfilled);
    return call(onRejected, this._value);
  }

  return new P();
};

function call(fn, value) {
  let invocation = fn.bind(null, value);
  let resolve;
  let reject;

  let promise = new P(function(f, r) {
    resolve = f;
    reject  = r;
  });

  let wrapped = () => {
    try {
      resolve.call(promise, invocation());
    } catch (err) {
      let reason = err && err.message ? err.message : err;
      reject.call(promise, reason);
    }
  };

  $.defer(wrapped);
  return promise;
}

function transition(p, state){
  return function(val) {
    if(p && p._state === PENDING) {
      p._value = val;
      p._state = state;
      notifySubscribers(p);
    }
  }
}

function notifySubscribers(p) {
  p._subscribers.forEach(subscriber => {
    const callback = subscriber[p._state.val];
    if($.isFn(callback)) {
      call(callback, p._value);
    }
  });
}

module.exports = P;
