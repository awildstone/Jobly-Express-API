const { BadRequestError } = require("../expressError");
const { REJECTEDVALUES } = require("../config");

/** 
 * This function accepts two parameters: the json request data (dataToUpdate),
 * and an object containing the json property name key and the SQL db column name value (jsToSql).
 * 
 * If dataToUpdate (after converting to keys array) contains no data a BadRequestError is thrown.
 * 
 * The key array is mapped into an array (cols) of strings that respresent
 * the SQL SET column values assignment. The mapped data contains the SQL column name value matched using the json key name (or if the json key is not
 * contained in jsToSql then the key is set as the column name). The value is set using the current index which
 * respresents the order of the data insertion into the SQL statement.
 * 
 * {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
 * 
 * Returns JS object with setCols: string of sql column values, values: array of values:
 * { setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32]}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);

  if (keys.length === 0) throw new BadRequestError("No data");

  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Accepts a JSON object of one or more query paramaters and returns string with column names and values formatted for a SQL filter query.
 * 
 * If a query parameter is not in the accepted list of queries, throw BadRequestError. 
 * If the minEmployees value is greater or equal to maxEmployees value, throw BadRequestError.
 * 
 * { name: 'anderson', minEmployees: '200', maxEmployees: '5000' } => "lower(name) LIKE '%anderson%' AND num_employees >= 200 AND num_employees <= 5000"
 */

function sqlForFilterQueries(queries, allowed) {
  const keys = Object.keys(queries);
  const values = Object.values(queries);

  //confirm all query parameters are in the allowed list of parameters, if not throw error
  if (!keys.every(key => allowed.includes(key))) throw new BadRequestError(`invalid query parameter`);

  //confirm all query parameter values are not in the forbidden list of values, if not throw error
  if(values.some(val => REJECTEDVALUES.includes(val))) throw new BadRequestError(`invalid query value`);

  //if minEmployees & maxEmployees confirm min is not larger than max, if not throw error
  if (keys.includes('minEmployees') && keys.includes('maxEmployees')) {
    if (+queries['minEmployees'] >= +queries['maxEmployees']) throw new BadRequestError("minEmployees cannot be larger than maxEmployees");
  }

  //build query string based on param type and value
  const queryString = keys.map((colName) => {
      if (colName === 'minEmployees' || colName === 'maxEmployees') {
      return (colName === 'minEmployees') ? `num_employees >= ${+queries[colName]}` : `num_employees <= ${+queries[colName]}`
    } else if (colName === 'minSalary') {
      return `salary >= ${+queries[colName]}`
    } else if (colName === 'hasEquity') {
      return (queries['hasEquity'].toLowerCase() === 'true') ? "equity > 0" : "equity >= 0"
    }
    return `lower(${colName}) LIKE '%${queries[colName].toLowerCase()}%'`
    }
  );
  return queryString.join(' AND ')
}

module.exports = { sqlForPartialUpdate, sqlForFilterQueries };