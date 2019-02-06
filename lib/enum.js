/** 
 * @typedef {object} STATE  
 * @property {string} val
 * @property {function} toString
 * @readonly
 **/

/** @type STATE */ const PENDING   = Object.freeze({toString() { return PENDING.val;   }, val: 'PENDING'});
/** @type STATE */ const FULFILLED = Object.freeze({toString() { return FULFILLED.val; }, val: 'FULFILLED'});
/** @type STATE */ const REJECTED  = Object.freeze({toString() { return REJECTED.val;  }, val: 'REJECTED'});

module.exports = {
  PENDING,
  FULFILLED,
  REJECTED
};
