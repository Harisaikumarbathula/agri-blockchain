const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Name, email, password, and role are required.");
  }

  if (!["farmer", "buyer"].includes(role)) {
    res.status(400);
    throw new Error("Only farmer and buyer accounts can be registered publicly.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409);
    throw new Error("An account with that email already exists.");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
  });

  return res.status(201).json({
    token: generateToken(user._id),
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  return res.json({
    token: generateToken(user._id),
    user: sanitizeUser(user),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

module.exports = {
  register,
  login,
  getProfile,
};

