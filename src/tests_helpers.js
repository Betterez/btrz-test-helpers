const logger = {
  fatal() { },
  debug() { },
  info(...params) {
    console.log(...params);
  },
  error(...params) {
    console.log(...params);
  }
};
const consoleLogger = {fatal: console.log, debug: console.log, info: console.log, error: console.log};

function getRandomIntUpTo(limit) {
  return Math.floor(Math.random() * limit);
}

async function getDb(SimpleDao, mongoDb) {
  const Dao = SimpleDao || require("btrz-simple-dao").SimpleDao;
  const mongoDbConfig = mongoDb || require("../../../app/config-main").get(process.env).dbs.mongoDb;
  const connStrs = mongoDbConfig.uris;
  let uris = null;

  if (connStrs.length === 1) {
    uris = [`${connStrs[0]}/${mongoDbConfig.options.database}?auto_reconnect=true`];
  } else {
    uris = connStrs.map((conn) => {
      return `${conn}/?auto_reconnect=true`;
    });
  }

  const simpleDao = new Dao({db: {uris, options: mongoDbConfig.options}});
  const db = await simpleDao.connect();
  return db;
}

function removeCollection(database, collectionName) {
  return new Promise((resolve, reject) => {
    if (!database || !database._collections || !database._collections[collectionName]) {
      return resolve();
    }

    database._collections[collectionName].remove((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function saveWithSimpleDao(simpleDao, collectionName, obj) {
  return simpleDao.connect().then((database) => {
    return database.collection(collectionName);
  }).then((collection) => {
    return collection.save(obj)
      .then(() => {
        return obj;
      });
  });
}

function getFixtures(SimpleDao, mongoDb) {
  const Dao = SimpleDao || require("btrz-simple-dao").SimpleDao;
  const mongoDbConfig = mongoDb || require("../../../app/config-main").get(process.env).dbs.mongoDb;
  const simpleDao = new Dao({
    db: mongoDbConfig
  });

  return {
    load(obj, cb) {
      simpleDao.connect()
        .then((db) => {
          const collections = Object.keys(obj);
          Promise.all(
            collections.map((col) => {
              return db.collection(col).insertMany(obj[col]);
            })
          )
            .then(() => {
              cb();
            });
        });
    }
  };
}

function getApiClient(mainConfig, btrzApiClient) {
  const apiClientFactory = btrzApiClient || require("btrz-api-client");
  const endpointsConfiguration = {
    baseUrl: "",
    baseURLOverride: {
      inventory: () => {
        return mainConfig.inventoryApi.url;
      },
      trips: () => {
        return mainConfig.tripsApi.url;
      },
      sales: () => {
        return mainConfig.salesApi.url;
      },
      operations: () => {
        return mainConfig.operationsApi.url;
      },
      accounts: () => {
        return mainConfig.accountsApi.url;
      },
      reports: () => {
        return mainConfig.reportsApi.url;
      },
      uploads: () => {
        return mainConfig.uploadsApi.url;
      },
      loyalty: () => {
        return mainConfig.loyaltyApi.url;
      },
      seatmaps: () => {
        return mainConfig.seatmapsApi.url;
      },
      btrzpay: () => {
        return mainConfig.btrzpayApi.url;
      },
      invoices: () => {
        return mainConfig.invoicesApi.url;
      },
      notifications: () => {
        return mainConfig.notificationsApi.url;
      },
      webhooks: () => {
        return mainConfig.webhooksApi.url;
      },
    },
    agents: mainConfig.agents
  }
  return apiClientFactory.createApiClient(endpointsConfiguration);
}


function NativeMongoDbDouble(obj) {
  return {
    internal: obj,
    findCalled: false,
    findOneCalled: false,
    saveCalled: false,
    collectionCalled: false,
    sortCalled: false,
    countCalled: false,
    collection() {
      const dbl = this;
      dbl.collectionCalled = true;
      return {
        findOne(id, cb) {
          dbl.findOneCalled = true;
          if (dbl.internal && dbl.internal.findOne) {
            return dbl.internal.findOne(arguments);
          }
          return cb(null, dbl.internal.dataForFind);
        },
        find() {
          dbl.findCalled = true;
          if (dbl.internal && dbl.internal.find) {
            return dbl.internal.find(arguments);
          }
          return {
            toArray(cb) {
              if (cb && dbl.internal && dbl.internal.dataForFind) {
                return cb(null, dbl.internal.dataForFind);
              }

              return [];
            }
          };
        },
        count() {
          dbl.countCalled = true;
          if (dbl.internal && dbl.internal.count) {
            return dbl.internal.count(arguments);
          }
          console.log(`dbl.internal.dataForFind         ${dbl.internal.dataForFind.length}`);
          return cb(null, dbl.internal.dataForFind.length);
        },
        findData() {
          dbl.findCalled = true;
          if (dbl.internal && dbl.internal.find) {
            return dbl.internal.find(arguments);
          }
          return {
            toArray(cb) {
              if (dbl.internal && dbl.internal.dataForFind) {
                  cb(null, dbl.internal.dataForFind);
                }
            }
          };
        },
        save(obj, opts, cb) {
          const result = {ops: []};
          dbl.saveCalled = true;
          if (cb) {
            if (obj) {
              result.ops[0] = {_id:  "4f285d4c07eb0d0000000001"};
            }
            cb(null, result);
          }
        },
        sort() {
          dbl.sortCalled = true;
          if (dbl.internal && dbl.internal.sort) {
            return dbl.internal.sort(arguments);
          }
        }
      };
    }
  };
}

function initializeApp(appModule) {
  let app = null;

  return new Promise((resolve) => {
    if (app) {
      resolve(app);
    }
    const a = appModule || require("../../../app/app");
    const interval = setInterval(() => {
      if (global.APP_INITIALIZED) {
        clearInterval(interval);
        app = a;
        resolve(app);
      }
    }, 10);
  });
}

function checkMiddleware(route, middleware, getOrPost = "post", appModule) {
  return initializeApp(appModule).then((app) => {
    if (!app || !app._router || !Array.isArray(app._router.stack)) {
      return false;
    }
    const isMiddlewareLayer = (layer) => !layer.route;
    const layerHandlesPath = (layer) => layer.match(route);
    const layerHandlesHttpMethod = (layer) => {
      const method = getOrPost.toLowerCase();
      return layer && layer.route && layer.route.methods && layer.route.methods[method] === true;
    };

    const matchingLayer = app._router.stack.find((layer) => {
      return !isMiddlewareLayer(layer) && layerHandlesPath(layer) && layerHandlesHttpMethod(layer);
    });

    const hasMiddleware = matchingLayer && matchingLayer.route.stack.some((stackLayer) => {
      return stackLayer && stackLayer.name === middleware;
    });
    return hasMiddleware;
  });
}

exports.getFixtures = getFixtures;
exports.getRandomIntUpTo = getRandomIntUpTo;
exports.DbDouble = NativeMongoDbDouble;
exports.getDb = getDb;
exports.removeCollection = removeCollection;
exports.saveWithSimpleDao = saveWithSimpleDao;
exports.fakeLogger = logger;
exports.consoleLogger = consoleLogger;
exports.checkMiddleware = checkMiddleware;
exports.initializeApp = initializeApp;
exports.getApiClient = getApiClient;
