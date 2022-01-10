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

        if (!isValid(askedBy)) {
            res.status(400).send({ status: false, message: 'askedBy is required' })
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

        if(user.creditScore < 100){
            res.status(400).send({ status: false, message: `cannot post any question due to insufficient creditScore ${user.creditScore}` })
            return
        }

        if (!isValid(description)) {
            res.status(400).send({ status: false, message: 'description is required' })
            return
        }

        if(tag){
            if (!isValid(tag)) {
                res.status(400).send({ status: false, message: 'tag is required' })
                return
            }  
            requestBody.tag = tag.split(",")  
        }

        await userModel.findOneAndUpdate({ _id: askedBy },{creditScore:user.creditScore - 100},{new:true})

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
            questionsWithAnswers.push(questions[i].toObject())  //this for loop for converting elements to object
        }

        for (let j = 0; j < questionsWithAnswers.length; j++) {
            questionsWithAnswers[j]["answers"] = []               //this for loop for giving each object one more feild that is answer it will be empty if no answer is avilable for it.
        }
        let count = 0  //use for indexing of answer array feild.
        let answer = await answerModel.find({ isDeleted: false }).sort({ "createdAt": -1 })
        for (let quesn of questionsWithAnswers) {
            for (let ans of answer) {                                 //two for loop are used to iterate to both the array same time and find similar questionId.
                if ((quesn._id).toString() == (ans.questionId).toString()) {
                    quesn.answers[count] = ans                                //if found same question Id in both array than paste that answers in the question document question's answer feild.
                }
                count++;   //to increase indexing so that every answer is pasted in answer array feild.
            }
        }

        return res.status(200).send({ status: true, message: 'Questions that was asked', data: questionsWithAnswers })
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


const updateQuestion = async function (req, res) {
    try {
        const questionId = req.params.questionId;
        const tokenUserId = req.userId;
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
        //  const updateDetails = {};
        if (text) {
            if (!isValid(text)) {
                res.status(400).send({ status: false, message: `Invalid text` })
            }
        }

        if (tag) {
            if (!(isValid(tag))) {
                res.status(400).send({ status: false, message: `Invalid tag` })
            }
            tag = tag.split(",")
        }
        const updatedQuestion = await questionModel.findByIdAndUpdate({ _id: questionId }, { $addToSet: { tag: { $each: tag } }, description: text }, { new: true })
        return res.status(200).send({ status: true, message: "Question updated", data: updatedQuestion })

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

const deleteQuestion = async function (req, res) {
    try {
        const questionId = req.params.questionId;
        const tokenUserId = req.userId;

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

        const deletetedQuestion = await questionModel.findOneAndUpdate({ _id: questionId, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true })
        if (deletetedQuestion) {
            res.status(200).send({ status: true, msg: "This question has been succesfully deleted" })
            return
        }
        res.status(404).send({ status: false, message: `question alredy deleted not found` })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports.createQuestion = createQuestion
module.exports.getQuestions = getQuestions
module.exports.getQuestionById = getQuestionById
module.exports.updateQuestion = updateQuestion
module.exports.deleteQuestion = deleteQuestion