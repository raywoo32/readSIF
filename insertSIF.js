/* readSIF.js
USAGE: 
node insert.js mySIF.sif 
PRECONDITION: 
1. options var correct 
2. knex reffers to db with interactions-vincent
3. interactions-vincent has interaction_lookup_table loaded
TODO: 
add flags so can get display information from header???
*/

// PART I. Imports and Load Knex
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

// PART 1.1 READ AND GLOBAL VARS 
// Global Variables! TODO: Change, bad style. 
const arg = process.argv.slice(2);
var sif = fs.readFileSync(arg[0].toString()); 
var sifByLine = sif.toString().split("\n");
//flags
var flag = arg[1];
var isGRN = true;
if ( typeof flag != 'undefined') { // any third argument can mean is not grn
  isGRN = false;
}
const totalLine = sifByLine.length - 1; //minus 1 to be last indexable line 
var currLine = 5; //end of header 

//PART 1.2 EXPORT FUNCTIONS FOR TESTING 
module.exports = { getItrnIdx };

/* TODO determine what to do about GET author name, title, journal, 
// MAKE FUNCTION TO GET TITLE, NAME AND JOURNAL?, would need to implement options with flags
eg. node insert.js mySIF.sif -SOMEFLAG
function getDisplay() {
  const citation = sifByLine[5].replace('#', '').trim().split(",");
  const title = citation[0].trim();
  const authors = citation[1].trim();
  const journal = citation[2].trim(); 
  const tags = sifByLine[2].replace('#', '').trim(); // comma separated 
  return ([title, authors, journal, tags])
}
*/

/* readHeader()
Helper function called by inserts that reads the header. 
TODO: modify based on sif format. Currently format as seen in example.sif 
@return array, See final line of function (has indexes for easy reading)
*/
function readHeader() {
    const sourceName = sifByLine[1].replace('#source_name:', '').trim(); 
    var grnTitle = sifByLine[0].replace('#grn_title:', '').trim(); 
    const tags = sifByLine[3].replace('#tags:', '').trim();
    const comments = sifByLine[2].replace('#comments:', '').trim(); //any type in one line 
    if (isGRN == false) { grnTitle = null; }
    return([sourceName, tags, grnTitle, comments])
    //      0            1      2      3            
}

/* parseInteractionType()
Assigns global variables interactionTypeId and modeOfAction from string if of a valid format.
Called in getNextInteraction(). validity check. 
@input string of format interactionTypeId-modeOfAction
@output change in global variables or error thrown 
*/
function parseInteractionType(string) {
  var elements = string.split("-");
  interactionTypeId = elements[0].trim();
  if (elements.length == 2) {
    modeOfAction = elements[1].trim();
  }
  else {
    modeOfAction = null;
  }
  return ([interactionTypeId, modeOfAction])
  //        0                 1
}


/* nextInteraction
Reads one line of sif file that contains an interaction and returns information in an array. 
currLine is controlled outside of this function, for reporting errors, etc. 
@param int currLine, the line after the header with the next interaction on it. Starts as 6
@return See final line of function 
*/
function nextInteraction() {
  while (currLine <= totalLine) {
    var interaction = sifByLine[currLine]
    if (interaction.trim().length == 0) { //Check if line is whitespace, allowed?
        currLine = currLine + 1;
        nextInteraction(currLine);
    } 
    else {
        interaction = interaction.trim();
        interactionElements = interaction.split(" ");  
        var entity1 = interactionElements[0].toUpperCase(); //force upper 
        var entity2 = interactionElements[2].toUpperCase().split("|")[0]; 
        var elements = parseInteractionType(interactionElements[1]);
        var interactionTypeId = elements[0];
        var modeOfAction = elements[1];
        var miDetectionMethod = interactionElements[2].toUpperCase().split("|")[1];
        var miDetectionType =interactionElements[2].toUpperCase().split("|")[2];
        return ([entity1, entity2, interactionTypeId, modeOfAction, miDetectionMethod, miDetectionType]);
        //        0         1       2                   3             4                 5
    }
  }
}

/* 
Helper function to convert text to interaction_type_id foreign key
*/
function getItrnIdx (AIVIndex) {
  return {
  'ppi' : 1,
  'pdi' : 2,
  'mmi' : 3
  }[AIVIndex]
}

/* n
Helper function to convert mode of action text into foreign key for modes_of_action_lookup_table
*/
function getModeOfAction (moa) {
  return {
  'a' : 2,
  'r' : 3,
  null : 1
  }[moa]
}

