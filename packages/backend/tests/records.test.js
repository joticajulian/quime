const supertest = require("supertest");
const jose = require("jose");

const config = require("../src/config");
const configTest = require("./config");
const Server = require("../src/server");
const {isInitialized} = require("../src/records/controller");

const server = new Server().start(configTest.port);
const request = supertest(server);
const token = jose.JWT.sign({aud: "api"}, config.privKeyJWK);

const fn = (type) => {
  return (method) => {
    return request[type](`/api/records${method}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`);
  };
};

const callApi = {
  get: fn("get"),
  post: fn("post"),
  put: fn("put"),
  delete: fn("delete"),
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let accounts = [];
let db = [];
let state = {};
describe("functional test for records", () => {
  beforeAll(async () => {
    while(!isInitialized()) await sleep(200);
  });

  afterAll(() => {
    server.close();
  });

  it("getRecords", async ()=> {
    expect.assertions(3);
    const response = await callApi.get("/");
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(
      expect.objectContaining({
        db: expect.arrayContaining([]),
        state: expect.objectContaining({}),
        accounts: expect.arrayContaining([]),
      })
    );
    accounts = response.body.accounts;
    db = response.body.db;
    state = response.body.state;
    expect(accounts.length).toBeGreaterThan(0);
  });

  it("add new record, update, and remove", async () => {
    expect.assertions(10);
    let record = {
      date: Date.now(),
      amount: parseInt(10000 * Math.random(), 10)/100,
      debit: accounts[0].name,
      credit: accounts[0].name,
      description: "Test description"
    };

    const respInsert = await callApi.put("/").send([record]);
    expect(respInsert.status).toBe(200);
    expect(respInsert.body).toStrictEqual(
      expect.objectContaining({
        total_records: 1,
        total_repeated: 0,
        changed_from: db.length,
        appended: true,
        ids: expect.arrayContaining([]),
      })
    );

    expect(respInsert.body.ids.length).toBe(1);
    const [id] = respInsert.body.ids;

    const respGet1 = await callApi.get("/" + id);
    expect(respGet1.status).toBe(200);
    expect(respGet1.body).toStrictEqual(
      expect.objectContaining({ ...record, id })
    );

    record.description = "this is an update";
    const respUpdate = await callApi.put("/" + id).send(record);
    expect(respUpdate.status).toBe(200);

    const respGet2 = await callApi.get("/" + id);
    expect(respGet2.status).toBe(200);
    expect(respGet2.body).toStrictEqual(
      expect.objectContaining({ ...record, id })
    );

    const respDelete = await callApi.delete("/" + id);
    expect(respDelete.status).toBe(200);

    const respGet3 = await callApi.get("/" + id);
    expect(respGet3.status).toBe(404);
  });
});
