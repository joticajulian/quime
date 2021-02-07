const express = require("express");

const controller = require("./controller");
const logger = require("../logger");
const { BadRequestError } = require("../errors");

const router = express.Router();

// Update currency
router.put('/:name', async (req, res, next)=>{
  try {
    const { name } = req.params;
    const currency = req.body;
    const result = controller.update(name, currency);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// Insert currency
router.post('/', async (req, res, next)=>{
  try {
    const currency = req.body;
    const result = controller.insert(currency);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// Delete currency
router.delete('/:name', async (req, res, next)=>{
  try {
    const { name } = req.params;
    const result = controller.remove(name);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

module.exports = router;
