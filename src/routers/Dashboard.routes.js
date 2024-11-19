import {
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
  isBookMarked
} from '../controllers/Dashboard.controller.js';
import { verifyAuth } from '../middlewares/Auth.middleware.js';

import { Router } from 'express';

const router = Router();


router.route('/books').get(getAllBooksForUser);
router.route('/book/:bookId').get(getBookByIdForUser);
router.route('/chapters').get(findAllChaptersForUser);
router.route('/chapter/:chapterId').get(findChapterByIdForUser);
router.route('/like/:bookId').post(verifyAuth,LikeBook);
router.route('/views/:chapterId').put(UpdateViews);
router.route('/youmayalsolike').get(YouMayAlsoLike);
router.route('/newreleases').get(NewReleases);
router.route('/bookmark/:bookId').post(verifyAuth,addBookMark);
router.route('/bookmarks').get(verifyAuth,getAllBookMarks);
router.route('/isbookmarked/:bookId').get(verifyAuth,isBookMarked);


export default router;