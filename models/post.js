const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  description: String,
  image: String,
  status: String,
  category: String, 
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
   // ✅ ADD THIS
  comments: [
    {
      text: String,
      user: String, // email or name
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Post", PostSchema);