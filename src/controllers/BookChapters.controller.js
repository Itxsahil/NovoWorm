import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHendler.js";
import { Book } from "../models/Book.model.js";
import { Chapter } from "../models/Chapter.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.uploade.js";
import { deleteFromeCloudinary } from "../utils/Cloudinary.delete.js";
const createBook = asyncHandler(async (req, res) => {
  console.log(req.body);

  const { title, authorname, synopsis, categories, tags } = req.body;

  if (!title || !authorname || !synopsis || !categories || !tags) {
    throw new ApiError(400, 'All fields are required');
  }

  // Parse tags if it's a stringified array, or split by commas if not
  let tagsArray = [];
  if (typeof tags === 'string') {
    try {
      tagsArray = JSON.parse(tags); // Try parsing as JSON array
    } catch {
      tagsArray = tags.split(',').map(tag => tag.trim()); // Split by commas if JSON parse fails
    }
  }

  let coverImageLocalPath = req.file?.path;
  let coverImage = null;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  const newBook = await Book.create({
    title,
    authorname,
    synopsis,
    categories,
    coverImage: coverImage?.url || null,
    tags: tagsArray,
    authorId: req.admin._id,
  });

  if (!newBook) {
    throw new ApiError(400, 'Failed to create book');
  }

  return res.status(201).json(
    new ApiResponse(
      200,
      newBook,
      'Book created successfully',
    )
  );
});




const addChapter = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { title, content } = req.body;

  // Check if all fields are provided
  if (!title || !content) {
    throw new ApiError(400, 'All fields are required');
  }

  // Count the number of chapters for the book to assign chapter number
  const chapterLen = await Chapter.countDocuments({ bookId });

  // Create the new chapter
  const newChapter = await Chapter.create({
    bookId,
    title,
    content,
    chapterNumber: chapterLen + 1,
  });

  // Check if chapter creation was successful
  if (!newChapter) {
    throw new ApiError(400, 'Failed to create chapter');
  }

  // Update the book's chapter list with the new chapter's ID
  const updatedBook = await Book.findByIdAndUpdate(
    bookId,
    { $push: { chapters: newChapter._id } }, // Add chapter ID to the book's chapters array
    { new: true } // Return the updated book document
  );

  // Check if book update was successful
  if (!updatedBook) {
    throw new ApiError(400, 'Failed to update book with new chapter');
  }

  // Send response
  return res.status(201).json(
    new ApiResponse(200, newChapter, 'Chapter created and added to book successfully')
  );
});






const editChapter = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    throw new ApiError(400, 'All fields are required');
  }

  const updatedChapter = await Chapter.findByIdAndUpdate(
    chapterId,
    { title, content },
    { new: true }
  );

  if (!updatedChapter) {
    throw new ApiError(404, 'Chapter not found or failed to update');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedChapter,
      'Chapter updated successfully'
    )
  );
});





const deleteChapter = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;
  // console.log("delete",chapterId)

  // Find and delete the chapter
  const deletedChapter = await Chapter.findByIdAndDelete(chapterId);

  // Check if the chapter was found and deleted
  if (!deletedChapter) {
    throw new ApiError(404, 'Chapter not found or failed to delete');
  }

  // Remove the chapter ID from the book's chapters array
  const updatedBook = await Book.findByIdAndUpdate(
    deletedChapter.bookId,
    { $pull: { chapters: chapterId } }, // Remove the chapter ID from the chapters array
    { new: true } // Return the updated book document
  );

  // Check if the book was successfully updated
  if (!updatedBook) {
    throw new ApiError(400, 'Failed to update book after deleting chapter');
  }

  // Send the success response
  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      'Chapter deleted and removed from book successfully',
    )
  );
});






const findAllChapters = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const chapters = await Chapter.find({ bookId }).sort({ chapterNumber: 1 }).select('-content');

  if (!chapters) {
    throw new ApiError(404, 'No chapters found for this book');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      chapters,
      'Chapters fetched successfully'
    )
  );
});





const findChapterById = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;

  const chapter = await Chapter.findById(chapterId);

  if (!chapter) {
    throw new ApiError(404, 'Chapter not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      chapter,
      'Chapter fetched successfully'
    )
  );
});




const editBook = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { title, authorname, synopsis, categories, tags } = req.body;

  // Parse tags if it's a stringified array or split by commas
  let tagsArray = [];
  if (typeof tags === 'string') {
    try {
      tagsArray = JSON.parse(tags);
    } catch {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }
  }

  // Check if a new cover image is provided
  let coverImage;
  if (req.file?.path) {
    coverImage = await uploadOnCloudinary(req.file.path);
  }

  // Prepare the update object
  const updateData = {
    title,
    authorname,
    synopsis,
    categories,
    tags: tagsArray,
  };

  // Only include coverImage if a new image is uploaded
  if (coverImage) {
    updateData.coverImage = coverImage.url;
  }

  const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, { new: false });

  if (!updatedBook) {
    throw new ApiError(404, 'Book not found or failed to update');
  }

  if(coverImage){
    await deleteFromeCloudinary(updatedBook.coverImage, "image");
  } 

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedBook,
      'Book updated successfully'
    )
  );
});





const deleteBook = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  // Find the book with the given ID
  const book = await Book.findById(bookId);

  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  await deleteFromeCloudinary(book.coverImage, "image");

  // Delete all chapters associated with the book
  await Chapter.deleteMany({ _id: { $in: book.chapters } });

  // Delete the book after chapters are deleted
  const deletedBook = await Book.findByIdAndDelete(bookId);

  if (!deletedBook) {
    throw new ApiError(404, 'Failed to delete book');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      'Book and associated chapters deleted successfully'
    )
  );
});




const getAllBooks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 7 } = req.query; // Default to page 1, limit 10 per page

  const books = await Book.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const totalBooks = await Book.countDocuments(); // Get total number of books

  if (!books) {
    throw new ApiError(404, 'No books found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        books,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBooks / limit),
      },
      'Books fetched successfully'
    )
  );
});






const getBookById = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const book = await Book.findById(bookId)

  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      book,
      'Book fetched successfully'
    )
  );
});


const TogglePublish = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const updatedBook = await Book.findById(bookId);

  if (!updatedBook) {
    throw new ApiError(404, 'Book not found or failed to update');
  }
  let message = '';
  if (updatedBook.status === 'Published') {
    updatedBook.status = 'Draft';
    message = 'Book draft successfully';
  } else {
    updatedBook.status = 'Published';
    message = 'Book published successfully';
  }

  await updatedBook.save();


  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      message
    )
  )
});



export {
  createBook,
  addChapter,
  editChapter,
  deleteChapter,
  findAllChapters,
  findChapterById,
  deleteBook,
  getAllBooks,
  getBookById,
  editBook,
  TogglePublish,
}