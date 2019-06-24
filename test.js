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
4. test_dump.sql has been run 
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


// 2. TEST INITIAL STATE OF DATABASE FROM DUMP, VALUES FROM verifications.test.js
//external_source
describe("external_source precondition", function(){
  it("sources", async () => {
    const testSourceCount = await knex('external_source').count('*');
    const realSourceCount = 1; //From verifications.test.js
    expect(testSourceCount[0]['count(*)']).toEqual(realSourceCount); 
  });
});
// interactions 
describe("interaction precondition", function(){
  it("interactions", async ()=>{
    const testInteractionCount = await knex('interactions').count('*');
    const realInteractionCount = 2;
    expect(testInteractionCount[0]['count(*)']).toEqual(realInteractionCount); 
  })
});
// interactions_source_mi_join_table
describe("mi precondition", function(){
  it("mi", async ()=>{
    const testMiCount = await knex('interactions_source_mi_join_table').count('*');
    const realMiCount = 1;
    expect(testMiCount[0]['count(*)']).toEqual(realMiCount);
  })
});


//3. TEST MODIFIED STATE OF DATABASE FROM ADDITION OF example.sif 
//external_source
describe("external_source example.sif", function(){
  it("sources", async () => {
    shell.exec('node insertSIF.js example.sif -n');
    const testSourceCount = await knex('external_source').count('*');
    const realSourceCount = 1; //From verifications.test.js
    expect(testSourceCount[0]['count(*)']).toEqual(realSourceCount); 
  });
});
//interactions 
describe("interaction example.sif", function(){
  it("interactions", async ()=>{
    const testInteractionCount = await knex('interactions').count('*');
    const realInteractionCount = 3;
    expect(testInteractionCount[0]['count(*)']).toEqual(realInteractionCount); 
  })
});
// interactions_source_mi_join_table
describe("mi example.sif", function(){
  it("mi", async ()=>{
    const testMiCount = await knex('interactions_source_mi_join_table').count('*');
    const realMiCount = 3;
    expect(testMiCount[0]['count(*)']).toEqual(realMiCount);
  })
});


// 4. TEST MODIFIED STATE FROM notGRN.sif 
//external_source
describe("external_source notGRN.sif", function(){
  it("sources", async () => {
    shell.exec('node insertSIF.js notGRN.sif -f');
    const testSourceCount = await knex('external_source').count('*');
    const realSourceCount = 2; //From verifications.test.js
    expect(testSourceCount[0]['count(*)']).toEqual(realSourceCount); 
  });
});
//interactions 
describe("interaction notGRN.sif", function(){
  it("interactions", async ()=>{
    const testInteractionCount = await knex('interactions').count('*');
    const realInteractionCount = 4;
    expect(testInteractionCount[0]['count(*)']).toEqual(realInteractionCount); 
  })
});
// interactions_source_mi_join_table
describe("mi notGRN.sif", function(){
  it("mi", async ()=>{
    const testMiCount = await knex('interactions_source_mi_join_table').count('*');
    const realMiCount = 4;
    expect(testMiCount[0]['count(*)']).toEqual(realMiCount);
  })
});





// 5. TEST ROLL BACK USING badExample.sif 
// //external_source
// describe("external_source rollback.sif", function(){
//   it("sources", async () => {
//     shell.exec('node insertSIF.js rollback.sif');
//     const testSourceCount = await knex('external_source').count('*');
//     const realSourceCount = 2; //From verifications.test.js
//     expect(testSourceCount[0]['count(*)']).toEqual(realSourceCount); 
//   });
// });
// //interactions 
// describe("interaction rollback.sif", function(){
//   it("interactions", async ()=>{
//     const testInteractionCount = await knex('interactions').count('*');
//     const realInteractionCount = 4;
//     expect(testInteractionCount[0]['count(*)']).toEqual(realInteractionCount); 
//   })
// });
// // interactions_source_mi_join_table
// describe("mi rollback.sif", function(){
//   it("mi", async ()=>{
//     const testMiCount = await knex('interactions_source_mi_join_table').count('*');
//     const realMiCount = 4;
//     expect(testMiCount[0]['count(*)']).toEqual(realMiCount);
//   })
// });





afterAll(async () => {
  await knex.destroy();
});


/* REFERENCES
https://www.taniarascia.com/unit-testing-in-javascript/ (older version, outdated)
https://flaviocopes.com/jest/#introduction-to-jest
https://stackoverflow.com/questions/32041656/could-not-find-module-shelljs
https://devhints.io/shelljs
https://knexjs.org/
*/