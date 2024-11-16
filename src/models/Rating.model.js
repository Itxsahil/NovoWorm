import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book', // Assuming you have a Book model
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true,
  },
  ratingValue: {
    type: Number,
    required: true,
    min: 1, // Assuming a rating scale from 1 to 5
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Rating = mongoose.model('Rating', ratingSchema);
