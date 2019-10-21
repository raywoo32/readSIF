/* readSIF.js
USAGE: 
  node insert.js mySIF.sif 
  node insert.js myNOTGRN.sif -n
PRECONDITION: 
1. options var correct 
2. knex reffers to db with interactions-vincent
3. interactions-vincent has interaction_lookup_table loaded
4. "/DATA/GRN_Images/" directory exists
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
var imageName;
if (imagePath = "na") {
  var imageName =  "test.png"; //THIS IS IMAGE DEFAULT
}
else{
  var imageName = imageSplit[imageSplit.length - 1];
}

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
    console.log("tags", tags)
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
function askVersion(numEntries) {
  const questions = [
    {
      name: 'toDisplay',
      type: 'confirm', //y n
      message: `${numEntries} version(s) of this paper have already been uploaded. Do you want to continue?`,
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

//2.2 : INQUIRER ASK WHAT TYPE OF TAGS
function parseTags(tag) {
  console.log("TAG", tag)
  var choices = ["GENE", "EXPERIMENT", "CONDITION", "MISC"]
  var tagName = tag.split(":")[0];
  var category = tag.split(":")[1];
  console.log("TAGNAME", tagName)
  console.log("CATEGORY", category)
  if (choices.includes(category.toUpperCase()) === true) {
    return [tagName, category];
  }
  else {
    throw "Incorrect tag type found";
  }
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

  // How many versions are there 
  var numEntries = null; //null when no previous versions 
  var newPmidToEnter; //the pmid with the #version number if needed 
  const entryNotVersioned = await knex('external_source').select('*').where({  //look for has one entry not versioned 
    source_name : pmidOnly
  })
    .then( (has1Entry) =>{
      if (has1Entry[0] != null) {
        console.log('Paper with same pmid has been entered once:', has1Entry); //could be versioned or not have an entry
        numEntries = 2;
        newPmidToEnter = pmidOnly + "#2" 
      }
    })
    if (numEntries != 2 ) { //could have no entry or many versions 
      const atLeast2Versioned = await knex('external_source').select('*').where({ // if exists already has at least 2 entries, is versioned 
        source_name : pmidOnly + "#1"
      })
        .then( (isVersionedIfExists) => {
          if (isVersionedIfExists[0] != null) {
            numEntries = 3; // Continue in loop below 
          }
          else {
            newPmidToEnter = pmidOnly;
          }
        })
    }

  // Check how many versions there are if there is already versioning 
  console.log("num entries", numEntries)
  if (numEntries == 3) { // is 2 for now by definition, search for a higher entry number now 
    versionExists = true;
    while (versionExists == true) {
      const checkExists = await knex('external_source').select('*').where({ // if exists already has at least 2 entries, is versioned 
        source_name : header[0] + "#" + numEntries
      })
      .then( (checkVersion) => {
        if (checkVersion[0] == null) {
          versionExists = false;
        }
        else {
          numEntries = numEntries + 1;
        }
      })
    }
    newPmidToEnter = pmidOnly + "#" + numEntries
  }

  // Perform action based on number of versions, 0 already done 
  if (numEntries >= 2 ) { //one entry not versioned 
      //ask if you want to add the second version 
      console.log("ask version")
      const y_n = await askVersion(numEntries - 1);
      if (y_n.toDisplay == false){
        console.log("exiting...");
        process.exit();
      }
      else {
        if ( numEntries == 2 ) { //Updates old version of the unversioned to denote versioning when only 1 entry 
          const versionExisting = await knex('external_source').where({ source_name: pmidOnly }).update({ source_name: pmidOnly +'#1' });
          newPmidToEnter = pmidOnly + "#2";
        }
      }
  }
  // Do external_source insert 
  console.log('INSERT initialization external_source');
  var sourceId;
  var insertSource = await trx('external_source').insert({
    source_name : newPmidToEnter,
    comments : header[3],
    date_uploaded : new Date(),
    url : 'www.ncbi.nlm.nih.gov/pubmed/' + pmidOnly, 
    grn_title : header[2],
    image_url : "https://bar.utoronto.ca/GRN_Images/" + imageName
  })
  .then( (checkInserted) => {
    sourceId = checkInserted[0];
  })

  //Handle tags
  console.log("HEADER", header[1])
  var tagsList = header[1].split("|");
  console.log("tagsList", tagsList)
  for (tag of tagsList) {
    //Check if inserted into new sql category
    var parsed = await parseTags(tag);
    tagName = parsed[0];
    tagType = parsed[1];
    console.log(`Linking source and tag`)
    console.log(tagName, sourceId)
    const doesTagExist = await knex('tag_lookup_table').select('*').where({ // TAG Is the key. Ask after. 
      'tag_name' : tagName
    })
    .then(  (rows)=>{
      console.log(`INSERT tag ${tagName}, ${tagType}`);
      if (rows.length === 0 ){
        console.log(`Tag NOT FOUND, creating ${tagName}, ${tagType}`);
        var inserted =  trx('tag_lookup_table').insert({
          'tag_name' : tagName,
          'tag_group' : tagType
        })
        return inserted;
      }
      else {
        console.log(`Tag ${tagName} in Database: NOT INSERTing into tag_lookup_table`);
        return rows;
      }
    })
    var insertTagSource =  await trx('source_tag_join_table').insert({
      'tag_name' : tagName,
      'source_id' : sourceId
    })
  }

  //Start Looping throught Insertion into Interaction and Mi
  while (currLine <= totalLine) {
  if (sifByLine[currLine] == "") {
    currLine = currLine + 1;
    console.log(`Blank line on ${currLine}`)
    continue;
  }
  var interaction = nextInteraction();
  currLine = currLine + 1 
  console.log("INTERACTION", interaction)
  await knex('interactions').select('*').where({
    entity_1 : interaction[0],
    entity_2 : interaction[1],
    interaction_type_id : dictionary.getItrnIdx(interaction[2])
  })
    .then(  (rows)=>{
      console.log(`INSERT interactions on line ${currLine}`);
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
      console.log(interaction[4])
      console.log("TYPE", interaction[5])
      const joinTablePreSelect = await knex('interactions_source_mi_join_table').where({
        interaction_id : interactionReturn[0].interaction_id || interactionReturn,
        source_id : sourceId,
        mi_detection_method : interaction[4],
        mi_detection_type : interaction[5],
        mode_of_action : dictionary.getModeOfAction(interaction[3]) 
      });
      console.log(`INSERT initialization interactions_source_mi_join_table on line ${currLine}`);
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
  if (imagePath != "na") {
    copyImage();
  }
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

/*
NOTE TO VINCET: 
- CHANGE READ SIF TO BE CASE INSENSITIVE, not all upper, just accept if it is the same lettering
- drop tags from external_source

TODO:
- CROP IMAGES, 
- fix comments and 
- set default url to cat image maybe 
-  REMOVE .1  306 
- APPEND CATEFORY TO TAGS in script 

- WRITE AS TAG:EXPERIMENT, condition ect. 


*/