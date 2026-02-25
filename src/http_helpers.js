function setNotLoggedIn(req) {
  req.session.account = "";
  req.session.cookie = {};
  req.currentUser = undefined;
  req.currentAccount = undefined;
}

function getDb() {
  return global.simpleDaoMongoDbConnection;
}

function getNewAccount(chance = null) {
  return {
    name: chance.word(),
    domain: "unit.tests",
    email: chance.email(),
    password: "1234567p",
    confirmPassword: "1234567p"
  };
}

function getDefaultConnection(options, chance = null) {
  if (options && options.connection) {
    return options.connection;
  }
  return {
    remoteAddress: chance.ip()
  };
}

function getDefaultUser(options, sinon = null, chance = null) {
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
    canRead: sinon.stub().returns(true),
    canCreate: sinon.stub().returns(true),
    canUpdate: sinon.stub().returns(true),
    canDelete: sinon.stub().returns(true),
    hasShift() { return false; }
  };
}

function getDefaultAccount(options, chance = null) {
  if (options && options.account !== undefined) {
    return options.account;
  }
  const account = getNewAccount(chance);
  account._id = options && options.accountId ? options.accountId : chance.hash({length: 24});
  return account;
}

function getHttpResponse(sinon = null) {
  const res = {
    viewModel: {},
    view: sinon ? sinon.stub() : function () {},
    noCacheView() {},
    set() {},
    write() {},
    send: sinon ? sinon.stub() : function () {},
    end() {},
    json: sinon ? sinon.stub() : function () {},
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

  res.status = sinon ? sinon.stub().callsFake(() => {
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
  }) : function () {};

  return res;
}

function getHttpRequest(options = {}, sinon = null, chance = null) {
  const account = getDefaultAccount(options, chance);
  const user = getDefaultUser(options, sinon, chance);
  return {
    "x-forwarded-proto": options && options.overSsl ? "https" : "http",
    "x-forwarded-port": options && options.overSsl ? "443" : "80",
    "x-forwarded-for": "12.34.56.78",
    connection: getDefaultConnection(options, chance),
    method: options && options.method ? options.method : "GET",
    host: options && options.host ? options.host : "localhost",
    url: options && options.url ? options.url : "/about",
    routePath: options && options.routePath ? options.routePath : "/about",
    flash: options && options.flash ? options.flash : function () {},
    headers: {host: "", "user-agent": "Mozilla /5.0 (Ubuntu)"},
    app: {
      lexicon: {},
      logger: options.logger || {
        info() {},
        error() {}
      },
      mongoDb: options.mongoDb || getDb(),
      reportsDb: getDb(),
      CONFIG: options.config || {},
      cache: {
        get(key, cb) { if (cb) { cb(null, null); } },
        set(key, obj, cb) { if (cb && cb.apply) { cb(null, obj); } },
        remove(key, cb) { if (cb) { cb(null, 1); } }
      },
      lexiconCache: {
        get(key, cb) { if (cb) { cb(null, null); } },
        set(key, obj, cb) { if (cb && cb.apply) { cb(null, obj); } },
        remove(key, cb) { if (cb) { cb(null, 1); } }
      },
      apiClient: options.apiClient || {}
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