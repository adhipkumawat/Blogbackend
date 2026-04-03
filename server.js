// server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const User = require("./models/user");
const app = express();
const blogRoutes = require("./Blogcall");

app.use("/api", blogRoutes);
// ===== Middleware =====
app.use(cors({
  origin: ["http://localhost:5173", "https://blog1-gold-phi.vercel.app", "https://blog2-two-lime.vercel.app"],
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/myAppDB")
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log("MongoDB error ❌", err));




// ===== Register Route =====
app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ firstname, lastname, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Login Route =====
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        name: user.firstname + " " + user.lastname
      },
      "SECRETKEY123", // you can move this to .env as JWT_SECRET
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ===== Get All Users (Admin only) =====
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Update User Role (Admin only) =====
app.put("/updateRole/:id", async (req, res) => {
  try {
    const roleHeader = req.headers.role;
    if (roleHeader !== "admin") return res.status(403).json({ message: "Access denied" });

    const { newRole } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role: newRole });
    res.json({ message: "Role updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Blog Schema =====
const BlogSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model("Blog", BlogSchema);

// ===== Blog Routes =====

// Create a blog post
app.post("/api/posts", async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newBlog = new Blog({ title, content, author });
    await newBlog.save();
    res.json({ message: "Blog post created", blog: newBlog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all blog posts
app.get("/api/posts/home", async (req, res) => {
  try {
    const posts = await Blog.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Health Check =====
app.get("/health", (req, res) => {
  res.json({ message: "Server is healthy" });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));