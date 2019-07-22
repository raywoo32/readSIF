/* readSIF.js
USAGE: 
  node insert.js mySIF.sif 
  node insert.js myNOTGRN.sif -n
PRECONDITION: 
1. options var correct 
2. knex reffers to db with interactions-vincent
3. interactions-vincent has interaction_lookup_table loaded
*/

// PART 1: Imports and Load Knex
var fs = require('fs');
const knex = require('./dbConfig.js');
var dictionary = require('./dictionary.js');
const inquirer   = require('inquirer');

// PART 1.1: READ AND GLOBAL VARS 
const arg = process.argv.slice(2);
var sif = fs.readFileSync(arg[0].toString()); 
var sifByLine = sif.toString().split("\n");
//image 
var imagePath = arg[1];
var imageSplit = imagePath.toString().split("/"); //ONLY ACCEPTS "/" as separator, not Windows filepath
var imageName = imageSplit[imageSplit.length - 1];

//flags
var flag = arg[2];
var isGRN = true;
if ( typeof flag != 'undefined') { // any third argument can mean is not grn
  isGRN = false;
}
const totalLine = sifByLine.length - 1; //minus 1 to be last indexable line 
var currLine = 5; //end of header 

// PART 2: HELPER FUNCTIONS
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

// 2.1 : INQUIRER FOR PAPER UPLOAD
function askVersion() {
  const questions = [
    {
      name: 'toDisplay',
      type: 'confirm', //y n
      message: 'A previous version of this paper has been uploaded. Do you want to continue?',
      validate: function( value ) {
          if (value == "n") {
            console.log("no") //TODO
          }
          else {
            console.log('yes')
          }
      }
    }
  ];
  return inquirer.prompt(questions);
}


// PART 2.2: LOAD IMAGE TO CORRECT DIRECTORY
// Modified from: https://stackoverflow.com/questions/5212293/how-to-copy-a-image
function copyImage() {
  fs.readFile(imagePath, function (err, data) {
    if (err) throw err;
    fs.writeFile("/DATA/GRN_Images/" + imageName, data, function (err) {
        if (err) throw err;
        console.log('Image copied to correct directory');
    });
  });
}


// PART 3: SCRIPT EXECUTION 
knex.transaction(async function(trx) {
  // insert into external_source 
  var header = readHeader()
  split = header[0].split("#");
  pmidOnly = split[0];
  isVersion = true; 
  if (split.length === 1){
    isVersion = false;
  }
  if (isVersion == true) {
    const y_n = await askVersion();
    if (y_n.toDisplay == false){
      console.log("exiting...");
      process.exit();
    }
  }
  var sourceId; //so can be used outside of .then()
  const getSourceID = await knex('external_source').select('*').where({
    source_name : header[0]
  })
    .then(  (external_source)=>{
      console.log('INSERT initialization external_source');
      if (external_source.length === 0 ){
        console.log(`PMID not found {$sourceName}}, INSERTing into external_source`);
        var insertSource = trx('external_source').insert({
          source_name : header[0],
          comments : header[3],
          date_uploaded : new Date(),
          url : 'www.ncbi.nlm.nih.gov/pubmed/' + pmidOnly, 
          grn_title : header[2],
          tags : header[1],
          image_url : "https://bar.utoronto.ca/GRN_Images/" + imageName
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
  if (sifByLine[currLine] == "") {
    currLine = currLine + 1;
    console.log(`Blank line on ${currLine}`)
    continue;
  }
  var interaction = nextInteraction();
  currLine = currLine + 1 
  await knex('interactions').select('*').where({
    entity_1 : interaction[0],
    entity_2 : interaction[1],
    interaction_type_id : dictionary.getItrnIdx(interaction[2])
  })
    .then(  (rows)=>{
      console.log(`INSERT interactions ${currLine}`);
      if (rows.length === 0 ){
        console.log(`Interaction ${interaction[0]} ${interaction[2]} ${interaction[1]} NOT FOUND, INSERTing - line ${currLine}`);
        var inserted =  trx('interactions').insert({
          entity_1 : interaction[0],
          entity_2 : interaction[1],
          interaction_type_id : dictionary.getItrnIdx(interaction[2]),
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
      const joinTablePreSelect = await knex('interactions_source_mi_join_table').where({
        interaction_id : interactionReturn[0].interaction_id || interactionReturn,
        source_id : sourceId,
        mi_detection_method : interaction[4],
        mi_detection_type : interaction[5],
        mode_of_action : dictionary.getModeOfAction(interaction[3]) 
      });
      console.log(`INSERT initialization interactions_source_mi_join_table ${currLine}`);
      if (joinTablePreSelect.length === 0 ) {
        console.log(`Interactions-Source Mi not in database: INSERTing - line ${currLine}`);
        return trx('interactions_source_mi_join_table').insert({
          interaction_id : interactionReturn[0].interaction_id || interactionReturn,
          source_id : sourceId,
          external_db_id : "",
          mi_detection_method : interaction[4],
          mi_detection_type : interaction[5],
          mode_of_action : dictionary.getModeOfAction(interaction[3]) 
        });
      }
      else {
        console.log(`Interactions-Source Mi in database: NOT INSERTing - line ${currLine}`, joinTablePreSelect);
      }
    })
  }
})
.then(function(inserts) {
  copyImage();
  console.log("Sif file uploaded to database");
})
.catch(function(error) {
  console.log("Sif file NOT uploaded to database");
  console.error(error);
})

/* CLEAN UP */
.finally(() => {knex.destroy();})


// Initil Junk code


/* 
TODO: 
1. Add y/n when uploading new version of same PMID with # an int 
2. Reject when same name of PMID and tell to make a version if they are sure 
    https://flaviocopes.com/node-input-from-cli/
    https://stackoverflow.com/questions/5212293/how-to-copy-a-image
    inquirer
3. Add function to add image to directory  DONE
    https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
4. (Accept 2 arguments only, with picture) DONE 
    Easy
5. Make default picture 
    Photoshop, send copy to Vincent 

Add dependencies, fs, inquirer, etc. 

*/