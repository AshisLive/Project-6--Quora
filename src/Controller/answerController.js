const questionModel = require("../Model/questionModel")
const userModel = require("../Model/userModel")
const answerModel = require("../Model/answerModel")
const { isValid, isValidRequestBody, isValidObjectId, isValidArray, validString } = require('../Validator/validate')

const createAnswer = async function (req, res) {
    try {
        const tokenUserId = req.userId
        const requestBody = req.body;
        let { text, questionId, answeredBy } = requestBody
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide answer details' })
            return
        }

        if (!isValid(questionId)) {
            res.status(400).send({ status: false, message: 'questionId is required' })
            return
        }
        if (!isValid(answeredBy)) {
            res.status(400).send({ status: false, message: 'answeredBy is required' })
            return
        }

        if (!isValidObjectId(answeredBy) && !isValidObjectId(tokenUserId) && !isValidObjectId(questionId)) {
            return res.status(404).send({ status: false, message: "Id is not valid" })
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

        if (quesn.askedBy.toString() == answeredBy.toString()) {
            res.status(400).send({ status: false, message: `You can't answer your own Question` })
            return
        }

        await userModel.findOneAndUpdate({ _id: answeredBy }, { creditScore: user.creditScore + 200 }, { new: true })

        const answer = await answerModel.create(requestBody)
        return res.status(201).send({ status: true, msg: "successfully created", data: answer })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const getQuestionById = async function (req, res) {
    try {
        const questionId = req.params.questionId
        if (!isValidObjectId(questionId)) {
            return res.status(400).send({ status: false, message: "Invalid Id" })
        }
        let checkquestionId = await questionModel.findOne({ _id: questionId, isDeleted: false })
        if (!checkquestionId) {
            return res.status(404).send({ status: false, message: "Id not found" })
        }
        const getAnswers = await answerModel.find({ questionId, isDeleted: false }).sort({ "createdAt": -1 })
        checkquestionId = checkquestionId.toObject()
        checkquestionId["Answers"] = getAnswers
        return res.status(200).send({ status: true, message: "Question with answers", data: checkquestionId })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const updateAnswer = async function (req, res) {
    try {
        const tokenUserId = req.userId
        const answerId = req.params.answerId
        if (!isValidRequestBody(req.body)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide answer details' })
            return
        }

        if (!isValidObjectId(tokenUserId) && !isValidObjectId(answerId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        };

        const user = await answerModel.findOne({ _id: answerId, isDeleted: false })  //check for user existance
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        };

        if (!(user.answeredBy.toString() == tokenUserId.toString())) {  //authorisation
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        };

        if (req.body.text) {
            if (!isValid(req.body.text)) {
                res.status(400).send({ status: false, message: 'text is required' })
                return
            }
        }
        const updatedAnswer = await answerModel.findByIdAndUpdate({ _id: answerId }, { text: req.body.text }, { new: true })
        return res.status(200).send({ status: true, msg: "sucessfully updated", data: updatedAnswer })
    } catch (err) {

    }
}

const deleteAnswer = async function (req, res) {
    try {
        const answerId = req.params.answerId;
        const tokenUserId = req.userId;
        if (!isValidRequestBody(req.body)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide answer details' })
            return
        }
        const { questionId, userId } = req.body
        if (!isValidObjectId(questionId) && !isValidObjectId(tokenUserId && !isValidObjectId(userId)) && !isValidObjectId(answerId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        };

        if (!("questionId" in req.body)) {
            return res.status(400).send({ status: false, msg: "questionId is not there" })
        }
        if (!("userId" in req.body)) {
            return res.status(400).send({ status: false, msg: "userId is not there" })
        }

        const user = await userModel.findOne({ _id: userId })  //check for user existance
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        };

        if (!(userId.toString() == tokenUserId.toString())) {  //authorisation
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        };

        const deletetedAnswer = await answerModel.findOneAndUpdate({ _id: answerId, isDeleted: false }, { isDeleted: true }, { new: true })
        if (deletetedAnswer) {
            res.status(200).send({ status: true, msg: "This Answer has been succesfully deleted" })
            return
        }
        return res.status(404).send({ status: false, message: `Answer alredy deleted not found` })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports.createAnswer = createAnswer
module.exports.getQuestionById = getQuestionById
module.exports.updateAnswer = updateAnswer
module.exports.deleteAnswer = deleteAnswer