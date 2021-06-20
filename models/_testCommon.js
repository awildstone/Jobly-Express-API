const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");
let testJobs = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM jobs");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);
  
  await db.query(`
    INSERT INTO jobs(title, salary, equity, company_handle)
    VALUES ('manager', 65000, 0.065, 'c1'),
           ('engineer', 80000, 0.05, 'c2'), 
           ('associate', 35000, 0, 'c3')`);

  testJobs[0] = await db.query(`SELECT * FROM jobs WHERE title = 'manager'`);
  testJobs[1] = await db.query(`SELECT * FROM jobs WHERE title = 'engineer'`);
  testJobs[2] = await db.query(`SELECT * FROM jobs WHERE title = 'associate'`);

  await db.query(
    `INSERT INTO applications(username, job_id)
      VALUES ('u1', '${testJobs[0].rows[0].id}'),
             ('u2', '${testJobs[1].rows[0].id}')`);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobs
};