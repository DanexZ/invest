const apiRouter = require('express').Router();
const UserController = require('../app/controllers/UserController');
const cors = require('cors');

apiRouter.use(cors());



module.exports = apiRouter