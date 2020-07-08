/*
 * Context:
 *   When we work with float numbers in javascript we lose precision. Example: 0.2 + 0.4 = 0.6000000000000001
 *
 * Solution:
 *   There are several solutions
 *   (https://stackoverflow.com/questions/1458633/how-to-deal-with-floating-point-number-precision-in-javascript)
 *
 *   We are using the option to treat all numbers as integers. For money this is good
 *   because we know in advance the presicion of the currency.
 *
 *   This script transform the amounts from float to integer or viceversa.
 *   Example: 10.56 (float) <--> 1056 (int)
 *
 *   Precision defined: 2
 */

const fs = require('fs');
const path = require("path");

const [type, inputFile, outputFile] = process.argv.slice(2)

if(!type || !inputFile) {
  console.log('Usage: node decimal.js <type> <inputFile> <outputFile - optional>\nExample: node decimal.js toInt dbfloat.json dbint.json');
  return;
}

const raw = fs.readFileSync(inputFile, "utf-8");
const db = JSON.parse(raw);

if( !db || !db.records ){
  console.log(db);
  console.log("db.records does not exist");
  return;
}

function toInt() {
  let floatFound = false;
  db.records.forEach(r => {
    if(typeof r.amount !== "number")
      throw new Error(`this amount is not a number but a ${typeof r.amount}: ${r.amount}`);
    if(r.amount % 1 !== 0)
      floatFound = true;
    r.amount = parseInt( 100 * r.amount );
  });
  if(!floatFound)
    console.log("Warning: Float numbers were expected, but the file only contain integers");
}

function toFloat() {
  db.records.forEach(r => {
    if(typeof r.amount !== "number")
      throw new Error(`this amount is not a number but a ${typeof r.amount}: ${r.amount}`);
    if(r.amount % 1 !== 0)
      throw new Error("This file contains float numbers. Only integers are expected");
    r.amount /= 100;
  });
}

function saveFile(t) {
  let file;
  if(outputFile) {
    if(fs.existsSync(outputFile)) {
      console.log("The file '' already exists. Please set a different name or do not set it");
      return;
    }
    file = outputFile;
  } else {
    // set an output name based on the input name
    const extension = path.extname(inputFile);
    let basename = path.basename(inputFile, extension);
    let candidateOutput = basename + t + extension;
    for(let i=1; fs.existsSync(candidateOutput); i+=1 ) {
      candidateOutput = basename + i + t + extension;
    }
    file = candidateOutput;
  }
  fs.writeFileSync(file, JSON.stringify(db));
  console.log(`File saved in ${file}`);
}

if(type === "toInt"){
  toInt();
  saveFile("-int");
} else if(type === "toFloat"){
  toFloat();
  saveFile("-float");
} else {
  console.log("Please use 'toInt' or 'toFloat' in the first argument");
  return;
}
