"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
  testJobs
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", () => {
    const newJob = {
        title: "marketing associate",
        salary: 40000,
        equity: 0,
        companyHandle: "c2"
      };

    test("works for admin", async () => {
       const resp = await request(app)
       .post("/jobs")
       .send(newJob)
       .set("authorization", `Bearer ${a1Token}`);

       expect(resp.statusCode).toEqual(201);
       expect(resp.body).toEqual({ job: { id: expect.any(Number), ...newJob }});
    });

    test("bad request when missing data", async () => {
        const resp = await request(app)
       .post("/jobs")
       .send({
           title: "bad job!",
           salary: 100000
       })
       .set("authorization", `Bearer ${a1Token}`);

       expect(resp.statusCode).toEqual(400);
    });

    test("bad request when invalid salary included", async () => {
        const resp = await request(app)
       .post("/jobs")
       .send({
           title: "bad job!",
           salary: -30,
           equity: 0.09,
           companyHandle: "c2"
       })
       .set("authorization", `Bearer ${a1Token}`);

       expect(resp.statusCode).toEqual(400);
    });

    test("bad request when invalid equity included", async () => {
        const resp = await request(app)
       .post("/jobs")
       .send({
           title: "bad job!",
           salary: 10000,
           equity: 1.01,
           companyHandle: "c2"
       })
       .set("authorization", `Bearer ${a1Token}`);

       expect(resp.statusCode).toEqual(400);
    });

    test("unauthorized for user role", async () => {
        const resp = await request(app)
       .post("/jobs")
       .send(newJob)
       .set("authorization", `Bearer ${u1Token}`);

       expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", () => {
    test("ok for anon", async () => {
        const resp = await request(app).get("/jobs");

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ jobs: [
            {
                id: expect.any(Number),
                title: "associate",
                salary: 35000,
                equity: 0,
                companyHandle: "c3"
            },
            {
                id: expect.any(Number),
                title: "engineer",
                salary: 80000,
                equity: 0.05,
                companyHandle: "c2"
            },
            {
                id: expect.any(Number),
                title: "manager",
                salary: 65000,
                equity: 0.065,
                companyHandle: "c1"
            }
        ]});
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it.
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app).get("/jobs");

        expect(resp.statusCode).toEqual(500);
      });
});

/************************************** GET /jobs w/query */

describe("GET /companies?query=value", function () {
    test("returns a query for valid query title param", async () => {
        let query = "?title=manager";
        const resp = await request(app).get(`/jobs${query}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ jobs: [ {...testJobs[0]} ] });
    });

    test("returns a query for valid minSalary param", async () => {
        let query = "?minSalary=40000";
        const resp = await request(app).get(`/jobs${query}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ jobs: [{...testJobs[1]}, {...testJobs[0]}] });
    });

    test("returns a query for valid equity param", async () => {
        let query = "?hasEquity=true";
        const resp = await request(app).get(`/jobs${query}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ jobs: [{...testJobs[1]}, {...testJobs[0]}] });
    });

    test("returns a 404 for no results found (for valid param)", async () => {
        let query = "?title=president";
        const resp = await request(app).get(`/jobs${query}`);

        expect(resp.statusCode).toEqual(404);
    });

    test("returns 400 for invalid query param", async () => {
        let query = "?job=president";
        const resp = await request(app).get(`/jobs${query}`);

        expect(resp.statusCode).toEqual(400);
    });

    test("returns 400 for empty query value", async () => {
        let query = "?title= ";
        const resp = await request(app).get(`/jobs${query}`);

        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", () => {
    test("works for anon", async () => {
        const resp = await request(app).get(`/jobs/${testJobs[0].id}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ job: {...testJobs[0]}});
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
      });
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:id", () => {
    const allData = {
        title: "developer",
        salary: 100000,
        equity: 0.5
    };
    test("works for admins", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send(allData)
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ job: {
            id: testJobs[1].id,
            title: "developer",
            salary: 100000,
            equity: 0.5,
            companyHandle: testJobs[1].companyHandle
            }
        });
    });

    test("unauthorized for anon", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send(allData);

        expect(resp.statusCode).toEqual(401);
    });

    test("unauthorized for user role", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send(allData)
        .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async () => {
        const resp = await request(app)
        .patch("/jobs/0")
        .send(allData)
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on companyHandle change attempt", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send({ companyHandle: "c3"})
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on id change attempt", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send({ id: 99999})
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on empty data", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send({})
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on bad data", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send({ secret: "break stuff!" })
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on bad salary data", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send({ salary: "break stuff!" })
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on bad equity data", async () => {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[1].id}`)
        .send({ equity: 2 })
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", () => {

    test("works for admins", async () => {
        const resp = await request(app)
        .delete(`/jobs/${testJobs[2].id}`)
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ deleted: testJobs[2].id });
    });

    test("unauthorized for user role", async () => {
        const resp = await request(app)
        .delete(`/jobs/${testJobs[2].id}`)
        .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(401);
    });

    test("unauthorized for anon", async () => {
        const resp = await request(app)
        .delete(`/jobs/${testJobs[2].id}`)

        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async () => {
        const resp = await request(app)
        .delete("/jobs/0")
        .set("authorization", `Bearer ${a1Token}`);

        expect(resp.statusCode).toEqual(404);
    });
});

