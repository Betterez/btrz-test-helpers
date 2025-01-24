describe("expectAsync()", function() {
  const { expect } = require("chai");
  const { expectAsync } = require("./../src/async_helpers");  
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