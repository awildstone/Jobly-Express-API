
/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, isAuthorized } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { job: { id, title, salary, equity, companyHandle }}
 *
 * Authorization required: login & admin
 */

 router.post("/", ensureLoggedIn, isAuthorized, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  });
  
  /** GET /  =>
   *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
   *
   * Can filter on provided search filters:
   * title : filter by job title case insensitive.
   * minSalary: filter to jobs with at least that salary.
   * hasEquity: if true, filter to jobs that provide a non-zero amount of equity. If false or not included in the filtering, list all jobs regardless of equity.
   *
   * Authorization required: none
   */
  
  router.get("/", async function (req, res, next) {
    try {
      let jobs;
      if (Object.keys(req.query).length !== 0) {
        jobs = await Job.filter(req.query);
      } else {
        jobs = await Job.findAll();
      }
      return res.json({ jobs });
    } catch (err) {
      return next(err);
    }
  });
  
  /** GET /[id]  =>  { job }
   *
   *  Job is { id, title, salary, equity, companyHandle }
   *
   * Authorization required: none
   */
  
  router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });
  
  /** PATCH /[id] { field1, field2, ... } => { job }
   *
   * Patches job data.
   *
   * fields can be: { title, salary, equity }
   *
   * Returns { job: { id, title, salary, equity, companyHandle }}
   *
   * Authorization required: login & Admin
   */
  
  router.patch("/:id", ensureLoggedIn, isAuthorized, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });
  
  /** DELETE /[id]  =>  { deleted: id }
   *
   * Authorization: login & admin
   */
  
  router.delete("/:id", ensureLoggedIn, isAuthorized, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: +req.params.id });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;