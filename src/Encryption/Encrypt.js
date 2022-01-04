const bcrypt = require("bcrypt")

const hashPassword = async (password, saltRounds = 2) => {
    return await bcrypt.hash(password, saltRounds);
  }

  module.exports={ hashPassword }