import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  authorname: {
    type: String,
    required: true,
    trim: true,
  },
  synopsis: {
    type: String,
    trim: true,
  },
  categories: {
    type: String,
    enum: ['Category 1', 'Category 2', 'Category 3', 'Novel'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Draft',
  },
  likes: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  coverImage: {
    type: String,
  },
  tags: {
    type: [],
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter', // Reference to the Chapter model
  }],
},
{
  timestamps: true,
});

export const Book = mongoose.model('Book', bookSchema);
