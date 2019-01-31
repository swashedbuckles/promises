import {test, describe} from 'ava-spec';
import sinon from 'sinon';
import P from './index.js';

describe('Promise States', it => {
  it('should be able to transition to fulfilled when pending', t => {
    let fulfill;
    const p = new P(f => fulfill = f);
    t.is(p._state.val, 'PENDING');
    fulfill();

    t.is(p._state.val, 'FULFILLED');
  });

  it('should be able to transition to rejected when pending', t => {
    let fulfill;  let reject;
    const p = new P((f, r) => { fulfill = f; reject = r; });

    t.is(p._state.val, 'PENDING');
    reject();

    t.is(p._state.val, 'REJECTED');
  });

  it('should not transition to any other state when fulfilled', t => {
    let fulfill;  let reject;
    const p = new P((f, r) => { fulfill = f; reject = r; });

    fulfill();
    t.is(p._state.val, 'FULFILLED');

    reject();
    t.is(p._state.val, 'FULFILLED');
  });

  it('must have a fixed value, when fulfilled', t => {
    let fulfill;  let reject;
    const value = Math.PI;
    const p = new P((f, r) => { fulfill = f; reject = r; });

    fulfill(value);
    fulfill(value * 2);

    t.is(p._value, value);
  });

  it('should not transition to any other state when rejected', t => {
    let fulfill;  let reject;
    const p = new P((f, r) => { fulfill = f; reject = r; });

    reject();
    t.is(p._state.val, 'REJECTED');

    fulfill();
    t.is(p._state.val, 'REJECTED');
  });

  it('must have a fixed reason, when rejected', t => {
    let fulfill;  let reject;
    const value = Math.PI;
    const p = new P((f, r) => { fulfill = f; reject = r; });

    reject(value);
    reject(value * 2);

    t.is(p._value, value);
  });

  it.cb('should reject with reason when an error occurs in constructor', t => {
    const stub = sinon.stub();
    const p = new P((f, r) => {
      throw new Error('rejected');
    });

    p.then(null, stub);
    p.then(null, x => {
      t.is(x, 'rejected');
      t.true(stub.called);
      t.end();
    });
  });
});

