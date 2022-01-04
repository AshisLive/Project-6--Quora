const express = require("express")
const bodyParser = require("body-parser")
const multer = require("multer")
const route = require("./routes/route.js")
const mongoose = require("mongoose")

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const midglobal = function (req, res, next) {
    console.log(`${new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDay() + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds()} ${req.ip} ${req.originalUrl}`);
    next();
}
app.use(midglobal)

mongoose.connect("mongodb+srv://user-open-to-all:hiPassword123@cluster0.xgk0k.mongodb.net/ASHUTOSH_KUMAR-DB?retryWrites=true&w=majority", { useNewUrlParser: true })
    .then(() => console.log("mongodb running on 27017"))
    .catch(err => console.log(err))

app.use(multer().any())
app.use('/', route)

app.listen(process.env.Port || 3000, function() {
    console.log('express port running on port ' + (process.env.Port || 3000))
})