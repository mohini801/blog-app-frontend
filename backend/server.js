const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());

/* ---------- Simple JSON file "database" (MongoDB comes in Module 3) ---------- */
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], blogs: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ---------- Test route ---------- */
app.get("/", (req, res) => {
  res.json({ message: "BlogSpace API is running" });
});

/* ---------- User Registration ---------- */
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const db = readDB();
  const cleanEmail = email.trim().toLowerCase();

  if (db.users.some((u) => u.email === cleanEmail)) {
    return res.status(409).json({ message: "Email already registered." });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), name: name.trim(), email: cleanEmail, password: hashed };
  db.users.push(user);
  writeDB(db);

  res.status(201).json({ message: "Registered successfully." });
});

/* ---------- User Login ---------- */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const db = readDB();
  const user = db.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({
    message: "Login successful.",
    user: { id: user.id, name: user.name, email: user.email },
  });
});

/* ---------- Get all blogs ---------- */
app.get("/api/blogs", (req, res) => {
  const db = readDB();
  res.json(db.blogs.slice().reverse());
});

/* ---------- Get blogs of one user ---------- */
app.get("/api/blogs/user/:userId", (req, res) => {
  const db = readDB();
  const mine = db.blogs.filter((b) => String(b.authorId) === req.params.userId);
  res.json(mine.reverse());
});

/* ---------- Create blog ---------- */
app.post("/api/blogs", (req, res) => {
  const { title, category, content, authorId } = req.body;

  if (!title || !category || !content || !authorId) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const db = readDB();
  const author = db.users.find((u) => String(u.id) === String(authorId));
  if (!author) {
    return res.status(401).json({ message: "User not found. Please login again." });
  }

  const blog = {
    id: Date.now(),
    title: title.trim(),
    category,
    content: content.trim(),
    author: author.name,
    authorId: author.id,
    date: new Date().toLocaleDateString(),
  };
  db.blogs.push(blog);
  writeDB(db);

  res.status(201).json({ message: "Blog created.", blog });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});