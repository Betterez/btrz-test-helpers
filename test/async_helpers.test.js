const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { expectAsync } = require("./../src/async_helpers");

describe("expectAsync()", () => {
  it("should make test pass when not assertion error", async () => {
    await new Promise((resolve, reject) => {
      const cb = expectAsync((err) => (err ? reject(err) : resolve()), () => {
        assert.equal(1, 1);
      });

      cb();
    });
  });

  it("should make test fail and inform error when assertion error", async () => {
    await new Promise((resolve, reject) => {
      const beforeDone = (err) => {
        try {
          assert.ok(err, "There should be an error here!");
          assert.match(err.message, /1 !== 2/);
          resolve();
        } catch (assertionError) {
          reject(assertionError);
        }
      };

      const cb = expectAsync(beforeDone, () => {
        assert.equal(1, 2);
      });

      cb();
    });
  });
});