describe('The `then` method', it => {
  it('should accept two _optional_ arguments', t => {
    const noop = () => {};
    const p = new P(f => f('taco'));

    t.notThrows(() => p.then());
    t.notThrows(() => p.then(noop));
    t.notThrows(() => p.then(noop, noop));
  });

  it('should ignore onFulfilled if it is not a function', t => {
    const p = new P(f => f('taco'));
    t.notThrows(() => p.then('robot'));
  });

  it('should ingore onRejected if it is not a function', t => {
    const p = new P(f => f('taco'));
    t.notThrows(() => p.then(null, 'robot'));
  });

  it.cb('must call onFulfilled after the promise is fulfilled', t => {
    const p = new P(f => f('taco'));
    p.then(function() {
      let fulfill;
      const p2 = new P(f => fulfill = f);
      p2.then(function() {
        t.true(true);
        t.end();
      });

      fulfill('burrito');
    });
  });

  it.cb('must call onFulfilled with the promises value as the first argument', t => {
    const value = 'taco';
    const p = new P(f => f(value));

    p.then((res) => {
      if(res === value) {
        t.pass('taco');
        t.end();
      }
    });
  });

  it.cb('must not call onFulfilled before the promise is fulfilled', t => {
    let fulfill;
    const onFulfill = sinon.stub();
    const p = new P(f => fulfill = f);
    p.then(onFulfill);
    p.then(() => {
      t.true(onFulfill.called);
      t.end();
    });

    t.false(onFulfill.called);
    fulfill('burrito');

  });

  it.cb('must not call onFulfilled more than once', t => {
    let fulfill;
    const onFulfill = sinon.stub();
    const p = new P(f => fulfill = f);

    p.then(onFulfill);
    p.then(() => {
      t.true(onFulfill.called);
      t.false(onFulfill.calledThrice);
      t.end();
    });

    fulfill('burrito');
    fulfill('burrito');
    fulfill('burrito');
  });

  it.cb('must not call onFulfilled with a this value', t => {
    const p = new P(f => f('taco'));
    p.then(function test() {
      t.is(this, null);
      t.end();
    })
  });

  it.cb('must call onRejected after a promise is rejected', t => {
    const p = new P((f, r) => r('taco'));
    p.then(null, () => {
      let reject;
      const p2 = new P((f, r) => reject = r);

      p2.then(null, () => {
        t.true(true);
        t.end();
      });
      reject('burrito');
    });
  });

  it.cb('must call onRejected with the promise reason as the first argument', t=> {
    const value = 'taco';
    const p = new P((f, r) => r(value));
    p.then(null, (res) => {
      if(res === value) {
        t.pass('taco');
        t.end();
      }
    });
  });

  it.cb('must not call onRejected before a promise is rejected', t => {
    let reject;
    const onReject = sinon.stub();
    const p = new P((f, r) => reject = r);
    p.then(null, onReject);
    p.then(null, () => {
      t.true(onReject.called);
      t.end();
    });

    t.false(onReject.called);
    reject('burrito');
  });

  it.cb('must not call onRejected more than once', t => {
    let reject;
    const onReject = sinon.stub();
    const p = new P((f, r) => reject = r);
    p.then(null, onReject);
    p.then(null, ()=> {
      t.true(onReject.called);
      t.false(onReject.calledThrice);
      t.end();
    });

    reject('burrito');
    reject('burrito');
    reject('burrito');
  });

  it.cb('must not call onRejected with a this value', t => {
    const p = new P((f, r) => r());
    p.then(null, function() {
      t.is(this, null);
      t.end();
    });
  });

  it.cb('must not call onFulfilled or onRejected until the call stack clears', t => {
    let fulfill;
    let stub = sinon.stub();
    const p = new P(f => fulfill = f);

    p.then(stub);
    p.then(() => {
      t.true(stub.called);
      t.end();
    })

    t.false(stub.called);
    fulfill();
    t.false(stub.called);
  });

  it('must return a promise', t => {
    let fulfill;
    const p = new P(f => fulfill = f);
    t.true(p instanceof P);
    const then = p.then();
    t.true(then instanceof P);
  });

  it.cb('must resolve the second promise if onFulfilled returns a value', t => {
    const stub = sinon.stub();
    const p = new P(f => f('first'));
    const q = p.then(x => {
      return `${x}, second`;
    });

    q.then(stub);
    q.then(x => {
      t.is(x, 'first, second');
      t.true(stub.called);
      t.end();
    });

  });

  it.cb('must resolve the second promise if onRejected returns a value', t => {
    const stub = sinon.stub();
    const p = new P((f, r) => r('first'));
    const q = p.then(null, x => {
      return `${x}, second`;
    });

    q.then(stub);
    q.then(x => {
      t.is(x, 'first, second');
      t.true(stub.called);
      t.end();
    });
  });

  it.cb('must reject the second promise if either callback throws an exception', t => {
    const stub = sinon.stub();
    const p = new P((f, r) => f('first'));

    const q = p.then(x => {
      throw new Error('rejected');
    });

    q.then(null, stub);
    q.then(null, x => {
      t.true(stub.called);
      t.end();
    });
  });

  it('must return a promise even if not chained "properly"', t => {
    const stub = sinon.stub();
    const p = new P((f, r) => r('first'));

    const q = p.then(x => {
      throw new Error('rejected');
    });

    t.true(q instanceof P);
  });


  it.cb('must set the exception error as the reason if rejecting because thrown', t => {
    const stub = sinon.stub();
    const p = new P((f, r) => f('first'));

    const q = p.then(x => {
      throw new Error('rejected');
    });

    q.then(null, stub);
    q.then(null, x => {
      t.is(x, 'rejected');
      t.true(stub.called);
      t.end();
    });
  });

  it.cb('must fulfill promise2 with the same value as promise1 if onFulfilled is not a function', t => {
    const p = new P(f => f('first'));
    const q = p.then('second');

    q.then(x => {
      t.is(x, 'first');
      t.end();
    });
  });

  it.cb('must reject promise2 with the same reason as promise1 if onRejected is not a function', t => {
    const p = new P((f, r) => r('first'));
    const q = p.then(null, 'second');

    q.then(null, x => {
      t.is(x, 'first');
      t.end();
    });
  })
});

describe('The `catch` method', it => {
  it('should be a function on instances', t => {
    const p = new P();
    t.is(typeof p.catch, 'function');
  });

  it.cb('should catch a rejection', t => {
    const x = 'a reason';
    const p = new P((_, r) => r(x));
    p.catch(val => {
      t.is(val, x);
      t.end();
    })
  })
});

