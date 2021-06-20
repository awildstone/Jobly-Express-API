"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

/** Parse Numeric types from the DB as Float instead of Strings.
 * 
 * Solutions found here:
 * https://stackoverflow.com/questions/39168501/pg-promise-returns-integers-as-strings
 * https://github.com/brianc/node-pg-types
 * https://github.com/brianc/node-pg-types/blob/master/lib/builtins.js 
 * */ 

const types = require("pg").types
//convert Numeric to Float
types.setTypeParser(1700, function(val) {
  return parseFloat(val, 10)
});

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    connectionString: getDatabaseUri()
  });
}

db.connect();

module.exports = db;