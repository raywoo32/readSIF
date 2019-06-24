# readSIF

A simple Node JS to load an exisiting database with a .sif file.
* Database definition can be seen 
[here](https://github.com/VinLau/BAR-interactions-database) and in test_dump.sql
* .sif definition can be seen in sifDefinition.sif 

Note: If one item in the .sif file cannot be uploaded, no item from the .sif will be uploaded 

## Getting Started

1. Install prerequisites
2. Save Project folder
3. Load database by executing schema.sql (WARNING: LOADS OVER EXISTING DB)
3. Change ./dbConfig.js to db and server specifications 
4. Add YOURSIF.sif to Project folder
5. Execute one of the following commands

For uploading a GRN 
```
node readSIF.js <YOURSIF.sif>
```

For uploaded not a GRN
```
node readSIF.js <YOURSIF.sif> -n
```

### Prerequisites

jest, fs, knex, mysql, shelljs

```
npm jest -g
```

## Running the tests

1. Complete 1-4 in "Getting Started"
2. load test_dump.sql in mysql2
3. `npm run test`in project directory

Post Test cleanup:
1. Execute schema.sql to clear db
2. Execute test_dump.sql to reset for testing 

## Versioning

[github](https://github.com/raywoo32/readSIF). 

## Acknowledgments

* Based on Vincent Lau's [insertIntoTables.js] (https://github.com/VinLau/BAR-interactions-database)and in test_dump.sql)
* See Citations and Resources 

## Citations 

* Testing 
[jest tutorial 1](http://zetcode.com/javascript/jest/),
[jest tutorial 2](https://flaviocopes.com/jest/#introduction-to-jest)
* Async and Await 
[stack](https://stackoverflow.com/questions/41080543/how-to-use-knex-with-async-await)
* Parsing
[whitespace](https://stackoverflow.com/questions/18724378/check-if-a-line-only-contain-whitespace-and-n-in-js-node-js)
* Knex
[migrate](https://github.com/sheerun/knex-migrate),
[site](https://knexjs.org/),
[cheatsheet](https://devhints.io/knex),
[transactions](https://sqorn.org/docs/transactions.html),
[rollback stack](https://stackoverflow.com/questions/40581040/commit-rollback-a-knex-transaction-using-async-await/43852672),
[github](https://github.com/tgriesser/knex)
* Debugging
[shelljs](https://stackoverflow.com/questions/32041656/could-not-find-module-shelljs)
* Shelljs
[main](https://devhints.io/shelljs)
* JavaScript General
Frameworks for Modern Web Dev, by Tim Ambler and Nicholas Cloud,
[promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)