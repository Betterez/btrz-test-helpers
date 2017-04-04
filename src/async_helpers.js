/**
 * 
 * @param {function} done - callback function of an async test
 * @param {function} expectedFn - function that should throw AssertionError if test fails
 */

function expectAsync(done, expectedFn) {
    return function(...args) {
      try {
        expectedFn(...args);
        done();
      } catch (err) {
        done(err);
      }
    };
}

/**
 * 
 * @param {Int} ms - milliseconds to wait
 */

function delay(ms) {
  return new Promise(function(resolve, _) {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  expectAsync,
  promises: {
    delay
  }
};