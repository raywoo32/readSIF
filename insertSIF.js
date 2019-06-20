/* readSIF.js
USAGE: 
node insert.js mySIF.sif 
PRECONDITION: 
1. options var correct 
2. knex reffers to db with interactions-vincent
3. interactions-vincent has interaction_lookup_table loaded
TODO: 
combine insert functions 
add flags so can get display information from header 
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
var sif = fs.readFileSync(arg.toString()); 
var sifByLine = sif.toString().split("\n");
const totalLine = sifByLine.length - 1; //minus 1 to be last indexable line 
var currLine = 6; //end of header 

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
    //Clean up take information 
    //TODO: CHANGE WHEN SIF FORMAT KNOWN 
    const sourceName = sifByLine[0].replace('#', '').trim(); //sourceName is PMID, 
    const isGRN = sifByLine[1].replace('#', '').trim(); // throw error is not 1 or 0
    const tags = sifByLine[2].replace('#', '').trim();; // comma separated 
    const comments = sifByLine[4].replace('#', '').trim(); //any type in one line 
    const citation = sifByLine[5].replace('#', '').trim().split(",");
    const title = citation[0].trim();
    const grnTitle = isGRN + "," + title;
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
        interactionElements = interaction.split(" ");  //Split by any whitespace 
        var entity1 = interactionElements[0]; //mod global var
        var entity2 = interactionElements[2]; //mod global var
        var elements = parseInteractionType(interactionElements[1]);
        var interactionTypeId = elements[0];
        var modeOfAction = elements[1];
        return ([entity1, entity2, interactionTypeId, modeOfAction]);
        //        0         1       2                   3
    }
  }
}

/* nextInteraction
Helper function to convert text to interaction_type_id foreign key
*/
function getItrnIdx (AIVIndex) {
  return {
  'ppi' : 1,
  'pdi' : 2,
  'mmi' : 3
  }[AIVIndex]
}

/* insert()
Uses helper functions above to insert into external_source, interaction, and interactions_source_mi_join_table
*/
async function insert() {
  //Get mi from Header 
  const mi = sifByLine[3].replace('#', '').trim().split(",");
  const miDetectionMethod = mi[0].trim(); //throw error if not 2 items comma separated
  const miDetectionType = mi[1].trim();

  // insert into external_source 
  var header = readHeader()
  var sourceId; //so can be used outside of .then()
  const getSourceID = await knex('external_source').select('*').where({
    source_name : header[0]
  })
    .then(  (external_source)=>{
      sourceId = external_source[0].source_id
      console.log('INSERT initialization external_source', external_source);
      if (external_source.length === 0 ){
        console.log(`PMID not found {$sourceName}}, INSERTing into external_source`);
        return knex('external_source').insert({
          //source_id : 1, //TODO
          source_name : header[0],
          comments : header[3],
          date_uploaded : new Date(),
          url : 'www.ncbi.nlm.nih.gov/pubmed/' + header[0], 
          grn_title : header[2],
          tags : header[1],
          image_url : null
        })
      }
      else {
        console.log(`Paper in Database: ${header[0]}, not inserting`);
        return external_source;
      }
  })

  //Start Looping throught Insertion into Interaction and Mi
  while (currLine <= totalLine) {
  var interaction = nextInteraction();
  await knex('interactions').select('*').where({
    entity_1 : interaction[0],
    entity_2 : interaction[1],
    interaction_type_id : getItrnIdx(interaction[2]), 
  })
    .then(  (rows)=>{
      console.log('INSERT initialization interaction and mi', rows);
      if (rows.length === 0 ){
        console.log(`Interaction NOT FOUND ${interaction[0]} ${interaction[2]}-${interaction[3]} ${interaction[1]}, INSERTing - line ${currLine + 1}`);
        var inserted =  knex('interactions').insert({
          entity_1 : interaction[0],
          entity_2 : interaction[1],
          interaction_type_id : getItrnIdx(interaction[2]),
          pearson_correlation_coeff : null
        })
        console.log("new INSERT RETURN")
        return inserted;
      }
      else {
        console.log(`Interaction in Database: ${interaction[0]}-${interaction[3]} ${interaction[1]}, NOT INSERTing - line ${currLine + 1}`);
        return rows;
      }
    })
      //Insert into Mi table 
    .then(async(interactionReturn)=>{
      const joinTablePreSelect = await knex('interactions_source_mi_join_table').where({
        interaction_id : interactionReturn[0].interaction_id || interactionReturn,
        source_id : sourceId,
        mi_detection_method : miDetectionMethod,
        mi_detection_type : miDetectionType
      });
      if (joinTablePreSelect.length === 0 ) {
        console.log("inserting mi");
        return knex('interactions_source_mi_join_table').insert({
          interaction_id : interactionReturn[0].interaction_id || interactionReturn,
          source_id : sourceId,
          external_db_id : "",
          mi_detection_method : miDetectionMethod,
          mi_detection_type : miDetectionType,
          mode_of_action : 1 //Just put 1 because it wasn't accepting blank
        });
      }
      else {
        console.log("did not add mi, already in db");
      }
    currLine = currLine + 1 
    })
    .catch((err)=>{
      console.error('Error:', err);
      throw new Error('STOP!');
    })    
  }
}

/*CONTROLLER EXECUTION */
insert()
.finally(() => {knex.destroy();})

// INITIAL TESTING 
//readHeader()
//console.log(readHeader()); 
//[ 'PMID', 'tags, more tags', '1', 'miDectionMethod', 'miDetectionType', 'Comments, these are fun comments!', 'Author', 'Title of Paper', 'Journal', 71 ]

//nextInteractin and parseInteractionType
//console.log(nextInteraction(currLine)) //[ 'AT2G30530', 'AT4G33430', '2', 'a' ]

// getItrnIdx (AIVIndex) 
//console.log("GET INDEX", getItrnIdx("ppi"), getItrnIdx("pdi")) //GET INDEX 1 2

/* CITATIONS
https://github.com/VinLau/BAR-interactions-database
http://zetcode.com/javascript/jest/
https://stackoverflow.com/questions/18724378/check-if-a-line-only-contain-whitespace-and-n-in-js-node-js
https://stackoverflow.com/questions/41080543/how-to-use-knex-with-async-await
*/