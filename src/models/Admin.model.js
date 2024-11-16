import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  lastLogin: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
},
{timestamps: true});

// Hash the password before saving
adminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to check password
adminSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
}

export const Admin = mongoose.model('Admin', adminSchema);
