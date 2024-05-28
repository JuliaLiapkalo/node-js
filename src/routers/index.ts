import express from 'express';
import comments from "./comments";

const router = express.Router();

router.use('/comments', comments)

export default router;
