const assert = require("node:assert/strict");
const {describe, it, afterEach} = require("node:test");
const sinon = require("sinon");
const {SimpleDao} = require("btrz-simple-dao");
const {
  getRandomIntUpTo,
  getDb,
  removeCollection,
  saveWithSimpleDao,
  getFixtures,
  getApiClient,
  DbDouble,
  initializeApp,
  checkMiddleware,
  fakeLogger,
  consoleLogger
} = require("../src/tests_helpers");

function getMongoConfig() {
  return {
    uris: ["mongodb://localhost:27017"],
    options: {
      username: "",
      password: "",
      database: "unit"
    }
  };
}

describe("tests_helpers", () => {
  afterEach(() => {
    global.APP_INITIALIZED = undefined;
  });

  it("getRandomIntUpTo returns floored value under limit", () => {
    const randomStub = sinon.stub(Math, "random").returns(0.79);
    try {
      assert.equal(getRandomIntUpTo(10), 7);
    } finally {
      randomStub.restore();
    }
  });

  it("getDb builds single-uri dao config and returns connection", async () => {
    const fakeDb = {kind: "db"};
    const captured = {opts: null, instances: 0};

    class RecordingSimpleDao extends SimpleDao {
      constructor(opts) {
        super(opts);
        captured.opts = opts;
        captured.instances += 1;
      }

      connect() {
        return Promise.resolve(fakeDb);
      }
    }

    const db = await getDb(RecordingSimpleDao, {
      uris: ["mongodb://localhost:27017"],
      options: {username: "", password: "", database: "unit"}
    });

    assert.equal(captured.instances, 1);
    assert.equal(db, fakeDb);
    assert.deepEqual(captured.opts.db.uris, ["mongodb://localhost:27017/unit?auto_reconnect=true"]);
  });

  it("getDb builds multi-uri dao config", async () => {
    let capturedUris = null;

    class RecordingSimpleDao extends SimpleDao {
      constructor(opts) {
        super(opts);
        capturedUris = opts.db.uris;
      }

      connect() {
        return Promise.resolve({ok: true});
      }
    }

    await getDb(RecordingSimpleDao, {
      uris: ["mongodb://mongo-1:27017", "mongodb://mongo-2:27017"],
      options: {username: "", password: "", database: "unit"}
    });

    assert.deepEqual(capturedUris, [
      "mongodb://mongo-1:27017/?auto_reconnect=true",
      "mongodb://mongo-2:27017/?auto_reconnect=true"
    ]);
  });

  it("removeCollection resolves when collection does not exist", async () => {
    await removeCollection({_collections: {}}, "tickets");
  });

  it("removeCollection resolves when remove callback succeeds", async () => {
    let removeCalled = false;
    const db = {
      _collections: {
        tickets: {
          remove(cb) {
            removeCalled = true;
            cb(null);
          }
        }
      }
    };

    await removeCollection(db, "tickets");
    assert.equal(removeCalled, true);
  });

  it("removeCollection rejects when remove callback fails", async () => {
    const db = {
      _collections: {
        tickets: {
          remove(cb) {
            cb(new Error("boom"));
          }
        }
      }
    };

    await assert.rejects(removeCollection(db, "tickets"), /boom/);
  });

  it("saveWithSimpleDao uses dao instance and returns saved object", async () => {
    const obj = {name: "row"};
    let askedCollection = null;
    let savedObject = null;
    const simpleDao = new SimpleDao({db: getMongoConfig()});
    const connectStub = sinon.stub(simpleDao, "connect").resolves({
      collection(name) {
        askedCollection = name;
        return {
          save(payload) {
            savedObject = payload;
            return Promise.resolve();
          }
        };
      }
    });

    const result = await saveWithSimpleDao(simpleDao, "items", obj);

    assert.equal(connectStub.calledOnce, true);
    assert.equal(askedCollection, "items");
    assert.equal(savedObject, obj);
    assert.equal(result, obj);
    connectStub.restore();
  });

  it("getFixtures loads all collections and calls callback", async () => {
    const inserts = [];
    class FixtureSimpleDao extends SimpleDao {
      connect() {
        return Promise.resolve({
          collection(name) {
            return {
              insertMany(items) {
                inserts.push({name, items});
                return Promise.resolve();
              }
            };
          }
        });
      }
    }

    const fixtures = getFixtures(FixtureSimpleDao, {
      uris: ["mongodb://localhost:27017"],
      options: {username: "", password: "", database: "unit"}
    });

    await new Promise((resolve) => {
      fixtures.load({a: [{_id: "1"}], b: [{_id: "2"}]}, resolve);
    });

    assert.deepEqual(inserts, [
      {name: "a", items: [{_id: "1"}]},
      {name: "b", items: [{_id: "2"}]}
    ]);
  });

  it("getApiClient delegates to provided btrz-api-client factory", () => {
    const calls = [];
    const apiFactory = {
      createApiClient(config) {
        calls.push(config);
        return {client: true};
      }
    };

    const client = getApiClient({
      inventoryApi: {url: "inventory"},
      tripsApi: {url: "trips"},
      salesApi: {url: "sales"},
      operationsApi: {url: "operations"},
      accountsApi: {url: "accounts"},
      reportsApi: {url: "reports"},
      uploadsApi: {url: "uploads"},
      loyaltyApi: {url: "loyalty"},
      seatmapsApi: {url: "seatmaps"},
      btrzpayApi: {url: "btrzpay"},
      invoicesApi: {url: "invoices"},
      notificationsApi: {url: "notifications"},
      webhooksApi: {url: "webhooks"},
      agents: {version: 1}
    }, apiFactory);

    assert.deepEqual(client, {client: true});
    assert.equal(calls.length, 1);
    assert.equal(calls[0].baseURLOverride.inventory(), "inventory");
    assert.equal(calls[0].baseURLOverride.webhooks(), "webhooks");
    assert.deepEqual(calls[0].agents, {version: 1});
  });

  it("DbDouble tracks calls and returns default data", () => {
    const dbl = DbDouble({dataForFind: [{id: "x"}]});
    const collection = dbl.collection();

    let oneResult = null;
    collection.findOne({}, (_err, data) => {
      oneResult = data;
    });

    let manyResult = null;
    collection.find().toArray((_err, data) => {
      manyResult = data;
    });

    let saveResult = null;
    collection.save({a: 1}, {}, (_err, data) => {
      saveResult = data;
    });

    collection.sort();

    assert.equal(dbl.collectionCalled, true);
    assert.equal(dbl.findOneCalled, true);
    assert.equal(dbl.findCalled, true);
    assert.equal(dbl.saveCalled, true);
    assert.equal(dbl.sortCalled, true);
    assert.deepEqual(oneResult, [{id: "x"}]);
    assert.deepEqual(manyResult, [{id: "x"}]);
    assert.equal(saveResult.ops[0]._id, "4f285d4c07eb0d0000000001");
  });

  it("initializeApp resolves provided app once APP_INITIALIZED is true", async () => {
    const app = {_id: "app"};
    global.APP_INITIALIZED = false;
    setTimeout(() => {
      global.APP_INITIALIZED = true;
    }, 5);

    const resolved = await initializeApp(app);
    assert.equal(resolved, app);
  });

  it("checkMiddleware finds matching middleware from app router stack", async () => {
    global.APP_INITIALIZED = true;
    const app = {
      _router: {
        stack: [
          {
            route: {
              methods: {post: true},
              stack: [{name: "auth"}, {name: "perm"}]
            },
            match(route) {
              return route === "/items";
            }
          }
        ]
      }
    };

    const hasPerm = await checkMiddleware("/items", "perm", "post", app);
    const hasMissing = await checkMiddleware("/items", "missing", "post", app);

    assert.equal(hasPerm, true);
    assert.equal(hasMissing, false);
  });

  it("exports logger interfaces", () => {
    assert.equal(typeof fakeLogger.info, "function");
    assert.equal(typeof fakeLogger.error, "function");
    assert.equal(typeof consoleLogger.info, "function");
    assert.equal(typeof consoleLogger.error, "function");
  });
});
