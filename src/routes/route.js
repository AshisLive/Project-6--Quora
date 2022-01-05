const express = require('express');
const router = express.Router();
const userController = require('../Controller/userController')
const questionController = require('../Controller/questionController')
const answerController = require('../Controller/answerController')
const usermid = require('../Middleware/userMiddleware')

//user api
router.post('/register', userController.createUser);
router.post('/login' ,  userController.loginUser);
router.get('/user/:userId/profile' ,usermid.authenticationToken,  userController.getUserProfileById);
router.put('/user/:userId/profile' ,usermid.authenticationToken,  userController.updateUser);

//quesn api
router.post('/question' ,usermid.authenticationToken,  questionController.createQuestion);
router.get('/question', questionController.getQuestions);
router.get('/questions/:questionId', questionController.getQuestionById);
router.put('/questions/:questionId' ,usermid.authenticationToken, questionController.updateQuestion);


//ans api
router.post('/answer' ,usermid.authenticationToken,  answerController.createQuestion);

module.exports = router;