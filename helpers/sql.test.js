/** Test sqlForPartialUpdate function */

const { sqlForPartialUpdate, sqlForFilterQueries } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("Generate SQL from JSON data for partial updates.", () => {

    let jsToSql = {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      };
    
    test("Correctly formats all provided data.", () => {
        let dataToUpdate = { 
            password: "secretpassword",
            firstName: "Bobby", 
            lastName: "McGee", 
            isAdmin: true,
            email: "hello@bm.com" };
        
        expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
            setCols: "\"password\"=$1, \"first_name\"=$2, \"last_name\"=$3, \"is_admin\"=$4, \"email\"=$5",
            values: ["secretpassword", "Bobby", "McGee", true, "hello@bm.com"]
            });

    });

    test("Returns Object with correctly formatted SQL column names for valid request data.", () => {
        let dataToUpdate = { 
            firstName: 'Bobby', 
            lastName: "McGee", 
            isAdmin: true };

        expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
            setCols: "\"first_name\"=$1, \"last_name\"=$2, \"is_admin\"=$3",
            values: ["Bobby", "McGee", true]
          });
    });

    test("Returns Object with formatted data for request keys not in jsToSql.", () => {
        let dataToUpdate = { email: "test@gmail.com", password: "password" }

        expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
            setCols: "\"email\"=$1, \"password\"=$2",
            values: ["test@gmail.com", "password"]
          });

    });

    test("Throws BadRequestError if JSON data is empty.", () => {
        let dataToUpdate = {};
        try {
            sqlForPartialUpdate(dataToUpdate, jsToSql);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

// describe("Generate SQL from JSON data for Company JSON schema.", () => {

//     let jsToSql = {
//         numEmployees: "num_employees",
//         logoUrl: "logo_url",
//       };
    
//     test("Correctly formats all provided data.", () => {
//         let dataToUpdate = { 
//             name: "Test Company", 
//             description: "The test company description!",
//             numEmployees: 500, 
//             logoUrl: "http://www.mylogo.com/logo.png" };
        
//         expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
//             setCols: "\"name\"=$1, \"description\"=$2, \"num_employees\"=$3, \"logo_url\"=$4",
//             values: ["Test Company", "The test company description!", 500, "http://www.mylogo.com/logo.png"]
//             });
//     });

//     test("Returns Object with correctly formatted SQL column names for valid request data.", () => {
//         let dataToUpdate = { 
//             numEmployees: 500, 
//             logoUrl: "http://www.mylogo.com/logo.png" };

//         expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
//             setCols: "\"num_employees\"=$1, \"logo_url\"=$2",
//             values: [500, "http://www.mylogo.com/logo.png"]
//           });
//     });

//     test("Returns Object with formatted data for request keys not in jsToSql.", () => {
//         let dataToUpdate = { 
//             name: "Test Company", 
//             description: "The test company description!" }

//         expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
//             setCols: "\"name\"=$1, \"description\"=$2",
//             values: ["Test Company", "The test company description!"]
//           });
//     });
// });

describe("Generate SQL queryString from JSON data for filter search.", () => {

    let allowed = ['name', 'minEmployees', 'maxEmployees', 'title', 'minSalary', 'hasEquity'];

    test("Returns queryString for valid query parameters.", () => {
        let queries = { name: 'anderson', minEmployees: '200', maxEmployees: '5000' };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("lower(name) LIKE '%anderson%' AND num_employees >= 200 AND num_employees <= 5000");

    });

    test("Returns correct query string for name parameter.", () => {
        let queries = { name: 'llc' };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("lower(name) LIKE '%llc%'");
    });

    test("Returns correct query string for name parameter in lowercase.", () => {
        let queries = { name: 'AnDeRSON' };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("lower(name) LIKE '%anderson%'");
    });

    test("Returns correct query string for minEmployees parameter.", () => {
        let queries = { minEmployees: '100' };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("num_employees >= 100");
    });

    test("Returns correct query string for maxEmployees parameter.", () => {
        let queries = { maxEmployees: '7000' };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("num_employees <= 7000");
    });

    test("returns correct query string for title", async () => {
        let queries = { title: "jr. engineer" };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("lower(title) LIKE '%jr. engineer%'");
    });

    test("returns correct query string for minSalary", async () => {
        let queries = { minSalary: "50000" };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("salary >= 50000");
    });

    test("returns correct query string for hasEquity true", async () => {
        let queries = { hasEquity: "true" };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("equity > 0");
    });

    test("returns correct query string for hasEquity false", async () => {
        let queries = { hasEquity: "false" };
        expect(sqlForFilterQueries(queries, allowed)).toEqual("equity >= 0");
    });

    test("Throws BadRequestError for invalid query parameter.", () => {
        try {
            let queries = { name: 'llc', cats: '200', maxEmployees: '300' };
            sqlForFilterQueries(queries, allowed);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("Throws BadRequestError if minEmployees value is greater than maxEmployees value.", () => {
        try {
            let queries = { name: 'llc', minEmployees: '400', maxEmployees: '300' };
            sqlForFilterQueries(queries, allowed);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("Throws BadRequestError for empty query parameter value.", () => {
        try {
            let queries = { name: "" };
            sqlForFilterQueries(queries, allowed);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("Throws BadRequestError for empty string query parameter value.", () => {
        try {
            let queries = { name: " " };
            sqlForFilterQueries(queries, allowed);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("Throws BadRequestError for null query parameter value.", () => {
        try {
            let queries = { name: "null" };
            sqlForFilterQueries(queries, allowed);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("Throws BadRequestError for undefined query parameter value.", () => {
        try {
            let queries = { name: "null" };
            sqlForFilterQueries(queries, allowed);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});