describe('The Promise Resolution Procedure: [[Resolve]](promise, x)', it => {
  it.cb('a promise cannot resolve itself (promise === x)', t => {
    let resolve;
    const p = new P(f => (resolve = f));
    resolve(p);

    p.then(null, x => {
      t.is(x.message, 'Chaining cycle detected for promise');
      t.end();
    });
  });

  it.cb('if x is a promise, promise must remain pending until x is fulfilled', t => {
    let resolve;

    const p = new P(f => (resolve = f));
    const q = new P(f => f(p));

    t.is(q._state.val, 'PENDING');
    q.then(x => t.end());

    resolve('taco');
  });

  it.cb('if x is a promise, promise must remain pending until x is rejected', t => {
    let reject;

    const p = new P((f, r) => (reject = r));
    const q = new P(f => f(p));

    t.is(q._state.val, 'PENDING');
    q.then(null, x => {
      t.end();
    });

    reject('taco');
  });


  it.cb('if x is a promise, promise must fulfill with same value as x when fulfilled', t => {
    let resolve;

    const p = new P(f => (resolve = f));
    const q = new P(f => f(p));

    q.then(x => {
      t.is(x, 'taco')
      t.end();
    });

    resolve('taco');
  });

  it.cb('if x is a promise, promise must reject with same reason as x when rejected', t => {
    let reject;

    const p = new P((f, r) => (reject = r));
    const q = new P(f => f(p));

    q.then(null, x => {
      t.is(x, 'taco')
      t.end();
    });

    reject('taco');
  });

  it.cb('should fulfill promise with x if x is not an object or a function', t => {
    const values = ['x', 1, true, new Date(), ['x', 1, true, new Date()]];

    t.plan(values.length);

    values.forEach(value => {
      const p = new P(f => {
        f(value);
      });

      p.then(x => {
        t.is(x, value);
      });
    });

    setTimeout(x => {
      t.end();
    }, 10);
  });

  it.cb('if x is obj/fn, should reject if retriveing x.then throws an error', t => {
    const err = 'iyamanerror';
    const test = {
      get then() {
        throw new Error(err);
      }
    };

    const p = new P(f => f(test));
    t.is(p._state.val, 'REJECTED');
    p.then(null, x => {
      t.is(x, err);
      t.end();
    })
  });

  it.cb('if x is obj/fn, and x.then is fn, call it with x as this', t => {
    const x = {
      then() {
        t.is(this, x);
        t.end();
      }
    }

    const p = new P(f => f(x));
  });

  it.cb('if x is obj/fn, and x.then is fn, call with arg1 resolvePromise, arg2 rejectPromise', t => {
    const x = {
      then(resolvePromise, rejectPromise) {
        t.is(this, x);
        t.is(typeof resolvePromise, 'function');
        t.is(typeof rejectPromise, 'function');
        t.end();
      }
    };

    const p = new P(f => f(x));
  });

  it.cb('if x.then is fn and resolvePromise is called with value y, run [[resolve]] (promise, y)', t => {
    const y = 'a value';
    const x = {
      then(yay, nay) {
        yay(y);
      }
    };

    const p = new P(f => f(x));
    p.then(val => {
      t.is(val, y);
      t.end();
    });
  });

  it.cb('if x.then is fn and rejectPromise is called with value r, reject promise with r', t => {
    const y = 'a reason';
    const x = {
      then(yay, nay) {
        nay(y);
      }
    };

    const p = new P(f => f(x));
    p.then(null, val => {
      t.is(val, y);
      t.end();
    });
  });

  it.cb('if x.then is fn and something is called after reject/resolvePromise, ignore it', t => {
    // todo, all combinations of yay/yay, yay/nay, nay/yay, nay/nay
    const y = 'a value';
    const z = 'a new value to discard';
    const x = {
      then(yay, nay) {
        yay(y);
        yay(z);
      }
    };

    const p = new P(f => f(x));
    p.then(val => {
      t.is(val, y);
      t.end();
    });
  });

  it.cb('if calling x.then throws exception e, ignore error if reject/Resolve promise called before throw', t => {
    // todo, same for nay
    const e = 'an error';
    const y = 'a value';
    const x = {
      then(yay, nay) {
        yay(y);
        throw new Error(e);
      }
    };

    const p = new P(f => f(x));
    p.then(val => {
      t.is(val, y);
      t.end();
    });
  });

  it.cb('if calling x.then throws exception e before resolve/rejectPromise has been called, reject promise with e as reason', t=> {
    const e = 'an error';
    const y = 'a value';
    const x = {
      then(yay, nay) {
        throw new Error(e);
      }
    };

    const p = new P(f => f(x));
    p.then(null, val => {
      t.is(val, e);
      t.end();
    });
  });

  it.cb('if x.then is not an fn, fulfill promise with x', t => {
    const x = {
      then: 'then'
    };
    const p = new P(f => f(x));

    p.then(val => {
      t.is(val, x);
      t.end();
    });
  });
});

