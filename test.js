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

describe('The Promise Resolution Procedure: [[Resolve]](promise, x)', it => {
  it.todo('a promise cannot resolve itself (promise === x)');
  it.todo('if x is a promise, promise must remain pending until x is fulfilled/rejected');
  it.todo('if x is a promise, promise must fulfill with same value as x when fulfilled');
  it.todo('if x is a promise, promise must reject with same reason as x when rejected');
  it.todo('should fulfill promise with x if x is not an object or a function');

  it.todo('if x is obj/fn, should reject if retriveing x.then throws an error');
  it.todo('if x is obj/fn, and x.then is fn, call it with x as this');
  it.todo('if x is obj/fn, and x.then is fn, call with arg1 resolvePromise, arg2 rejectPromise');
  it.todo('if x.then is fn and resolvePromise is called, run [[resolve]] (promise, y)');
  it.todo('if x.then is fn and rejectPromise is called, reject promise');
  it.todo('if x.then is fn and something is called after reject/resolvePromise, ignore it');
  it.todo('if calling x.then throws exception e, ignore any calls to reject/Resolve promise');
  it.todo('if calling x.then throws exception e, reject promise with e as reason');
  it.todo('if x.then is not an fn, fulfill promise with x');
  it.todo('')
});
