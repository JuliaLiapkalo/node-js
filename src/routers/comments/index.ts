import express from "express";
import {listComments, numberCommentsOfFilms, saveComment} from "../../controllers/comments";

const router = express.Router();

router.post('', saveComment);
router.get('', listComments);
router.post('/_counts', numberCommentsOfFilms);

export default router;