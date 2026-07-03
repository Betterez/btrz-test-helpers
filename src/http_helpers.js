const helpers = require("./tests_helpers");
const {Chance} = require("chance");
const {mock} = require("node:test");
const chance = new Chance();
const mockAccountsHelper = require("./accounts_helpers.js");

function createStub(impl = () => undefined) {
  const stub = mock.fn(impl);
  Object.defineProperty(stub, "callCount", {
    get() {
      return stub.mock.callCount();
    }
  });
  Object.defineProperty(stub, "args", {
    get() {
      return stub.mock.calls.map((call) => call.arguments);
    }
  });
  stub.callsFake = (nextImpl) => {
    stub.mock.mockImplementation(nextImpl);
    return stub;
  };
  stub.returns = (value) => {
    stub.mock.mockImplementation(() => value);
    return stub;
  };
  return stub;
}

function getHttpResponse() {
  const res = {
    viewModel: {},
    view: createStub(),
    noCacheView() {},
    set() {},
    write() {},
    send: createStub(),
    end() {},
    json: createStub(),
    header() {},
    redirect() {},
    app: {
      logger: {
        info() {},
        error() {}
      },
      cache: {
        get(key, cb) {
          if (cb) {
            return cb(null, null);
          }
          return null;
        },
        set(key, obj, cb) {
          if (cb && cb.apply) {
            return cb(null, obj);
          }
          return null;
        },
        remove(key, cb) {
          if (cb) {
            return cb(null, 1);
          }
          return null;
        }
      }
    },
    redirectToMain() {}
  };

  res.status = createStub().callsFake(() => {
    return {
      send(...args) {
        return res.send(...args);
      },
      end(...args) {
        return res.end(...args);
      },
      json(...args) {
        return res.json(...args);
      }
    };
  });

  return res;
}

function getDefaultUser(options) {
  if (options && options.user !== undefined) {
    return options.user;
  }

  return {
    _id: "7a18df8b020b3f24e3b6fd71",
    display: chance.word(),
    email: chance.email(),
    defaultMenu: "",
    language: "en-us",
    is() { return false; },
    canRead: createStub().returns(true),
    canCreate: createStub().returns(true),
    canUpdate: createStub().returns(true),
    canDelete: createStub().returns(true),
    hasShift() { return false; }
  };
}

async function getDefaultAccount(accountModel, options) {
  if (options && options.account !== undefined) {
    return options.account;
  }

  const account = accountModel.create(mockAccountsHelper.getNewAccount());
  account._id = options && options.accountId ? options.accountId : chance.hash({length: 24});
  return account;
}

function getConfig(options) {
  if (options && options.config !== undefined) {
    return options.config;
  }

  return null;
}

function getLogger(options) {
  if (options && options.logger) {
    return options.logger;
  }

  return helpers.fakeLogger;
}

function getDefaultConnection(options) {
  if (options && options.connection) {
    return options.connection;
  }
  return {
    remoteAddress: chance.ip()
  };
}

function setNotLoggedIn(req) {
  req.session.account = "";
  req.session.cookie = {};
  req.currentUser = undefined;
  req.currentAccount = undefined;
}

async function getHttpRequest(options = {}) {
  const db = await helpers.getDb();
  const account = await getDefaultAccount(options.accountModel, options);
  const user = getDefaultUser(options);
  return {
    "x-forwarded-proto": options && options.overSsl ? "https" : "http",
    "x-forwarded-port": options && options.overSsl ? "443" : "80",
    "x-forwarded-for": "12.34.56.78",
    connection: getDefaultConnection(options),
    method: options && options.method ? options.method : "GET",
    host: options && options.host ? options.host : "localhost",
    url: options && options.url ? options.url : "/about",
    routePath: options && options.routePath ? options.routePath : "/about",
    flash: options && options.flash ? options.flash : function _inner() {},
    headers: {host: "", "user-agent": "Mozilla /5.0 (Ubuntu)"},
    app: {
      lexicon: {},
      logger: getLogger(options),
      mongoDb: options.mongoDb || db,
      reportsDb: db,
      CONFIG: getConfig(options),
      cache: {
        get(key, cb) { if (cb) { return cb(null, null); } },
        set(key, obj, cb) { if (cb && cb.apply) { return cb(null, obj); } },
        remove(key, cb) { if (cb) { return cb(null, 1); } }
      },
      lexiconCache: {
        get(key, cb) { if (cb) { cb(null, null); } },
        set(key, obj, cb) { if (cb && cb.apply) { cb(null, obj); } },
        remove(key, cb) { if (cb) { cb(null, 1); } }
      },
      apiClient: options && options.apiClient ? options.apiClient : helpers.getApiClient(getConfig(options), options.apiClient)
    },
    currentAccount: account,
    currencySymbol: "$",
    currentUser: user,
    networkContext: {
      providerAccount: account,
      providerId: account._id,
      providerIds: [account._id],
      agencyId: "",
      userId: user._id
    },
    paymentMethods: [
      {method: "cash", provider: "inperson"},
      {method: "debit", provider: "inperson"},
      {method: "credit", provider: "inperson"},
      {method: "online_credit", provider: "authorizeNet"}
    ],
    query: {
      isEmpty: true
    },
    params: {
      isEmpty: true
    },
    useApplications: true,
    session: {
      account,
      cookie: {},
      regenerate(cb) { return cb(); },
      jwt: chance.hash()
    },
    body: {},
    alertMessage(message) { this.message = message; },
    appKeys: {
      publicKey: "some_public_key",
      privateKey: "some_private_key"
    }
  };
}

exports.getHttpResponse = getHttpResponse;
exports.getHttpRequest = getHttpRequest;
exports.setNotLoggedIn = setNotLoggedIn;
