require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();

// middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options(/.*/, cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ===== MONGODB CONNECTION ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// user schema
const UserSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  role: { type: String, default: "user" }
});

const User = mongoose.model("User", UserSchema);

/* ===== REGISTER ===== */
app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ firstname, lastname, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== LOGIN ===== */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role:
        user.role,
        email: user.email ,
        name: user.firstname + " " + user.lastname},
      "SECRETKEY123",
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===== GET USERS ===== */
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== UPDATE ROLE (ADMIN ONLY) ===== */
app.put("/updateRole/:id", async (req, res) => {
  try {
    const roleHeader = req.headers.role;
    if (roleHeader !== "admin") return res.status(403).json({ message: "Access denied" });

    const { newRole } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role: newRole });
    res.json({ message: "Role updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ============== HEALTH CHECK ==============
app.use('/health', (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});
 
/* ===== BLOG ROUTES ===== */
const blogRoutes = require("./Blogcall");
app.use("/api", blogRoutes);

/* ===== START SERVER ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));