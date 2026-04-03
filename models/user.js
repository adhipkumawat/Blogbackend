const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  avatar: String,
  role: {
    type: String,
    default: "user"
  }
});

// ✅ FIX HERE
module.exports = mongoose.models.User || mongoose.model("User", UserSchema);