import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book', // Reference to the Book model
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true, // The actual content of the chapter
  },
  chapterNumber: {
    type: Number,
    required: true,
  },
},
{
  timestamps: true
});

export const Chapter = mongoose.model('Chapter', chapterSchema);
