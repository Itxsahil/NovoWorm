import mongoose, { Schema, model } from "mongoose";

const bookmarkSchema = new Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book', // Assuming you have a Book model
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth', // Assuming you have a User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const BookMark = model('BookMark', bookmarkSchema);