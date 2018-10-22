const PENDING   = Object.freeze({toString() { return this.val; }, val: 'PENDING'});
const FULFILLED = Object.freeze({toString() { return this.val; }, val: 'FULFILLED'});
const REJECTED  = Object.freeze({toString() { return this.val; }, val: 'REJECTED'});

module.exports = {
  PENDING,
  FULFILLED,
  REJECTED
};