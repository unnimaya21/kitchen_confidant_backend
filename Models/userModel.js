const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fcmToken: { type: String }, // For Firebase Push Notifications
  dietaryPreferences: [{ type: String }], // e.g., ['Vegan', 'Nut-Free']
  createdAt: { type: Date, default: Date.now },
});
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  //encrypt the password before saving to DB
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined; // Remove confirmPassword field
});
userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

userSchema.methods.comparePassword = async function (passwordUser, passwordDB) {
  return await bcrypt.compare(passwordUser, passwordDB);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; //true means password changed after token issued
  }
  return false; //false means NOT changed
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Create and export the User model
const User = mongoose.model("User", userSchema);
module.exports = User;
