describe("http_helpers", () => {
  const { expect } = require("chai");
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

  describe("setNotLoggedIn", () => {
    it("clears session.account and session.cookie", () => {
      const req = {
        session: { account: "acct", cookie: { foo: 1 } },
        currentUser: {},
        currentAccount: {}
      };
      setNotLoggedIn(req);
      expect(req.session.account).to.equal("");
      expect(req.session.cookie).to.deep.equal({});
    });

    it("sets currentUser and currentAccount to undefined", () => {
      const req = {
        session: { account: "", cookie: {} },
        currentUser: { _id: "1" },
        currentAccount: { _id: "2" }
      };
      setNotLoggedIn(req);
      expect(req.currentUser).to.equal(undefined);
      expect(req.currentAccount).to.equal(undefined);
    });
  });

  describe("getHttpResponse", () => {
    it("returns object with viewModel, view, send, status, and app", () => {
      const res = getHttpResponse();
      expect(res).to.have.property("viewModel").that.deep.equals({});
      expect(res).to.have.property("view");
      expect(res).to.have.property("send");
      expect(res).to.have.property("status");
      expect(res).to.have.property("app");
      expect(res.app).to.have.property("logger");
      expect(res.app).to.have.property("cache");
    });

    it("when given sinon, status() returns object with send that delegates to res.send", () => {
      const res = getHttpResponse(sinonMock);
      const sent = [];
      res.send = (x) => sent.push(x);
      res.status(500).send("error");
      expect(sent).to.deep.equal(["error"]);
    });

    it("exposes noCacheView, set, write, end, json, header, redirect, redirectToMain", () => {
      const res = getHttpResponse();
      expect(res.noCacheView).to.be.a("function");
      expect(res.set).to.be.a("function");
      expect(res.write).to.be.a("function");
      expect(res.end).to.be.a("function");
      expect(res.json).to.be.a("function");
      expect(res.header).to.be.a("function");
      expect(res.redirect).to.be.a("function");
      expect(res.redirectToMain).to.be.a("function");
    });
  });

  describe("getHttpRequest", () => {
    it("returns request-like object with required top-level properties", () => {
      const req = getHttpRequest({}, sinonMock, chanceMock);
      expect(req).to.have.property("method", "GET");
      expect(req).to.have.property("host", "localhost");
      expect(req).to.have.property("url", "/about");
      expect(req).to.have.property("body").that.deep.equals({});
      expect(req).to.have.property("query");
      expect(req).to.have.property("params");
      expect(req).to.have.property("session");
      expect(req).to.have.property("app");
      expect(req).to.have.property("currentUser");
      expect(req).to.have.property("currentAccount");
      expect(req).to.have.property("appKeys");
      expect(req.appKeys).to.have.property("publicKey", "some_public_key");
    });

    it("uses overSsl to set x-forwarded-proto and x-forwarded-port", () => {
      const req = getHttpRequest({ overSsl: true }, sinonMock, chanceMock);
      expect(req["x-forwarded-proto"]).to.equal("https");
      expect(req["x-forwarded-port"]).to.equal("443");
    });

    it("uses options.method, host, url, routePath when provided", () => {
      const req = getHttpRequest({
        method: "POST",
        host: "example.com",
        url: "/api",
        routePath: "/api"
      }, sinonMock, chanceMock);
      expect(req.method).to.equal("POST");
      expect(req.host).to.equal("example.com");
      expect(req.url).to.equal("/api");
      expect(req.routePath).to.equal("/api");
    });

    it("uses options.user when provided", () => {
      const customUser = { _id: "custom-user" };
      const req = getHttpRequest({ user: customUser }, sinonMock, chanceMock);
      expect(req.currentUser).to.equal(customUser);
    });

    it("uses options.account when provided", () => {
      const customAccount = { _id: "custom-account", name: "Acme" };
      const req = getHttpRequest({ account: customAccount }, sinonMock, chanceMock);
      expect(req.currentAccount).to.equal(customAccount);
    });

    it("uses options.accountId for default account _id when no account provided", () => {
      const req = getHttpRequest({ accountId: "id123" }, sinonMock, chanceMock);
      expect(req.currentAccount._id).to.equal("id123");
    });

    it("uses options.connection when provided", () => {
      const conn = { remoteAddress: "10.0.0.1" };
      const req = getHttpRequest({ connection: conn }, sinonMock, chanceMock);
      expect(req.connection).to.equal(conn);
    });

    it("sets app.logger from options.logger when provided", () => {
      const logger = { info() {}, error() {} };
      const req = getHttpRequest({ logger }, sinonMock, chanceMock);
      expect(req.app.logger).to.equal(logger);
    });

    it("sets app.CONFIG from options.config when provided", () => {
      const config = { env: "test" };
      const req = getHttpRequest({ config }, sinonMock, chanceMock);
      expect(req.app.CONFIG).to.equal(config);
    });

    it("sets app.apiClient from options.apiClient when provided", () => {
      const apiClient = { get: function () {} };
      const req = getHttpRequest({ apiClient }, sinonMock, chanceMock);
      expect(req.app.apiClient).to.equal(apiClient);
    });

    it("sets networkContext from account and user", () => {
      const req = getHttpRequest({}, sinonMock, chanceMock);
      expect(req.networkContext.providerAccount).to.equal(req.currentAccount);
      expect(req.networkContext.providerId).to.equal(req.currentAccount._id);
      expect(req.networkContext.userId).to.equal(req.currentUser._id);
    });

    it("includes paymentMethods array", () => {
      const req = getHttpRequest({}, sinonMock, chanceMock);
      expect(req.paymentMethods).to.be.an("array").with.lengthOf(4);
    });
  });
});
