const bcrypt = require("bcryptjs");
const db = require("../models/db");

function sessionUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    partnerId: user.partnerId || null
  };
}

exports.loginPage = (req, res) => {
  if (req.session.user) return res.redirect(redirectFor(req.session.user));
  res.render("auth/login", { title: "Sign In" });
};

exports.registerPage = (req, res) => {
  if (req.session.user) return res.redirect(redirectFor(req.session.user));
  res.render("auth/register", { title: "Create Account" });
};

function redirectFor(user) {
  if (user.role === "admin") return "/admin";
  if (user.role === "partner") return "/partner/dashboard";
  return "/";
}

exports.register = (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !phone || !password) {
    req.session.flash = { type: "error", message: "All fields are required." };
    return res.redirect("/auth/register");
  }
  if (!/^[A-Za-z ]+$/.test(fullName)) {
    req.session.flash = { type: "error", message: "Name should contain letters only." };
    return res.redirect("/auth/register");
  }
  if (!/^[0-9+]{9,15}$/.test(phone)) {
    req.session.flash = { type: "error", message: "Please enter a valid phone number." };
    return res.redirect("/auth/register");
  }
  if (password.length < 6) {
    req.session.flash = { type: "error", message: "Password must be at least 6 characters." };
    return res.redirect("/auth/register");
  }

  const exists = db.findOne("users", (u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    req.session.flash = { type: "error", message: "An account with this email already exists." };
    return res.redirect("/auth/register");
  }

  const user = db.insert("users", {
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password: bcrypt.hashSync(password, 10),
    role: "user"
  });

  req.session.user = sessionUser(user);
  req.session.flash = { type: "success", message: `Welcome to RocketDrop, ${user.fullName}!` };
  res.redirect("/");
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const user = db.findOne("users", (u) => u.email.toLowerCase() === (email || "").toLowerCase());

  if (!user || !bcrypt.compareSync(password || "", user.password)) {
    req.session.flash = { type: "error", message: "Invalid email or password." };
    return res.redirect("/auth/login");
  }

  req.session.user = sessionUser(user);
  req.session.flash = { type: "success", message: `Welcome back, ${user.fullName}!` };
  res.redirect(redirectFor(user));
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect("/"));
};
