import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHendler.js";
import { Book } from "../models/Book.model.js";
import { Chapter } from "../models/Chapter.model.js";
import { Like } from "../models/Likes.model.js";
import { BookMark } from "../models/BookMark.model.js";

import { getBookById as getBookByIdForUser } from "./BookChapters.controller.js";
import { findAllChapters as findAllChaptersForUser } from "./BookChapters.controller.js";
import { findChapterById as findChapterByIdForUser } from "./BookChapters.controller.js";



const getAllBooksForUser = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query; // Default to page 1, limit 20 per page

  const books = await Book.find({status:"Published"})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const totalBooks = await Book.countDocuments(); // Get total number of books

  if (!books) {
    throw new ApiError(404, 'No books found');
  }
  const filteredBooks = books.map((book) => ({
    _id: book._id,
    title: book.title,
    coverImage: book.coverImage
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        books :filteredBooks,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBooks / limit),
      },
      'Books fetched successfully'
    )
  );
});

const LikeBook = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  // Validate bookId
  if (!bookId) {
    throw new ApiError(400, 'All fields are required');
  }

  // Find the book
  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  // Check if the user already liked the book
  let like = await Like.findOne({
    likeTo: bookId,
    likedBy: req.auth._id,
  });

  let actionStatus = false;

  // Toggle the like
  if (like) {
    // If like exists, remove it and decrement the like count
    await Like.findByIdAndDelete(like._id);
    book.likes = Math.max(0, book.likes - 1); // Ensure likes don't go below 0
    actionStatus = false;
  } else {
    // Otherwise, create a new like and increment the like count
    like = await Like.create({
      likeTo: bookId,
      likedBy: req.auth._id,
    });
    book.likes = book.likes + 1;
    actionStatus = true;
  }

  // Save the book's updated like count
  await book.save({ validateBeforeSave: false });

  // Return a success response
  return res.status(200).json(
    new ApiResponse(
      200,
      { likeStatus: actionStatus }, // Return the like status for the user
      'Like toggled successfully'
    )
  );
});


const UpdateViews = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;
  if (!chapterId) {
    throw new ApiError(400, 'All fields are required');
  }

  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    throw new ApiError(404, 'Chapter not found');
  }
  const bookId = chapter.bookId;
  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  book.views = book.views + 1;
  const updatedBook = await book.save({ validateBeforeSave: false });

  if (!updatedBook) {
    throw new ApiError(400, 'Failed to update views');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      'Views updated successfully'
    )
  )
})

const YouMayAlsoLike = asyncHandler(async (req, res) => {
  const randomBooks = await Book.aggregate([
    { $match: { status: 'Published' } }, // Filter books with status 'Published'
    { $sample: { size: 4 } } // Randomly select 4 books
  ])
  const filteredBooks = randomBooks.map((book) => ({
    _id: book._id,
    title: book.title,
    coverImage: book.coverImage
  }));

  res.json(filteredBooks);
});



const NewReleases = asyncHandler(async (req, res) => {
  const newReleases = await Book.find({status:"Published"})
    .sort({ createdAt: -1 }) // Sort by releaseDate in descending order
    .limit(4); // Fetch the 5 newest books
    const filteredBooks = newReleases.map((book) => ({
      _id: book._id,
      title: book.title,
      coverImage: book.coverImage,
      synopsis: book.synopsis
    }));
  res.json(filteredBooks);
});

const addBookMark = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  // Validate bookId
  if (!bookId) {
    throw new ApiError(400, 'All fields are required');
  }

  let action = false;

  const isBookMark = await BookMark.findOne({
    bookId,
    userId: req.auth._id,
  });
  if (!isBookMark) {
    await BookMark.create({
      bookId,
      userId: req.auth._id,
    });
    action = true;
  } else {
    await BookMark.findByIdAndDelete(isBookMark._id);
    action = false;
  }


  
  return res.status(200).json(
    new ApiResponse(
      200,
      action,
      'Book Marked successfully'
    )
  );
});


const getAllBookMarks = asyncHandler(async (req, res) => {
  // Fetch bookmarks for the authenticated user
  const bookMarks = await BookMark.find({ userId: req.auth._id });

  // Extract book IDs from bookmarks
  const bookIds = bookMarks.map((bookmark) => bookmark.bookId);

  // Find books with the extracted book IDs
  const books = await Book.find({ _id: { $in: bookIds } });
  const filteredBooks = books.map((book) => ({
    _id: book._id,
    title: book.title,
    coverImage: book.coverImage
  }));

  // Send the books to the client
  res.json({
    success: true,
    data: filteredBooks,
  });
});

const isBookMarked = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const isBookMark = await BookMark.findOne({
    bookId,
    userId: req.auth._id,
  });
  if(!isBookMark){
    return res.status(200).json(
      new ApiResponse(
        200,
        false,
        'Book Marked successfully'
      )
    )
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      true,
      'Book Marked successfully'
    )
  )
});

const searchBookByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  try {
    // Aggregate to match the category and randomly sample 4 books
    const randomBooks = await Book.aggregate([
      { $match: { categories: category, status: 'Published' } }, // Match category and 'Published' status
      { $sample: { size: 4 } } // Randomly select 4 books
    ]);
    const filteredBooks = randomBooks.map((book) => ({
      _id: book._id,
      title: book.title,
      coverImage: book.coverImage
    }));

    res.json(filteredBooks);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
});



export {
  getAllBooksForUser,
  getBookByIdForUser,
  findAllChaptersForUser,
  findChapterByIdForUser,
  LikeBook,
  UpdateViews,
  YouMayAlsoLike,
  NewReleases,
  addBookMark,
  getAllBookMarks,
  isBookMarked,
  searchBookByCategory  
}