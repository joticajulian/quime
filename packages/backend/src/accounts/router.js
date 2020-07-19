const express = require("express");

const controller = require("./controller");
const logger = require("../logger");
const { BadRequestError } = require("../errors");

const router = express.Router();

// Update account
router.put('/:name', async (req, res, next)=>{
  try {
    const { name } = req.params;
    const account = req.body;
    const result = controller.update(name, account);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// Insert account
router.put('/', async (req, res, next)=>{
  try {
    const account = req.body;
    const result = controller.insert(account);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// Delete account
router.delete('/:name', async (req, res, next)=>{
  try {
    const { name } = req.params;
    const result = controller.remove(name);
    res.send(result);
  } catch(error) {
    next(error);
  }
});

// get all accounts
router.get('/', (req, res, next)=>{
  try {
    const result = controller.getAccounts();
    res.send(result);
  } catch(error) {
    next(error);
  }
});

module.exports = router;
