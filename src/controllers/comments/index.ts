import {
    createComment as createCommentApi,
    numberCommentsOfFilms as numberCommentsOfFilmsApi,
} from 'src/services/comments';
import {Request, Response} from "express";
import httpStatus from "http-status";
import {InternalError} from "../../system/internalError";
import log4js from "log4js";
import {CommentSaveDto} from "../../dto/comment/commentSaveDto";
import {listComments as listCommentsApi} from "../../services/comments";



export const saveComment = async (req: Request, res: Response): Promise<void> => {
    const logger = log4js.getLogger();

    try {
        const { filmId, nik, text } = new CommentSaveDto(req.body);

        const id = await createCommentApi({ filmId, nik, text });

        res.status(httpStatus.CREATED).send({ id });
    } catch (err) {
        const { message, status } = new InternalError(err);

        logger.error('Error in creating comment.', {
            error: err,
            requestBody: req.body,
            errorMessage: message,
            errorStatus: status,
        });

        res.status(status).send({ message });
    }
};


export const listComments = async (req: Request, res: Response): Promise<void> => {
    const logger = log4js.getLogger();

    try {
        const id = req.query.id as string;
        const from = (req.query.from as string) || '0';
        const size = (req.query.size as string) || '10';

        if (!id) {
            logger.error('Query parameter "id" is required');
            res.status(400).send({ message: 'Query parameter "id" is required' });
            return;
        }

        const result = await listCommentsApi(id, from, size);
        res.send(result);
    } catch (err) {
        const { message, status } = new InternalError(err);
        logger.error('Error in retrieving comments.', err);
        res.status(status).send({ message });
    }
};

export const numberCommentsOfFilms = async (req: Request, res: Response): Promise<void> => {
    const logger = log4js.getLogger();

    try {
        const filmIds = req.body.filmIds;

        if (!Array.isArray(filmIds)) {
            logger.error('Film IDs must be provided as an array');
            res.status(400).send({ message: 'Film IDs must be provided as an array' });
            return;
        }

        const result = await numberCommentsOfFilmsApi(filmIds);
        res.send(result);
    } catch (err) {
        const { message, status } = new InternalError(err);
        logger.error('Error in retrieving comments.', err);
        res.status(status).send({ message });
    }
};