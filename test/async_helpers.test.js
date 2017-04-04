const { expect } = require("chai");

const { expectAsync } = require("./../src/async_helpers");
const { delay } = require("./../src/async_helpers").promises;

describe("expectAsync()", function() {

  it("should make test pass when not assertion error", function(done) {
    const cb = expectAsync(done, () => {
      expect(1).to.eql(1);
    });

    cb();
  });

  it("should make test fail and inform error when assertion error", function(done) {
    const beforeDone = expectAsync(done, (err) => {
      if(!err) {
        throw new Error("There should be an error here!")
      } else {
        expect(err.message).to.eql("expected 1 to deeply equal 2");
      }
    })

    const cb = expectAsync(beforeDone, () => {
      expect(1).to.eql(2);
    });

    cb();
  });

});

describe("delay()", function() {
  // There's room for improvement here, this tests are not the best... but there's no a synchronous way to inspect if
  // a Promise is resolved in the native implementation 

  it("should resolve the promise after n milliseconds", function() {
    return delay(1);
  });

  it("should not resolve the promise before n milliseconds", function(done) {
    delay(100).then(() => done("Promise resolved first, error!"));
    setTimeout(done, 90);
  });

});
