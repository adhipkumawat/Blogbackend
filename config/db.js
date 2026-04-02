const mongoose = require("mongoose");
 
const userConn = mongoose.connect(process.env.MONGO_URL)
const blogConn = mongoose.connect(process.env.MONGO_URL)
 
module.exports = { userConn, blogConn };
 