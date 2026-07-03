const assert = require("node:assert/strict");
const { describe, it, beforeEach, afterEach } = require("node:test");
const {
  setNotLoggedIn,
  getHttpRequest,
  getHttpResponse
} = require("../src/http_helpers");
const helpers = require("../src/tests_helpers");

const chanceMock = {
  word() { return "word"; },
  email() { return "test@example.com"; },
  hash(opts) { return "a".repeat(opts && opts.length ? opts.length : 24); },
  ip() { return "127.0.0.1"; }
};

const mockToolkit = {
  stub() {
    const stubbed = function () {
      return stubbed._returnValue;
    };
    stubbed.callsFake = function (fn) {
      stubbed._returnValue = typeof fn === "function" ? fn() : undefined;
      return stubbed;
    };
    stubbed.returns = function () { return stubbed; };
    return stubbed;
  }
};

describe("http_helpers", () => {
  describe("setNotLoggedIn", () => {
    it("clears session.account and session.cookie", () => {
      const req = {
        session: { account: "acct", cookie: { foo: 1 } },
        currentUser: {},
        currentAccount: {}
      };
      setNotLoggedIn(req);
      assert.equal(req.session.account, "");
      assert.deepEqual(req.session.cookie, {});
    });

    it("sets currentUser and currentAccount to undefined", () => {
      const req = {
        session: { account: "", cookie: {} },
        currentUser: { _id: "1" },
        currentAccount: { _id: "2" }
      };
      setNotLoggedIn(req);
      assert.equal(req.currentUser, undefined);
      assert.equal(req.currentAccount, undefined);
    });
  });

  describe("getHttpResponse", () => {
    it("returns object with viewModel, view, send, status, and app", () => {
      const res = getHttpResponse();
      assert.deepEqual(res.viewModel, {});
      assert.equal(typeof res.view, "function");
      assert.equal(typeof res.send, "function");
      assert.equal(typeof res.status, "function");
      assert.ok(res.app);
      assert.ok("logger" in res.app);
      assert.ok("cache" in res.app);
    });

    it("status() returns object with send that delegates to res.send", () => {
      const res = getHttpResponse(mockToolkit);
      const sent = [];
      res.send = (x) => sent.push(x);
      res.status(500).send("error");
      assert.deepEqual(sent, ["error"]);
    });

    it("exposes noCacheView, set, write, end, json, header, redirect, redirectToMain", () => {
      const res = getHttpResponse();
      assert.equal(typeof res.noCacheView, "function");
      assert.equal(typeof res.set, "function");
      assert.equal(typeof res.write, "function");
      assert.equal(typeof res.end, "function");
      assert.equal(typeof res.json, "function");
      assert.equal(typeof res.header, "function");
      assert.equal(typeof res.redirect, "function");
      assert.equal(typeof res.redirectToMain, "function");
    });
  });

  describe("getHttpRequest", () => {
    const originalGetDb = helpers.getDb;
    const originalGetApiClient = helpers.getApiClient;
    const accountModel = {
      create(account) {
        return {...account};
      }
    };
    const withAccountModel = (options = {}) => ({accountModel, ...options});

    beforeEach(() => {
      helpers.getDb = async () => ({});
      helpers.getApiClient = () => ({});
    });

    afterEach(() => {
      helpers.getDb = originalGetDb;
      helpers.getApiClient = originalGetApiClient;
    });

    it("returns request-like object with required top-level properties", async () => {
      const req = await getHttpRequest(withAccountModel());
      assert.equal(req.method, "GET");
      assert.equal(req.host, "localhost");
      assert.equal(req.url, "/about");
      assert.deepEqual(req.body, {});
      assert.ok("query" in req);
      assert.ok("params" in req);
      assert.ok("session" in req);
      assert.ok("app" in req);
      assert.ok("currentUser" in req);
      assert.ok("currentAccount" in req);
      assert.ok("appKeys" in req);
      assert.equal(req.appKeys.publicKey, "some_public_key");
    });

    it("uses overSsl to set x-forwarded-proto and x-forwarded-port", async () => {
      const req = await getHttpRequest(withAccountModel({ overSsl: true }));
      assert.equal(req["x-forwarded-proto"], "https");
      assert.equal(req["x-forwarded-port"], "443");
    });

    it("uses options.method, host, url, routePath when provided", async () => {
      const req = await getHttpRequest({
        method: "POST",
        host: "example.com",
        url: "/api",
        routePath: "/api"
      , ...withAccountModel()});
      assert.equal(req.method, "POST");
      assert.equal(req.host, "example.com");
      assert.equal(req.url, "/api");
      assert.equal(req.routePath, "/api");
    });

    it("uses options.user when provided", async () => {
      const customUser = { _id: "custom-user" };
      const req = await getHttpRequest(withAccountModel({ user: customUser }));
      assert.equal(req.currentUser, customUser);
    });

    it("uses options.account when provided", async () => {
      const customAccount = { _id: "custom-account", name: "Acme" };
      const req = await getHttpRequest(withAccountModel({ account: customAccount }));
      assert.equal(req.currentAccount, customAccount);
    });

    it("uses options.accountId for default account _id when no account provided", async () => {
      const req = await getHttpRequest(withAccountModel({ accountId: "id123" }));
      assert.equal(req.currentAccount._id, "id123");
    });

    it("uses options.connection when provided", async () => {
      const conn = { remoteAddress: "10.0.0.1" };
      const req = await getHttpRequest(withAccountModel({ connection: conn }));
      assert.equal(req.connection, conn);
    });

    it("sets app.logger from options.logger when provided", async () => {
      const logger = { info() {}, error() {} };
      const req = await getHttpRequest(withAccountModel({ logger }));
      assert.equal(req.app.logger, logger);
    });

    it("sets app.CONFIG from options.config when provided", async () => {
      const config = { env: "test" };
      const req = await getHttpRequest(withAccountModel({ config }));
      assert.equal(req.app.CONFIG, config);
    });

    it("sets app.apiClient from options.apiClient when provided", async () => {
      const apiClient = { get: function () {} };
      const req = await getHttpRequest(withAccountModel({ apiClient }));
      assert.equal(req.app.apiClient, apiClient);
    });

    it("sets networkContext from account and user", async () => {
      const req = await getHttpRequest(withAccountModel());
      assert.equal(req.networkContext.providerAccount, req.currentAccount);
      assert.equal(req.networkContext.providerId, req.currentAccount._id);
      assert.equal(req.networkContext.userId, req.currentUser._id);
    });

    it("includes paymentMethods array", async () => {
      const req = await getHttpRequest(withAccountModel());
      assert.ok(Array.isArray(req.paymentMethods));
      assert.equal(req.paymentMethods.length, 4);
    });
  });
});
