"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, isAuthorized } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const newApplicationSchema = require("../schemas/applicationNew.json");
const generator = require('generate-password');

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login & Admin
 **/

router.post("/", ensureLoggedIn, isAuthorized, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    //generates a random password for the new user account
    const randomPassword = generator.generate({
      length: 10,
      numbers: true
    });
    const user = await User.register({...req.body, password: randomPassword});
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** POST { state } (optional) /users/[username]/jobs/[id] => { applied: {jobId, state} }
 * 
 * Allows a user or Admin to create a new job application.
 * 
 * Returns { applied: {jobId, state} } on success
 * 
 * Authorization required: login, users can apply for themselves or Admins can apply for a user
 */

router.post("/:username/jobs/:id", ensureLoggedIn, isAuthorized, async function (req, res, next) {
  try {
    // let res;
    if (req.body.length !== 0) {
      const validator = jsonschema.validate(req.body, newApplicationSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      let [jobId, state] = await User.apply(req.params.username, req.params.id, req.body.state);
      return res.json({ applied: {jobId, state} });
    } else {
      let [jobId, state] = await User.apply(req.params.username, req.params.id);
      return res.json({ applied: {jobId, state} });
    }
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email, jobs }, ... ] }
 * 
 * where jobs: [jobId, jobId ...]
 *
 * Returns list of all users.
 *
 * Authorization required: login & Admin
 **/

router.get("/", ensureLoggedIn, isAuthorized, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs }
 *   where jobs is { id, title, companyHandle, companyName, state }
 *
 * Authorization required: login & Admin or Current User
 **/

router.get("/:username", ensureLoggedIn, isAuthorized, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login & Admin or Current User
 **/

router.patch("/:username", ensureLoggedIn, isAuthorized, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login & Admin or Current User
 **/

router.delete("/:username", ensureLoggedIn, isAuthorized, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;