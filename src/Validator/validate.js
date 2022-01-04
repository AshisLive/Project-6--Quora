const mongoose = require('mongoose')

const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === 'null') { return false } //if undefined or null occur rather than what we are expecting than this particular feild will be false.
    if (value.trim().length == 0) { return false } //if user give spaces not any string eg:- "  " =>here this value is empty, only space is there so after trim if it becomes empty than false will be given. 
    if (typeof (value) === 'string' && value.trim().length > 0) { return true } //to check only string is comming and after trim value should be their than only it will be true.
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const validatePhone = function (phone) {
    var re = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;
    if (typeof (phone) == 'string') {
        return re.test(phone.trim())
    } else {
        return re.test(phone)
    }
};

const validateEmail = function (email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email.trim())
};

const validString = function (value) {
    if (typeof value !== 'string') return false
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
}


const validforEnum = function (value) {
    let avilable = ["S", "XS", "M", "X", "L", "XXL", "XL"]
    value = value.split(",")
    for (let x of value) {
        if (avilable.includes(x) == false) {
            return false
        }
    }
    return true;
}

const validforStatus = function (value) {
    if (["pending", "completed", "cancled"].indexOf(value) == -1) { return false } //mean's he have not found it
    if (["pending", "completed", "cancled"].indexOf(value) > -1) { return true }   //mean's he have found it
}

const isValidArray = function (arrayToCheck) {
    return Array.isArray(arrayToCheck)         //The Array.isArray(arrayToCheck) method returns true if an arrayToCheck is an array, otherwise false.
}
module.exports = { isValid, isValidRequestBody, isValidObjectId, validatePhone, validateEmail, validString, validforEnum, validforStatus, isValidArray }