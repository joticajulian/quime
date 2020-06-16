const express = require("express");
const path = require("path");
const Busboy = require("busboy");

const controller = require("./controller");
const logger = require("../logger");
const { BadRequestError } = require("../errors");

const TIMEOUT_UPLOAD_MS = 10000;

const router = express.Router();

function readFile(req) {
  return new Promise((resolve, reject) => {
    let busboy;
    try {
      busboy = new Busboy({ headers: req.headers });
    } catch (error) {
      throw new BadRequestError(error.message);
    }
    let filename = null;
    let receivingFile = false;
    let buffer = '';

    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(
        new TooLargeError(`Timeout of ${TIMEOUT_UPLOAD_MS} during the upload`)
      );
    }, TIMEOUT_UPLOAD_MS);

    busboy.on("file", (fieldname, file, _filename) => {
      receivingFile = true;
      if (!_filename) throw new BadRequestError("No filename defined");
      filename = path.basename(_filename);
      logger.info(`Reading file ${filename}`);

      file.on("data", (data) => {
        buffer += data;
      });

      file.on("end", () => {
        resolve(buffer);
        clearTimeout(timer);
      });
    });

    busboy.on("finish", () => {
      if (!receivingFile) {
        reject(new BadRequestError("No file received in the body"));
        clearTimeout(timer);
      }
    });

    req.pipe(busboy);
  });
}

// Update record
router.put('/:id', async (req, res, next)=>{
  try {
    const { id } = req.params;
    const record = req.body;
    const result = controller.update(id, record);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// Insert several records
router.put('/', async (req, res, next)=>{
  try {
    const records = req.body;
    const result = controller.insert(records);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// Delete record
router.delete('/:id', async (req, res, next)=>{
  try {
    const { id } = req.params;
    const result = controller.remove(id);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// csv file with records to insert
router.post('/parse', async (req, res, next)=>{
  try{
    const data = await readFile(req);
    const result = controller.parse(data);
    res.send(result);
  }catch(error){
    next(error);
  }
});

// get record
router.get('/:id', (req, res, next)=>{
  try {
    const { id } = req.params;
    const result = controller.getRecord(id);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// get all records
router.get('/', (req, res, next)=>{
  try {
    const result = controller.getRecords();
    res.send(result);
  } catch(error) {
    next(error);
  }
});

module.exports = router;
