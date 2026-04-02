const mongoose = require("mongoose");
 
const userConn = mongoose.connect(process.env.MONGO_URI)
const blogConn = mongoose.connect(process.env.MONGO_URI)
 
module.exports = { userConn, blogConn };
 