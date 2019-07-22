/* test.js
NOTE: Need locally install 
npm install --save-dev jest
npm install shelljs //global install for shelljs didn't work
USAGE: run the following in terminal to test 
    npm run test 
PRECONDITION: 
1. options var correct 
2. dbConfig.js reffers to db with interactions-vincent
3. interactions-vincent has interaction_lookup_table loaded
4. test_dump.sql has been run 
5. "/DATA/GRN_Images/" directory exists
*/


// 1. INSTALLATIONS AND EXPORTS 
var fs = require('fs');
const knex = require('./dbConfig.js');
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
    shell.exec('node insertSIF.js ./test/example.sif ./test/test.jpg');
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
    shell.exec('node insertSIF.js ./test/notGRN.sif ./test/test.jpg -f');
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

// 5. TEST ROLL BACK USING rollback.sif 
//external_source
describe("external_source rollback.sif", function(){
  it("sources", async () => {
    shell.exec('node insertSIF.js ./test/rollback.sif ./test/rollback.jpg');
    const testSourceCount = await knex('external_source').count('*');
    const realSourceCount = 2; //From verifications.test.js
    expect(testSourceCount[0]['count(*)']).toEqual(realSourceCount); 
  });
});
//interactions 
describe("interaction rollback.sif", function(){
  it("interactions", async ()=>{
    const testInteractionCount = await knex('interactions').count('*');
    const realInteractionCount = 4;
    expect(testInteractionCount[0]['count(*)']).toEqual(realInteractionCount); 
  })
});
// interactions_source_mi_join_table
describe("mi rollback.sif", function(){
  it("mi", async ()=>{
    const testMiCount = await knex('interactions_source_mi_join_table').count('*');
    const realMiCount = 4;
    expect(testMiCount[0]['count(*)']).toEqual(realMiCount);
  })
});


// check images uploaded to directory 
describe("image directory", function(){
  it("images", async ()=>{
    fs.readdir("/DATA/GRN_Images/", function(err, items) {
    expect(items.toEqual([ 'test.jpg' ]));
    })
  })
});

// 6. CLEAN UP 
afterAll(async () => {
  await knex.destroy();
});

/* NOTE test inquirer manually with:
node insertSIF.js ./test/version.sif ./test/rollback.jpg
  and say yes or no (inquirer does not work with jest)
 */
