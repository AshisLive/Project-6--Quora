const questionModel = require("../Model/questionModel")
const userModel = require("../Model/userModel")
const answerModel = require("../Model/answerModel")
const { isValid, isValidRequestBody, isValidObjectId, isValidArray, validString } = require('../Validator/validate')

const createQuestion = async function (req, res) {
    try {
        const tokenUserId = req.userId
        const requestBody = req.body;
        let { text, questionId, answeredBy } = requestBody
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide author details' })
            return
        }

        if (!isValidObjectId(answeredBy) && !isValidObjectId(tokenUserId) && !isValidObjectId(questionId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        };

        const user = await userModel.findOne({ _id: answeredBy })  //check for user existance
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        };

        if (!(answeredBy.toString() == tokenUserId.toString())) {  //authorisation
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        };

        if (!isValid(text)) {
            res.status(400).send({ status: false, message: 'text is required' })
            return
        }

        const quesn = await questionModel.findOne({ _id: questionId })
        if (!quesn) {
            return res.status(404).send({ status: false, msg: "Id is not there in DB" })
        }

        const answer = await answerModel.create(requestBody)
        return res.status(201).send({ status: true, msg: "successfully created", data: answer })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports.createQuestion = createQuestion