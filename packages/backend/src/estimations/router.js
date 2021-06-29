const express = require("express");

const controller = require("./controller");
const logger = require("../logger");
const { BadRequestError } = require("../errors");

const router = express.Router();

// Update estimation
router.put('/:position', async (req, res, next)=>{
  try {
    const { position } = req.params;
    const estimation = req.body;
    controller.update(position, estimation);
    res.send(estimation);
  } catch(error) {
    next(error);
  }
});

// Insert estimation
router.post('/', async (req, res, next)=>{
  try {
    const { estimation, position } = req.body;
    controller.insert(position, estimation);
    res.send(estimation);
  } catch(error) {
    next(error);
  }
});

// Delete estimation
router.delete('/:position', async (req, res, next)=>{
  try {
    const { position } = req.params;
    controller.remove(position);
    res.send();
  } catch(error) {
    next(error);
  }
});

// get all accounts
/*router.get('/', (req, res, next)=>{
  try {
    const result = controller.getAccounts();
    res.send(result);
  } catch(error) {
    next(error);
  }
});*/

module.exports = router;
