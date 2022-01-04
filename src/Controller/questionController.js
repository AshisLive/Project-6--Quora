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
        let quesns = await questionModel.find(query).sort({ "createdAt": sort })
        if (Array.isArray(quesns) && quesns.length === 0) {
            return res.status(404).send({ status: false, message: 'No quesns found' })
        }

    //     let answer = await answerModel.find()
    //     for(let q of quesns){
    //         for(let a of answer){
    //             if(q._id == a.questionId){
    //                 quesns.answers = a
    //             }
    //     }
    // }
       


        return res.status(200).send({ status: true, message: 'quesns list', data: quesns })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
module.exports.createQuestion = createQuestion
module.exports.getQuestions = getQuestions