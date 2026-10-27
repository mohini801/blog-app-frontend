require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/User");
const Blog = require("./models/Blog");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* ---------- MongoDB connection ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

/* ---------- Test route ---------- */
app.get("/", (req, res) => {
  res.json({ message: "BlogSpace API is running" });
});

/* ---------- User Registration ---------- */
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });

    res.status(201).json({ message: "Registered successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

/* ---------- User Login ---------- */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      message: "Login successful.",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

/* ---------- Get all blogs ---------- */
app.get("/api/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

/* ---------- Get blogs of one user ---------- */
app.get("/api/blogs/user/:userId", async (req, res) => {
  try {
    const blogs = await Blog.find({ authorId: req.params.userId }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(400).json({ message: "Invalid user id." });
  }
});

/* ---------- Get one blog (detail page) ---------- */
app.get("/api/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found." });
    res.json(blog);
  } catch (err) {
    res.status(400).json({ message: "Invalid blog id." });
  }
});

/* ---------- Create blog ---------- */
app.post("/api/blogs", async (req, res) => {
  try {
    const { title, category, content, authorId } = req.body;

    if (!title || !category || !content || !authorId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const author = await User.findById(authorId);
    if (!author) {
      return res.status(401).json({ message: "User not found. Please login again." });
    }

    const blog = await Blog.create({
      title,
      category,
      content,
      author: author.name,
      authorId: author._id,
    });

    res.status(201).json({ message: "Blog created.", blog });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Could not create blog." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});