describe('Promise.resolve', it => {
  it('should be a function', t => {
    t.is(typeof P.resolve, 'function');
  });

  it('should be a static method', t => {
    const p = new P();
    t.not(typeof p.resolve, 'function');
  });

  it('should return a promise', t => {
    const p = P.resolve('x');
    t.true(p instanceof P);
  });

  it('should return a resolved promise', t => {
    const p = P.resolve();
    t.is(p._state.val, 'FULFILLED');
  });

  it.cb('should do the promise resolution rules thingy', t => {
    const x = 'taco';
    const p1 = P.resolve(x);
    const p2 = P.resolve(p1);
    const p3 = new P(f => f(p2));

    p3.then(val => {
      t.is(val, x);
      t.end();
    });
  });

  it.cb('should be chainable', t => {
    const x = 'taco';
    const y = '...yum';
    const p = P.resolve(x).then(x => x + y);

    p.then(val => {
      t.is(val, x + y);
      t.end();
    });
  });
})

describe('Promise.reject', it => {
  it('should be a function', t => {
    t.is(typeof P.reject, 'function');
  });

  it('should be a static method', t => {
    const p = new P();
    t.not(typeof p.reject, 'function');
  });

  it('should return a promise', t => {
    const p = P.reject('x');
    t.true(p instanceof P);
  });

  it('should return a rejected promise', t => {
    const p = P.reject();
    t.is(p._state.val, 'REJECTED');
  });

  it.cb('should do the promise resolution rules thingy', t => {
    const x = 'taco';
    const p1 = P.reject(x);
    const p2 = P.reject(p1);
    const p3 = new P(f => f(p2));

    p3.then(null, val => {
      t.is(val, x);
      t.end();
    });
  });

  it.cb('should be chainable', t => {
    const x = 'taco';
    const y = '...yum';
    const p = P.reject(x).then(null, x => x + y);

    p.then(val => {
      t.is(val, x + y);
      t.end();
    });
  });
})


describe('Promise.race', it => {
  it('should be a static method', t => {
    t.is(typeof P.race, 'function');
    const p = new P();
    t.not(typeof p.race, 'function');
  });

  it('should return a promise', t => {
    const p = P.race();
    t.true(p instanceof P);
  });

  it('should never settle the promise if nothing passed in', t => {
    const p = P.race();
    t.is(p._state.val, 'PENDING');
  });

  it.cb('should resolve the first non-promise value found', t => {
    const x = new P();
    const y = 'a value';
    const p = P.race([x, y]);

    p.then(val => {
      t.is(val, y);
      t.end();
    });
  });

  it.cb('should settle the promise the same way as the first promise that settles that is passed in as an argument', t => {
    let resolve;
    const x = 'a value';
    const p1 = new P();
    const p2 = new P(f => (resolve = f));

    const p = P.race([p1, p2]);
    p.then(val => {
      t.is(val, x);
      t.end();
    });

    resolve(x);
  });

  it.cb('should settle with the first settled promise found', t => {
    const x = 'a value';
    const p1 = new P();
    const p2 = new P(f => f(x));

    const p = P.race([p1, p2]);
    p.then(val => {
      t.is(val, x);
      t.end();
    });
  });
});

describe('Promise.all', it => {
  it('should be a static method', t => {
    t.is(typeof P.all, 'function');
    const p = new P();
    t.not(typeof p.all, 'function');
  });

  it('should return a promise', t => {
    const p = P.all([]);
    t.true(p instanceof P);
  });

  it.cb('should return a resolved promise if an empty iterable is passed in', t => {
    const p = P.all([]);
    t.is(p._state.val, 'FULFILLED');
    p.then(t.end);
  });

  it.cb('should resolve all values once all promises fulfill', t => {
    let resolve;
    const p1 = P.resolve('value');
    const p2 = new P(f => (resolve = f));
    const p3 = new P(f => setTimeout(f, 1, 'three'));

    const p = P.all([p1, p2, p3]);
    p.then(x => {
      t.true(Array.isArray(x));
      t.is(x[0], 'value');
      t.is(x[1], 'too');
      t.is(x[2], 'three');

      t.end();
    });

    resolve('too');
  });

  it.cb('should resolve any non promise values as fulfilled promises', t => {
    const p1 = P.resolve('value');
    const p = P.all([p1, 'taco']);
    p.then(x => {
      t.true(Array.isArray(x));

      t.is(x[0], 'value');
      t.is(x[1], 'taco');

      t.end();
    });
  });

  it.cb('should reject if any promise values reject', t => {
    const p1 = P.resolve('value');
    const p2 = P.reject('reason');

    const p = P.all([p1, p2])
    p.then(null, x => {
      t.is(x, 'reason');
      t.end();
    });
  });
});
