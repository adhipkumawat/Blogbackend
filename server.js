// server.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

// const MONGO_URI = process.env.MONGO_URI

const app = express();

// ===== IMPORTS =====
const blogRoutes = require("./Blogcall"); // your blog routes
const User = require("./models/user");    // user model
const user = require("./models/user");

// ===== MIDDLEWARE =====
app.use(cors({
  origin: "*", // allow all (for now)
}));
app.use(cors({
  origin: "*"
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ===== DATABASE =====
mongoose.connect("mongodb://localhost:27017/myAppDB")
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("MongoDB error ❌", err));

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        name: user.firstname + " " + user.lastname
      },
      "SECRETKEY123",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ===== USERS (OPTIONAL ADMIN) =====
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== UPDATE ROLE =====
app.put("/updateRole/:id", async (req, res) => {
  try {
    const roleHeader = req.headers.role;

    if (roleHeader !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { newRole } = req.body;

    await User.findByIdAndUpdate(req.params.id, { role: newRole });

    res.json({ message: "Role updated successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== BLOG ROUTES =====
app.use("/api", blogRoutes);

// ===== HEALTH CHECK =====
app.get("/health", (req, res) => {
  res.json({ message: "Server is healthy" });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});