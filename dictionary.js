/* dictionary.js
Stores 
*/

function getItrnIdx (AIVIndex) {
  return {
  'ppi' : 1,
  'pdi' : 2,
  'mmi' : 3
  }[AIVIndex]
}

function getModeOfAction (moa) {
  return {
  'a' : 2,
  'r' : 3,
  null : 1
  }[moa]
}



module.exports = {
    getItrnIdx, getModeOfAction
};


