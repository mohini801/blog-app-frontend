/* ---------- Config ---------- */
const API = "http://localhost:5000/api";

/* ---------- Session helpers (only the logged-in user is kept in the browser) ---------- */
const session = {
  getCurrent: () => JSON.parse(localStorage.getItem("currentUser") || "null"),
  setCurrent: (u) => localStorage.setItem("currentUser", JSON.stringify(u)),
  logout: () => localStorage.removeItem("currentUser"),
};

/* ---------- API helper ---------- */
async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    throw new Error("Cannot connect to server. Is the backend running?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

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
      <p class="meta">By ${escapeHTML(b.author)} &bull; ${escapeHTML(b.date)}</p>
      <p>${escapeHTML(excerpt)}</p>
    </article>`;
}

/* ---------- Navbar ---------- */
function renderNavbar() {
  const user = session.getCurrent();
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
      session.logout();
      window.location.href = "login.html";
    });
  }
}

/* ---------- Route protection ---------- */
function requireLogin() {
  if (!session.getCurrent()) window.location.href = "login.html";
}

/* ---------- Pages ---------- */
async function initHome() {
  const list = document.getElementById("blogList");
  try {
    const blogs = await api("/blogs");
    list.innerHTML = blogs.length
      ? blogs.map(blogCard).join("")
      : `<p class="empty">No blogs yet. Be the first to write one!</p>`;
  } catch (err) {
    list.innerHTML = `<p class="empty">${escapeHTML(err.message)}</p>`;
  }
}

function initRegister() {
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password !== confirm) return showMsg("Passwords do not match.", "error");

    try {
      await api("/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      showMsg("Registered successfully! Redirecting to login...", "success");
      setTimeout(() => (window.location.href = "login.html"), 1000);
    } catch (err) {
      showMsg(err.message, "error");
    }
  });
}

function initLogin() {
  if (session.getCurrent()) window.location.href = "dashboard.html";

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      session.setCurrent(data.user);
      window.location.href = "dashboard.html";
    } catch (err) {
      showMsg(err.message, "error");
    }
  });
}

async function initDashboard() {
  requireLogin();
  const user = session.getCurrent();
  if (!user) return;

  document.getElementById("welcome").textContent = "Welcome, " + user.name;
  const box = document.getElementById("myBlogs");
  try {
    const mine = await api("/blogs/user/" + user.id);
    document.getElementById("blogCount").textContent = mine.length;
    box.innerHTML = mine.length
      ? mine.map(blogCard).join("")
      : `<p class="empty">You have not written any blogs yet.</p>`;
  } catch (err) {
    box.innerHTML = `<p class="empty">${escapeHTML(err.message)}</p>`;
  }
}

function initCreate() {
  requireLogin();
  const user = session.getCurrent();
  if (!user) return;

  document.getElementById("blogForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/blogs", {
        method: "POST",
        body: JSON.stringify({
          title: document.getElementById("title").value.trim(),
          category: document.getElementById("category").value,
          content: document.getElementById("content").value.trim(),
          authorId: user.id,
        }),
      });
      showMsg("Blog published! Redirecting...", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 800);
    } catch (err) {
      showMsg(err.message, "error");
    }
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