/* insert()
Uses helper functions above to insert into external_source, interaction, and interactions_source_mi_join_table
*/
async function insert() {

  // insert into external_source 
  var header = readHeader()
  var sourceId; //so can be used outside of .then()
  const getSourceID = await knex('external_source').select('*').where({
    source_name : header[0]
  })
    .then(  (external_source)=>{
      console.log('INSERT initialization external_source');
      if (external_source.length === 0 ){
        console.log(`PMID not found {$sourceName}}, INSERTing into external_source`);
        var insertSource = knex('external_source').insert({
          source_name : header[0],
          comments : header[3],
          date_uploaded : new Date(),
          url : 'www.ncbi.nlm.nih.gov/pubmed/' + header[0], 
          grn_title : header[2],
          tags : header[1],
          image_url : null
        })
        .then(  (insertedSource)=>{
          console.log(insertedSource)
          console.log(insertedSource[0]);
          sourceId = insertedSource[0];
          return insertedSource;
        })
      }
      else {
        console.log(`Paper with PMID:${header[0]} in Database: not inserting`, external_source);
        sourceId = external_source[0].source_id
        return external_source;
      }
  })

  //Start Looping throught Insertion into Interaction and Mi
  while (currLine <= totalLine) {
  var interaction = nextInteraction();
  currLine = currLine + 1 
  await knex('interactions').select('*').where({
    entity_1 : interaction[0],
    entity_2 : interaction[1],
    interaction_type_id : getItrnIdx(interaction[2])
  })
    .then(  (rows)=>{
      console.log(`INSERT interactions ${currLine}`);
      if (rows.length === 0 ){
        console.log(`Interaction ${interaction[0]} ${interaction[2]} ${interaction[1]} NOT FOUND, INSERTing - line ${currLine}`);
        var inserted =  knex('interactions').insert({
          entity_1 : interaction[0],
          entity_2 : interaction[1],
          interaction_type_id : getItrnIdx(interaction[2]),
          pearson_correlation_coeff : null
        })
        return inserted;
      }
      else {
        console.log(`Interaction ${interaction[0]} ${interaction[2]} ${interaction[1]} in Database: NOT INSERTing - line ${currLine}`, rows);
        return rows;
      }
    })
      //Insert into Mi table 
    .then(async(interactionReturn)=>{
      console.log("Check THIS EXECUTES");
      const joinTablePreSelect = await knex('interactions_source_mi_join_table').where({
        interaction_id : interactionReturn[0].interaction_id || interactionReturn,
        source_id : sourceId,
        mi_detection_method : interaction[4],
        mi_detection_type : interaction[5],
        mode_of_action : getModeOfAction(interaction[3]) 
      });
      console.log(`INSERT initialization interactions_source_mi_join_table ${currLine}`);
      if (joinTablePreSelect.length === 0 ) {
        console.log(`Interactions-Source Mi not in database: INSERTing - line ${currLine}`);
        return knex('interactions_source_mi_join_table').insert({
          interaction_id : interactionReturn[0].interaction_id || interactionReturn,
          source_id : sourceId,
          external_db_id : "",
          mi_detection_method : interaction[4],
          mi_detection_type : interaction[5],
          mode_of_action : getModeOfAction(interaction[3]) //Just put 1 because it wasn't accepting blank
        });
      }
      else {
        console.log(`Interactions-Source Mi in database: NOT INSERTing - line ${currLine}`, joinTablePreSelect);
        //return interactionReturn;
      }
    })
    .catch((err)=>{
      console.error('Error:', err);
      throw new Error('STOP!');
    })    
  }
  console.log("FINISHED")
}

/* QUESTIONS
1. MI INSERT 
  mode_of_action : 1 //Just put 1 because it wasn't accepting blank or default 
2. WHERE MI TYPE, DECTECTIONS
3. WHAT |401|432 ETC. 
*/

/*CONTROLLER EXECUTION */
insert()
.finally(() => {knex.destroy();})



// INITIAL TESTING 
// READ HEADER TEST 1
//=console.log(readHeader())
/*[ '21245844', 
'Y1H|Y2H|Root Stele|qPCR|ChIP|OBP2|REV',
'Brady et al.(MOL SYST BIOL, 2011) Root Stele Network',
'Root stele gene network initially mapped with Y1H and Y2H on highly-enriched TFs (based on root spatiotemporal map) and miRNA-of-interest promoters. In planta confirmation and regulation determnined via
ChIP and qPCR. - Vincent' ]
*/

// NEXT INTERACTION TEST 
//
//console.log(nextInteraction(currLine)) //[ 'AT2G44940', 'AT5G60200', 'pdi', null ]

// getItrnIdx (AIVIndex) 
//console.log("GET INDEX", getItrnIdx("ppi"), getItrnIdx("pdi")) //GET INDEX 1 2

/* CITATIONS
https://github.com/VinLau/BAR-interactions-database
http://zetcode.com/javascript/jest/
https://stackoverflow.com/questions/18724378/check-if-a-line-only-contain-whitespace-and-n-in-js-node-js
https://stackoverflow.com/questions/41080543/how-to-use-knex-with-async-await
https://github.com/sheerun/knex-migrate //migrate
*/