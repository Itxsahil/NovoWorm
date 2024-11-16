import { Router } from 'express';
import {
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
} from '../controllers/BookChapters.controller.js';
import { verifyAdmin } from '../middlewares/Admin.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// Create a new book
router.route('/create')
  .post(verifyAdmin, upload.single('coverImage'), createBook);

// Add a new chapter to a book
router.route('/addchapter/:bookId')
  .post(verifyAdmin, addChapter);

// Edit a chapter
router.route('/editchapter/:chapterId')
  .put(verifyAdmin, editChapter);

// Delete a chapter
router.route('/deletechapter/:chapterId')
  .delete(verifyAdmin, deleteChapter);

// Get all chapters of a book
router.route('/chapters/:bookId')
  .get(findAllChapters);

// Get a specific chapter by ID
router.route('/chapter/:chapterId')
  .get(findChapterById);

// Delete a book
router.route('/delete/:bookId')
  .delete(verifyAdmin, deleteBook);

// Get all books
router.route('/all')
  .get(getAllBooks);

// Get a specific book by ID
router.route('/:bookId')
  .get(getBookById)
  .put(verifyAdmin, upload.single('coverImage'), editBook); // Edit a book

router.route('/togglepublish/:bookId')
  .put(verifyAdmin, TogglePublish);
export default router;