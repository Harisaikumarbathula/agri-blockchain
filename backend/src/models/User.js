const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },
    phoneExtension: {
      type: String,
      trim: true,
      default: "+91",
      maxlength: 8,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["farmer", "buyer", "admin"],
      required: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 280,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    address: {
      place: {
        type: String,
        trim: true,
        default: "",
      },
      village: {
        type: String,
        trim: true,
        default: "",
      },
      district: {
        type: String,
        trim: true,
        default: "",
      },
      state: {
        type: String,
        trim: true,
        default: "",
      },
      country: {
        type: String,
        trim: true,
        default: "",
      },
      pincode: {
        type: String,
        trim: true,
        default: "",
        maxlength: 10,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

