const jwt = require("jsonwebtoken")

const authenticationToken = function (req, res, next) {
    try {
       
        let token = req.header('Authorization', 'Bearer Token')
        token= token.split(' ')
        if (!token[0] && !token[1]) {
            return res.status(401).send({ status: false, msg: "no authentication token" })
        } else {
            
            let decodeToken = jwt.decode(token[1], 'user123')
            if (decodeToken) {
                req.userId = decodeToken.userId
                next()
            } else {
                res.status(401).send({ status: false, msg: "not a valid token" })
            }
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, msg: error })
    }
}
module.exports.authenticationToken=authenticationToken