"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
  u2Token,
  testJobs
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for admins: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauthorized for users: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body.error.message).toEqual("Not an admin.");
  });
});

test("unauthorized for users: create admin", async function () {
  const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body.error.message).toEqual("Not an admin.");
});

/************************************** POST /users/:username/jobs/:id */

describe("POST /users/:username/jobs/:id", () => {
  test("works for admins without application state", async () => {
    const resp = await request(app)
          .post(`/users/u1/jobs/${testJobs[1].id}`)
          .set("authorization", `Bearer ${a1Token}`)
    
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ applied: {jobId: testJobs[1].id, state: "applied"} });
  });

  test("works for admins with application state", async () => {
    const resp = await request(app)
          .post(`/users/u1/jobs/${testJobs[1].id}`)
          .send({state: "rejected"})
          .set("authorization", `Bearer ${a1Token}`)
    
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ applied: {jobId: testJobs[1].id, state: "rejected"} });
  });

  test("works for current user matching request user without application state", async () => {
    const resp = await request(app)
          .post(`/users/u1/jobs/${testJobs[2].id}`)
          .set("authorization", `Bearer ${u1Token}`)
    
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ applied: {jobId: testJobs[2].id, state: "applied"} });
  });

  test("works for current user matching request user with application state", async () => {
    const resp = await request(app)
          .post(`/users/u1/jobs/${testJobs[2].id}`)
          .send({state: "applied"})
          .set("authorization", `Bearer ${u1Token}`)
    
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ applied: {jobId: testJobs[2].id, state: "applied"} });
  });

  test("unauthorized for current user not matching request user", async () => {
    const resp = await request(app)
          .post(`/users/u2/jobs/${testJobs[0].id}`)
          .set("authorization", `Bearer ${u1Token}`)
    
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request for admins with incorrect application state value", async () => {
    const resp = await request(app)
          .post(`/users/u1/jobs/${testJobs[1].id}`)
          .send({state: "failed"})
          .set("authorization", `Bearer ${a1Token}`)
    
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request for admins with incorrect application data", async () => {
    const resp = await request(app)
          .post(`/users/u1/jobs/${testJobs[1].id}`)
          .send({kittens: "meow"})
          .set("authorization", `Bearer ${a1Token}`)
    
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request for user with incorrect application state value", async () => {
    const resp = await request(app)
          .post(`/users/u1/jobs/${testJobs[1].id}`)
          .send({state: "lol"})
          .set("authorization", `Bearer ${u1Token}`)
    
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request for user with incorrect application data", async () => {
    const resp = await request(app)
          .post(`/users/u1/jobs/${testJobs[1].id}`)
          .send({puppies: "bark"})
          .set("authorization", `Bearer ${u1Token}`)
    
    expect(resp.statusCode).toEqual(400);
  });

  test("unauthorized for anon", async () => {
    const resp = await request(app)
          .post(`/users/u2/jobs/${testJobs[0].id}`)
    
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no user", async () => {
    const resp = await request(app)
          .post(`/users/0/jobs/${testJobs[0].id}`)
          .set("authorization", `Bearer ${a1Token}`);

    expect(resp.statusCode).toEqual(404);
  });

  test("not found for no job", async () => {
    const resp = await request(app)
          .post("/users/u1/jobs/0")
          .set("authorization", `Bearer ${a1Token}`);
  
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      users: [
        {
          email: "admin1@user.com",
          firstName: "A1F",
          isAdmin: true,
          lastName: "A1L",
          username: "a1",
         },
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("unauthorized for users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
      expect(resp.body.error.message).toEqual("Not an admin.");
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: [testJobs[0].id]
      },
    });
  });

  test("works for current user matching the request user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: [testJobs[0].id]
      },
    });
  });

  test("unauthorized for current user not matching the request user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for current user that matches request username", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for user with admin privledge", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "Bobby",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "Bobby",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user for admin", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauthorized if no such user for user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if invalid data for user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data for admin", async function () {
    const resp = await request(app)
        .patch(`/users/u2`)
        .send({
          firstName: 500,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: set new password current user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });

  test("works: set new password admin", async function () {
    const resp = await request(app)
        .patch(`/users/u2`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "user2@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u2", "new-password");
    expect(isSuccessful).toBeTruthy();
  });

  test("unauthorized: set new password current user not matching request user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
  });


});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for current user matching request user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/users/u2`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({ deleted: "u2" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing for admin", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauthorized if user missing for user", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});