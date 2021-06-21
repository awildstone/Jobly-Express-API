"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "Barber",
        salary: 40000,
        equity: 0,
        companyHandle: "c1",
    };

    test("works", async () => {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            id: job.id,
            title: "Barber",
            salary: 40000,
            equity: 0,
            companyHandle: "c1",
        });
    });

    test("bad request with dupe", async () => {
        try {
          await Job.create(newJob);
          await Job.create(newJob);
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("create new job with equity as a string!", async () => {
      const badJob = {
        title: "Fisherman",
        salary: 60000,
        equity: "0.67",
        companyHandle: "c1",
      };
      let job = await Job.create(badJob);
      expect(job).toEqual({
        id: job.id,
        title: "Fisherman",
        salary: 60000,
        equity: 0.67,
        companyHandle: "c1"
    });

    });
});

/************************************** findAll */

describe("findAll", () => {

    test("works", async () => {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: jobs[0].id,
                title: "associate",
                salary: 35000,
                equity: 0,
                companyHandle: "c3",
            },
            {
                id: jobs[1].id,
                title: "engineer",
                salary: 80000,
                equity: 0.05,
                companyHandle: "c2",
              },
            {
                id: jobs[2].id,
                title: "manager",
                salary: 65000,
                equity: 0.065,
                companyHandle: "c1",
            }
        ]);
      });

});

/************************************** filter */

describe("filter", () => {
  test("works with filters", async () => {
    const queries = { title: "manager", minSalary: "40000"};
    const jobs = await Job.filter(queries);

    expect(jobs).toEqual([{
      id: expect.any(Number),
      title: "manager",
      salary: 65000,
      equity: 0.065,
      companyHandle: "c1"
    }]);
  });

  test("works with hasEquity true", async () => {
    const queries = { title: "manager", minSalary: "40000", hasEquity: 'true'};
    const jobs = await Job.filter(queries);

    expect(jobs).toEqual([{
      id: expect.any(Number),
      title: "manager",
      salary: 65000,
      equity: 0.065,
      companyHandle: "c1"
    }]);
  });

  test("works with hasEquity false", async () => {
    const queries = { title: "manager", minSalary: "40000", hasEquity: 'false'};
    const jobs = await Job.filter(queries);

    expect(jobs).toEqual([{
      id: expect.any(Number),
      title: "manager",
      salary: 65000,
      equity: 0.065,
      companyHandle: "c1"
    }]);
  });

  test("not found with no matching results", async () => {
    const queries = { title: "manager", minSalary: "100000"};
    try {
      await Job.filter(queries);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  
});


/************************************** get */

describe("get", () => {
    test("works", async () => {
        const newJob = {
            title: "Barber",
            salary: 40000,
            equity: 0,
            companyHandle: "c1"
        };
    
        const jobResp = await Job.create(newJob);
        const jobId = jobResp.id;

        const job = await Job.get(jobId);
        expect(job).toEqual(jobResp);
    });

    test("not found if no such job", async () => {
        try {
          await Job.get(0);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
});


/************************************** update */

describe("update", () => {
    test("works", async () => {
        const newJob = {
            title: "Barber",
            salary: 40000,
            equity: 0,
            companyHandle: "c1"
        };
    
        const jobResp = await Job.create(newJob);
    
        const updateData = {
            title: "Stylist",
            salary: 45000,
            equity: 0.02
        };

        const updatedJob = await Job.update(jobResp.id, updateData);
        expect(updatedJob).toEqual({
            id: jobResp.id,
            title: updateData.title,
            salary: updateData.salary,
            equity: updateData.equity,
            companyHandle: jobResp.companyHandle
        });
    });

    test("works with null data", async () => {
        const newJob = {
            title: "Barber",
            salary: 40000,
            equity: 0,
            companyHandle: "c1"
        };
    
        const jobResp = await Job.create(newJob);
    
        const updateData = {
            title: "Stylist",
            salary: null,
            equity: null
        };
        
        const updatedJob = await Job.update(jobResp.id, updateData);
        expect(updatedJob).toEqual({
            id: jobResp.id,
            title: updateData.title,
            salary: updateData.salary,
            equity: updateData.equity,
            companyHandle: jobResp.companyHandle
        });
    });

    test("not found if no such job", async () => {
        const updateData = {
            title: "Stylist",
            salary: 45000,
            equity: 0.02
        };
        try {
          await Job.update(0, updateData);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });

      test("bad request with no data", async () => {
        const newJob = {
            title: "Barber",
            salary: 40000,
            equity: 0,
            companyHandle: "c1"
        };
    
        const jobResp = await Job.create(newJob);

        try {
          await Job.update(jobResp.id, {});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
});

/************************************** remove */

describe("remove", () => {
    test("works", async () => {
        const newJob = {
            title: "Barber",
            salary: 40000,
            equity: 0,
            companyHandle: "c1"
        };
        const jobResp = await Job.create(newJob);

        const beforeRemove = await db.query("SELECT id FROM jobs WHERE company_handle = 'c1'");
        await Job.remove(jobResp.id);
        const afterRemove = await db.query("SELECT id FROM jobs WHERE company_handle = 'c1'");

        expect(beforeRemove.rows.length).toEqual(2);
        expect(afterRemove.rows.length).toEqual(1);
    });

    test("not found if no such job", async () => {
        try {
          await Job.remove(0);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
});