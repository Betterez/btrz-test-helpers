const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  setNotLoggedIn,
  getHttpRequest,
  getHttpResponse
} = require("../src/http_helpers");

const chanceMock = {
  word() { return "word"; },
  email() { return "test@example.com"; },
  hash(opts) { return "a".repeat(opts && opts.length ? opts.length : 24); },
  ip() { return "127.0.0.1"; }
};

const sinonMock = {
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

    it("when given sinon, status() returns object with send that delegates to res.send", () => {
      const res = getHttpResponse(sinonMock);
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
    it("returns request-like object with required top-level properties", () => {
      const req = getHttpRequest({}, sinonMock, chanceMock);
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

    it("uses overSsl to set x-forwarded-proto and x-forwarded-port", () => {
      const req = getHttpRequest({ overSsl: true }, sinonMock, chanceMock);
      assert.equal(req["x-forwarded-proto"], "https");
      assert.equal(req["x-forwarded-port"], "443");
    });

    it("uses options.method, host, url, routePath when provided", () => {
      const req = getHttpRequest({
        method: "POST",
        host: "example.com",
        url: "/api",
        routePath: "/api"
      }, sinonMock, chanceMock);
      assert.equal(req.method, "POST");
      assert.equal(req.host, "example.com");
      assert.equal(req.url, "/api");
      assert.equal(req.routePath, "/api");
    });

    it("uses options.user when provided", () => {
      const customUser = { _id: "custom-user" };
      const req = getHttpRequest({ user: customUser }, sinonMock, chanceMock);
      assert.equal(req.currentUser, customUser);
    });

    it("uses options.account when provided", () => {
      const customAccount = { _id: "custom-account", name: "Acme" };
      const req = getHttpRequest({ account: customAccount }, sinonMock, chanceMock);
      assert.equal(req.currentAccount, customAccount);
    });

    it("uses options.accountId for default account _id when no account provided", () => {
      const req = getHttpRequest({ accountId: "id123" }, sinonMock, chanceMock);
      assert.equal(req.currentAccount._id, "id123");
    });

    it("uses options.connection when provided", () => {
      const conn = { remoteAddress: "10.0.0.1" };
      const req = getHttpRequest({ connection: conn }, sinonMock, chanceMock);
      assert.equal(req.connection, conn);
    });

    it("sets app.logger from options.logger when provided", () => {
      const logger = { info() {}, error() {} };
      const req = getHttpRequest({ logger }, sinonMock, chanceMock);
      assert.equal(req.app.logger, logger);
    });

    it("sets app.CONFIG from options.config when provided", () => {
      const config = { env: "test" };
      const req = getHttpRequest({ config }, sinonMock, chanceMock);
      assert.equal(req.app.CONFIG, config);
    });

    it("sets app.apiClient from options.apiClient when provided", () => {
      const apiClient = { get: function () {} };
      const req = getHttpRequest({ apiClient }, sinonMock, chanceMock);
      assert.equal(req.app.apiClient, apiClient);
    });

    it("sets networkContext from account and user", () => {
      const req = getHttpRequest({}, sinonMock, chanceMock);
      assert.equal(req.networkContext.providerAccount, req.currentAccount);
      assert.equal(req.networkContext.providerId, req.currentAccount._id);
      assert.equal(req.networkContext.userId, req.currentUser._id);
    });

    it("includes paymentMethods array", () => {
      const req = getHttpRequest({}, sinonMock, chanceMock);
      assert.ok(Array.isArray(req.paymentMethods));
      assert.equal(req.paymentMethods.length, 4);
    });
  });
});
