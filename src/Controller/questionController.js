const questionModel = require("../Model/questionModel")
const userModel = require("../Model/userModel")
const answerModel = require("../Model/answerModel")
const { isValid, isValidRequestBody, isValidObjectId, isValidArray, validString } = require('../Validator/validate')

const createQuestion = async function (req, res) {
    try {
        const tokenUserId = req.userId
        const requestBody = req.body;
        let { description, tag, askedBy } = requestBody
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide author details' })
            return
        }

        if (!isValidObjectId(askedBy) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        };

        const user = await userModel.findOne({ _id: askedBy })  //check for user existance
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        };

        if (!(askedBy.toString() == tokenUserId.toString())) {  //authorisation
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        };

        if (!isValid(description)) {
            res.status(400).send({ status: false, message: 'description is required' })
            return
        }

        if (!isValid(tag)) {
            res.status(400).send({ status: false, message: 'tag is required' })
            return
        }
        requestBody.tag = tag.split(",")
        const quesn = await questionModel.create(requestBody)
        return res.status(201).send({ status: true, msg: "successfully created", data: quesn })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const getQuestions = async function (req, res) {
    try {
        const queryParams = req.query

        let { tag, sort } = req.query

        let query = {};
        if (isValid(tag)) {
            query['tag'] = tag.trim();
        }

        if (sort) {
            sort = sort.toLowerCase()
            if (sort == "descending") {
                sort = -1
            }
            if (sort == "increasing") {
                sort = 1
            }
        }
        query.isDeleted = false
        let questions = await questionModel.find(query).sort({ "createdAt": sort })

        if (Array.isArray(questions) && questions.length === 0) {
            return res.status(404).send({ status: false, message: 'No questions found' })
        }

        let questionsWithAnswers = []
        for (let i = 0; i < questions.length; i++) {
            questionsWithAnswers.push(questions[i].toObject())
        }

        let answer = await answerModel.find()
        for (let quesn of questionsWithAnswers) {
            for (let ans of answer) {
                if ((quesn._id).toString() == (ans.questionId).toString()) {
                    quesn["answers"] = ans
                }
            }
        }

        return res.status(200).send({ status: true, message: 'quesns list that was asked', data: questionsWithAnswers })
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
        const getAnswers = await answerModel.find({ questionId })
        checkquestionId = checkquestionId.toObject()
        checkquestionId["Answers"] = getAnswers
        return res.status(200).send({ status: true, message: "Question with answers", data: checkquestionId })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const updateQuestion = async function (req, res) {
    try {
        const questionId = req.params.questionId
        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "body is empty" })
        }

        if (!isValidObjectId(questionId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        };

        const user = await questionModel.findOne({ _id: questionId, isDeleted: false })  //check for user existance
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        };

        if (!(user.askedBy.toString() == tokenUserId.toString())) {  //authorisation
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        };

        let { tag, text } = req.body
        const updateDetails = {};
        if (text) {
            if (!isValid(text)) {
                res.status(400).send({ status: false, message: `Invalid text` })
            }
            updateDetails["text"] = text;
        }

        if (isValid(tag)) {
            if()
           
        }

        await blogModel.findByIdAndUpdate({ _id: req.params.blogId }, { $addToSet: { subcategory: { $each: subcategory } } }, { new: true })
        
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports.createQuestion = createQuestion
module.exports.getQuestions = getQuestions
module.exports.getQuestionById = getQuestionById
module.exports.updateQuestion = updateQuestion