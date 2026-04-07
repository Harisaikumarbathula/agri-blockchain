const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeAddress(address = {}) {
  return {
    place: normalizeString(address.place || address.village || address.district),
    state: normalizeString(address.state),
    country: normalizeString(address.country),
    pincode: normalizeString(address.pincode),
  };
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    phoneExtension: user.phoneExtension || "+91",
    role: user.role,
    bio: user.bio || "",
    profilePhoto: user.profilePhoto || "",
    address: sanitizeAddress(user.address),
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

const updateProfile = asyncHandler(async (req, res) => {
  const name = normalizeString(req.body.name);
  const email = normalizeString(req.body.email).toLowerCase();
  const phoneExtension = normalizeString(req.body.phoneExtension);
  const phone = normalizeString(req.body.phone);
  const bio = normalizeString(req.body.bio);
  const profilePhoto = typeof req.body.profilePhoto === "string" ? req.body.profilePhoto.trim() : "";
  const address = sanitizeAddress(req.body.address);
  const requestedRole = normalizeString(req.body.role).toLowerCase();

  if (!name || !email || !phoneExtension || !phone || !address.place || !address.state || !address.country || !address.pincode) {
    res.status(400);
    throw new Error("Name, email, phone extension, phone number, place, state, country, and pincode are required.");
  }

  if (!["buyer", "farmer", "admin"].includes(req.user.role)) {
    res.status(403);
    throw new Error("Invalid account role.");
  }

  if (!requestedRole) {
    res.status(400);
    throw new Error("Role is required.");
  }

  if (req.user.role === "admin" && requestedRole !== "admin") {
    res.status(400);
    throw new Error("Admin role cannot be changed from the profile page.");
  }

  if (req.user.role !== "admin" && !["buyer", "farmer"].includes(requestedRole)) {
    res.status(400);
    throw new Error("Role must be buyer or farmer.");
  }

  if (bio.length > 280) {
    res.status(400);
    throw new Error("Bio must be 280 characters or fewer.");
  }

  if (!/^\+?[0-9]{1,4}$/.test(phoneExtension)) {
    res.status(400);
    throw new Error("Phone extension must be 1 to 4 digits and may start with +.");
  }

  if (!/^[0-9]{4,10}$/.test(address.pincode)) {
    res.status(400);
    throw new Error("Pincode must be 4 to 10 digits.");
  }

  if (profilePhoto && !profilePhoto.startsWith("data:image/")) {
    res.status(400);
    throw new Error("Profile photo must be uploaded as an image.");
  }

  if (profilePhoto.length > 10_000_000) {
    res.status(400);
    throw new Error("Profile photo is too large. Please upload a smaller image.");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser && String(existingUser._id) !== String(req.user._id)) {
    res.status(409);
    throw new Error("Another account already uses that email address.");
  }

  req.user.name = name;
  req.user.email = email;
  req.user.phoneExtension = phoneExtension;
  req.user.phone = phone;
  req.user.bio = bio;
  req.user.profilePhoto = profilePhoto;
  req.user.address = address;
  req.user.role = req.user.role === "admin" ? "admin" : requestedRole;

  const updatedUser = await req.user.save();

  return res.json({
    message: "Profile updated successfully.",
    user: sanitizeUser(updatedUser),
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};

