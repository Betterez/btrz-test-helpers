const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const Module = require("node:module");

function loadAccountsHelpersWithStubs() {
  const originalLoad = Module._load;
  let objectIdCalls = 0;

  class FakeChance {
    word() {
      return "acme";
    }

    email() {
      return "admin@example.com";
    }

    hash() {
      return "fixed-hash";
    }
  }

  const simpleDaoStub = {
    objectId() {
      objectIdCalls += 1;
      return {
        toString() {
          return `id-${objectIdCalls}`;
        }
      };
    }
  };

  Module._load = function mockedLoad(request, parent, isMain) {
    if (request === "chance") {
      return { Chance: FakeChance };
    }
    if (request === "btrz-simple-dao") {
      return { SimpleDao: simpleDaoStub };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  const modulePath = require.resolve("../src/accounts_helpers");
  delete require.cache[modulePath];
  const helpers = require("../src/accounts_helpers");
  Module._load = originalLoad;

  return { helpers, getObjectIdCalls: () => objectIdCalls };
}

describe("accounts_helpers", () => {
  it("getNewAccount returns an account with generated values and defaults", () => {
    const { helpers } = loadAccountsHelpersWithStubs();
    const account = helpers.getNewAccount();

    assert.deepEqual(account, {
      name: "acme",
      domain: "unit.tests",
      email: "admin@example.com",
      password: "1234567p",
      confirmPassword: "1234567p"
    });
  });

  it("getPaymentProviders returns both expected providers", () => {
    const { helpers } = loadAccountsHelpersWithStubs();
    const providers = helpers.getPaymentProviders();

    assert.equal(providers.length, 2);
    assert.equal(providers[0].method, "lucasmethod");
    assert.equal(providers[0].provider, "inperson");
    assert.equal(providers[0].custom, true);
    assert.equal(providers[1].method, "masterReferencedPayment");
    assert.equal(providers[1].provider, "referencedPayment");
    assert.equal(providers[1].custom, false);
  });

  it("getAccount returns defaults including expected roles and payment providers accessor", () => {
    const { helpers } = loadAccountsHelpersWithStubs();
    const account = helpers.getAccount();
    const providerMethods = account.getPaymentProviders().map((provider) => provider.method);
    const roleIds = account.roles.map((role) => role._id);

    assert.equal(account._id, "528cd077f3d73ec2060000b8");
    assert.equal(account.domain, "betterez");
    assert.equal(account.deleted, false);
    assert.equal(account.preferences.lexicon, "buscompany");
    assert.ok(account.createdAt instanceof Date);
    assert.deepEqual(providerMethods, ["lucasmethod", "masterReferencedPayment"]);
    assert.deepEqual(roleIds, ["widget", "inactive", "driver", "agent", "administrator"]);
  });

  it("getAccount honors explicit id and roles arguments", () => {
    const { helpers } = loadAccountsHelpersWithStubs();
    const roles = [{ _id: "auditor", name: "Auditor" }];
    const account = helpers.getAccount("custom-account-id", roles);

    assert.equal(account._id, "custom-account-id");
    assert.equal(account.roles, roles);
  });

  it("getDefaultUsers builds admin and widget users with expected identity fields", () => {
    const { helpers, getObjectIdCalls } = loadAccountsHelpersWithStubs();
    const users = helpers.getDefaultUsers("my-domain", "admin@my-domain.com");

    assert.equal(users.adminUser._id, "id-1");
    assert.equal(users.adminUser.email, "admin@my-domain.com");
    assert.equal(users.adminUser.password, "fixed-hash");
    assert.deepEqual(users.adminUser.roles, { administrator: 1 });
    assert.equal(users.adminUser.domain, "my-domain");

    assert.equal(users.widgetUser._id, "id-2");
    assert.equal(users.widgetUser.email, "widget.my-domain@betterez.com");
    assert.equal(users.widgetUser.password, "s3cr3tw!z@rd");
    assert.deepEqual(users.widgetUser.roles, { widget: 1 });
    assert.equal(users.widgetUser.domain, "my-domain");
    assert.equal(getObjectIdCalls(), 2);
  });
});
