/* ---------- Storage helpers (localStorage; backend will replace this in Module 2) ---------- */
const store = {
  getUsers: () => JSON.parse(localStorage.getItem("users") || "[]"),
  setUsers: (u) => localStorage.setItem("users", JSON.stringify(u)),
  getBlogs: () => JSON.parse(localStorage.getItem("blogs") || "[]"),
  setBlogs: (b) => localStorage.setItem("blogs", JSON.stringify(b)),
  getCurrent: () => JSON.parse(localStorage.getItem("currentUser") || "null"),
  setCurrent: (u) => localStorage.setItem("currentUser", JSON.stringify(u)),
  logout: () => localStorage.removeItem("currentUser"),
};

/* ---------- Utilities ---------- */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showMsg(text, type) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = "msg " + type;
}

function blogCard(b) {
  const excerpt = b.content.length > 120 ? b.content.slice(0, 120) + "..." : b.content;
  return `
    <article class="card blog">
      <span class="tag">${escapeHTML(b.category)}</span>
      <h3>${escapeHTML(b.title)}</h3>
      <p class="meta">By ${escapeHTML(b.author)} &bull; ${b.date}</p>
      <p>${escapeHTML(excerpt)}</p>
    </article>`;
}

/* ---------- Navbar ---------- */
function renderNavbar() {
  const user = store.getCurrent();
  const links = user
    ? `<a href="index.html">Home</a>
       <a href="dashboard.html">Dashboard</a>
       <a href="create-blog.html">Create Blog</a>
       <button class="btn outline" id="logoutBtn">Logout</button>`
    : `<a href="index.html">Home</a>
       <a href="login.html">Login</a>
       <a href="register.html">Register</a>`;

  document.getElementById("navbar").innerHTML = `
    <nav class="nav">
      <a href="index.html" class="logo">BlogSpace</a>
      <div class="links">${links}</div>
    </nav>`;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      store.logout();
      window.location.href = "login.html";
    });
  }
}

/* ---------- Route protection ---------- */
function requireLogin() {
  if (!store.getCurrent()) window.location.href = "login.html";
}

/* ---------- Pages ---------- */
function initHome() {
  const list = document.getElementById("blogList");
  const blogs = store.getBlogs().slice().reverse();
  list.innerHTML = blogs.length
    ? blogs.map(blogCard).join("")
    : `<p class="empty">No blogs yet. Be the first to write one!</p>`;
}

function initRegister() {
  document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password !== confirm) return showMsg("Passwords do not match.", "error");

    const users = store.getUsers();
    if (users.some((u) => u.email === email)) {
      return showMsg("Email already registered.", "error");
    }

    users.push({ id: Date.now(), name, email, password });
    store.setUsers(users);
    showMsg("Registered successfully! Redirecting to login...", "success");
    setTimeout(() => (window.location.href = "login.html"), 1000);
  });
}

function initLogin() {
  if (store.getCurrent()) window.location.href = "dashboard.html";

  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    const user = store.getUsers().find((u) => u.email === email && u.password === password);
    if (!user) return showMsg("Invalid email or password.", "error");

    store.setCurrent({ id: user.id, name: user.name, email: user.email });
    window.location.href = "dashboard.html";
  });
}

function initDashboard() {
  requireLogin();
  const user = store.getCurrent();
  if (!user) return;

  document.getElementById("welcome").textContent = "Welcome, " + user.name;
  const mine = store.getBlogs().filter((b) => b.authorId === user.id).reverse();
  document.getElementById("blogCount").textContent = mine.length;
  document.getElementById("myBlogs").innerHTML = mine.length
    ? mine.map(blogCard).join("")
    : `<p class="empty">You have not written any blogs yet.</p>`;
}

function initCreate() {
  requireLogin();
  const user = store.getCurrent();
  if (!user) return;

  document.getElementById("blogForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const blogs = store.getBlogs();
    blogs.push({
      id: Date.now(),
      title: document.getElementById("title").value.trim(),
      category: document.getElementById("category").value,
      content: document.getElementById("content").value.trim(),
      author: user.name,
      authorId: user.id,
      date: new Date().toLocaleDateString(),
    });
    store.setBlogs(blogs);
    showMsg("Blog published! Redirecting...", "success");
    setTimeout(() => (window.location.href = "dashboard.html"), 800);
  });
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  const page = document.body.dataset.page;
  const pages = {
    home: initHome,
    register: initRegister,
    login: initLogin,
    dashboard: initDashboard,
    create: initCreate,
  };
  if (pages[page]) pages[page]();
});