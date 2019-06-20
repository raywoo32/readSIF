/* test.js
NOTE: Need locally install 
npm install --save-dev jest
npm install shelljs //global install for shelljs didn't work
USAGE: run the following in terminal to test 
    npm run test 
PRECONDITION: 
1. options var correct 
2. knex reffers to db with interactions-vincent
3. interactions-vincent has interaction_lookup_table loaded
*/


// 1. INSTALLATIONS AND EXPORTS 
var fs = require('fs');
const options = { 
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'rwoo',
        password: '123Password',
        database: 'interactions_vincent'
    }
}
const knex = require('knex')(options);
const shell = require('shelljs');

// 2. TEST PART ONE, file parsing 


test('2 + 3 = 5', () => {
  expect(5).toBe(5);
});

// 3. TEST PART THREE, insert into db 

/* -1. REFERENCES:
https://www.taniarascia.com/unit-testing-in-javascript/
*/


//VINCENT EX
// const knex = require('./dbConfig.js');
// const shell = require('shelljs');

// const fs = require('fs');

// describe("DB verification unit tests' table", function(){
//   it("unique_sources", async () => {
//     const countOfSources = await knex('external_source').count('*');
//     const numSourcesTSV = Number(shell.exec('sed -e 1d finalDump_2019-05-14.tsv | cut -f 2 | sort | uniq | wc -l').stdout.match(/\d+/g).map(Number));
//     expect(countOfSources[0]['count(*)']).toEqual(numSourcesTSV || 2284); // number provided in case script runs on Windows (i.e. without UNIX tools)
//   });
// });

// describe('Compare number of unique interactions (ppi and pdi) for a given AGI pair:', function(){
//   it("unique_interactions", async ()=>{
//     const countOfItrns = await knex('interactions').count('*');
//     const numItrnsFromTSV = Number(shell.exec("awk 'BEGIN {FS=\"\\t\"}; {print $1, $3, $4}' finalDump_2019-05-14.tsv | grep -v \"^1.0\" | sed '1d' | tr [a-z] [A-Z] | sort | uniq | wc -l"));
//     expect(countOfItrns[0]['count(*)']).toEqual(numItrnsFromTSV || 3191430); // number provided in case script runs on Windows (i.e. without UNIX tools)
//   })
// });


// describe('Compare number of interolog interactions, using reference number from prev db', function(){
//   it("interolog_count", async ()=>{
//     const countOfInterologs = await knex('interolog_confidence_subset_table').count('*');
//     expect(countOfInterologs[0]['count(*)']).toEqual(70933); //number generated from 'select count(*) from interactions_eplant_v4 where Num_species != "0" and aiv_index="0";'
//   })
// });

// describe('Compare number of MI terms', function(){
//   it("mi_terms_count", async ()=>{
//     const countOfMis = await knex('interactions_source_mi_join_table').countDistinct('mi_detection_method');
//     const numOfMIsTSV = Number(shell.exec("sed -e 1d finalDump_2019-05-14.tsv | cut -f 5 | sort | uniq | wc -l"));
//     expect(countOfMis[0]['count(distinct `mi_detection_method`)']).toEqual(numOfMIsTSV || 61); // number provided in case script runs on Windows (i.e. without UNIX tools)
//   })
// });

// afterAll(async () => {
//   await knex.destroy();
// });

/* REFERENCES
https://flaviocopes.com/jest/#introduction-to-jest
https://stackoverflow.com/questions/32041656/could-not-find-module-shelljs
https://devhints.io/shelljs
*/