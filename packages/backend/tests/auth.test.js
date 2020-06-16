const supertest = require("supertest");
const Server = require("../src/server");
const configTest = require("./config");
const Auth = require("../src/auth");

const server = new Server().start(configTest.port);
const request = supertest(server);

describe("functional test for auth", () => {

  afterAll(() => {
    server.close();
  });

  it("login with the api", async ()=> {
    expect.assertions(3);

    const spy = jest.spyOn(Auth, "validCredential").mockResolvedValue(true);

    const response = await request.post("/login")
      .send({username: "u", password: "p"});
    expect(spy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(
      expect.objectContaining({
        token: expect.any(String)
      })
    );
    spy.mockRestore();
  });

  it("rejects bad credential when login", async ()=> {
    expect.assertions(2);

    const spy = jest.spyOn(Auth, "validCredential")
      .mockImplementation(() => false);

    const response = await request.post("/login")
      .send({username: "u", password: "p"});
    expect(spy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(400);
    spy.mockRestore();
  });
});
