const encrypt = require("../Encryption/Encrypt")
const userModel = require("../Model/userModel")
const { isValid, isValidRequestBody, isValidObjectId, validatePhone, validateEmail, validString } = require('../Validator/validate')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const createUser = async function (req, res) {
    try {
        const requestBody = req.body;
        let { fname, lname, phone, email, password } = requestBody
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide author details' })
            return
        }

        if (!isValid(fname)) {
            res.status(400).send({ status: false, message: 'fname is required' })
            return
        }

        if (!isValid(lname)) {
            res.status(400).send({ status: false, message: 'lname is required' })
            return
        }

        if (!isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }
        if (!validateEmail(email)) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        const isEmailAlreadyUsed = await userModel.findOne({ email }); // {email: email} object shorthand property 
        if (isEmailAlreadyUsed) {
            res.status(400).send({ status: false, message: `${email} email address is already registered` })
            return
        }
        if (!isValid(password)) {
            res.status(400).send({ status: false, message: `${password} invalid passwoed` })
            return
        }
        if (!(password.trim().length > 7 && password.trim().length < 16)) {
            res.status(400).send({ status: false, message: `${password} invalid password it should be between 8 to 15` })
            return
        }

        const hashPassword = await encrypt.hashPassword(password)
        password = hashPassword;

        const userdetails= {fname, lname, email, password}
        if (phone) {
           if (!isValid(phone)) {
                res.status(400).send({ status: false, message: `phone no. is required` })
                return
            }

            if (!validatePhone(phone)) {
                res.status(400).send({ status: false, message: `phone should be a valid number` });
                return;
            }
            const isPhoneNumberAlreadyUsed = await userModel.findOne({ phone: phone });
            if (isPhoneNumberAlreadyUsed) {
                res.status(400).send({ status: false, message: `${phone} mobile number is already registered`, });
                return;
            }
            userdetails.phone = phone
        }
        const userData = await userModel.create(userdetails)
        return res.status(201).send({ status: true, msg: "successfully created", data: userData })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const loginUser = async function (req, res) {
    try {
        const requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
            return
        }
        const { email, password } = requestBody;
        if (!isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }
        if (!validateEmail(email)) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        if (!isValid(password)) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(401).send({ status: false, message: `Invalid login credentials` });
            return
        }
        const passOfUser = user.password
        const isValidPass = bcrypt.compareSync(password, passOfUser);
        if (!isValidPass) {
            res.status(401).send({ status: false, message: `Invalid login credentials of password` });
            return
        }

        let userId = user._id
        let payload = {
            userId: user._id,
            iat: Math.floor(Date.now() / 1000), //[seconds]	The iat (issued at) identifies the time at which the JWT was issued. [Date.now() / 1000 => means it will give time that is in seconds(for January 1, 1970)] (abhi ka time de gha jab bhi yhe hit hugha)
            exp: Math.floor(Date.now() / 1000) + 100 * 60 * 60 //The exp (expiration time) identifies the expiration time on or after which the token MUST NOT be accepted for processing.   (abhi ke time se 10 ganta tak jalee gha ) Date.now() / 1000=> seconds + 60x60min i.e 1hr and x10 gives 10hrs.
        };

        let token = jwt.sign(payload, "user123");

        res.header('Authorization', token);
        res.status(200).send({ status: true, message: `User logged in successfully`, data: { userId, token } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

const getUserProfileById = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.userId

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }

        res.status(200).send({ status: true, message: "User profile Details", data: user })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


const updateUser = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.userId

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }

        let { fname, lname, email, phone } = req.body

        const filterQuery = {};
        if (isValid(fname)) {
            filterQuery['fname'] = fname.trim()
        }
        if (isValid(lname)) {
            filterQuery['lname'] = lname.trim()
        }
        if (isValid(email)) {
            const checkEmail = await userModel.find({ email: email })
            if (!(checkEmail.length == 0)) {
                return res.status(400).send({ status: false, message: `${email} is not unique` })
            }
            filterQuery['email'] = email.trim()
        }
        if (isValid(phone)) {
            if (!validatePhone(phone)) {
                res.status(400).send({ status: false, message: `phone should be a valid number` });
                return;
            }
            const checkphone = await userModel.find({ phone: phone })
            if (!(checkphone.length == 0)) {
                return res.status(400).send({ status: false, message: `${phone} is not unique` })
            }
            filterQuery['phone'] = phone.trim()
        }

        const userdetails = await userModel.findOneAndUpdate({ userId }, filterQuery, { new: true })
        return res.status(200).send({ status: true, message: "updated user Profile", data: userdetails })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports.createUser = createUser
module.exports.loginUser = loginUser
module.exports.getUserProfileById = getUserProfileById
module.exports.updateUser = updateUser