const {PENDING, FULFILLED, REJECTED} = require('./lib/enum');
const $ = require('./lib/util');

function P(fn) {
  this._state  = PENDING;
  this._value  = null;
  this._subscribers = [];
  
  if($.isFn(fn)) {
    fn(transition(this, FULFILLED), transition(this, REJECTED))
  }
};

P.prototype.then = function then(onFulfilled, onRejected) {
  if(this._state === PENDING) {
    const subscriber = {};
  
    subscriber[FULFILLED] = onFulfilled;
    subscriber[REJECTED] = onRejected;
  
    this._subscribers.push(subscriber);
    return new P();
  }

  if(this._state === FULFILLED && $.isFn(onFulfilled)) {
    call(onFulfilled, this._value)
  }

  if(this._state === REJECTED && $.isFn(onRejected)) {
    call(onRejected, this._value);
  }

  return new P();
};

function call(fn, value) {
  let invocation = fn.bind(null, value);
  $.defer(invocation);
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
