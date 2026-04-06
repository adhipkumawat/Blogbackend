const express = require("express");
const router = express.Router();
const Post = require("./models/post");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
/* ===== MULTER STORAGE ===== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// create blog
router.post("/posts", upload.single("image"), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "SECRETKEY123");

    const { title, subtitle, description, publishNow, category } = req.body;
    const image = req.file ? req.file.filename : null;

    const newPost = new Post({
      title,
      subtitle,
      description,
      image,
      category,
      status: publishNow ? "published" : "draft",
      author: decoded.id
    });

    await newPost.save();
    res.json(newPost);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get blogs
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/posts/user", async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" })
      .populate("author");

    const userPosts = posts.filter(p => p.author?.role === "user");

    res.json(userPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// delete user

router.delete("/users/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "SECRETKEY123");

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// update blog status
router.put("/posts/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const post = await Post.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/posts/home", async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" })
      .populate("author");

    res.json(posts); // show all published blogs
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/posts/:id/comment", async (req, res) => {
  try {
    const { text, user } = req.body;

    const post = await Post.findById(req.params.id);

    post.comments.push({ text, user });

    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete("/posts/:postId/comment/:commentId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "SECRETKEY123");

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const post = await Post.findById(req.params.postId);

    // remove comment
    post.comments = post.comments.filter(
      (c) => c._id.toString() !== req.params.commentId
    );

    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ DELETE BLOG (ADMIN ONLY)
router.delete("/posts/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "SECRETKEY123");

    // ✅ Only admin can delete
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });

  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/all-comments", async (req, res) => {
  try {
    const posts = await Post.find().populate("author");

    let allComments = [];

    posts.forEach(post => {
      post.comments.forEach(comment => {
        allComments.push({
          text: comment.text,
          user: comment.user,
          blogTitle: post.title,
           postId: post._id,       
          commentId: comment._id, 
          blogId: post._id,
          createdAt: comment.createdAt
        });
      });
    });

    res.json(allComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete("/delete-comment", async (req, res) => {
  try {
    const { postId, commentId } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "SECRETKEY123");

    // ✅ ONLY ADMIN
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const post = await Post.findById(postId);

    post.comments = post.comments.filter(
      (c) => c._id.toString() !== commentId
    );

    await post.save();

    res.json({ message: "Comment deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;