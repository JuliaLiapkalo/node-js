import Comment, {IComment} from 'src/model/comments';
import {CommentSaveDto} from "../../dto/comment/commentSaveDto";
import {CommentDto} from "../../dto/comment/CommentDto";
import log4js from "log4js";

export const createComment = async (commentDto: CommentSaveDto): Promise<string> => {
    try {
        await validateComment(commentDto);

        const commentWithTimestamp = {
            ...commentDto,
            createdAt: new Date(),
        };

        const comment = await new Comment(commentWithTimestamp).save();
        return comment._id;
    } catch (error) {
        throw new Error(`Failed to create comment: ${error}`);
    }
};

export const listComments = async (filmId: string, size: string, from: string): Promise<CommentDto[]> => {
    const id = Number(filmId);
    const skip = Number(from);
    const limit = Number(size);

    if (isNaN(skip) || isNaN(limit)) {
        throw new Error('Invalid pagination parameters');
    }
    if (isNaN(id)) {
        throw new Error('Invalid Film id');
    }

    const comments = await Comment.find({ filmId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return comments.map(toCommentDto);
};

export const numberCommentsOfFilms = async (filmIds: number[]): Promise<{ [key: number]: number }> => {
    try {
        const countPromises = filmIds.map(async filmId => {
            if (isNaN(filmId)) {
                throw new Error(`Invalid Film ID: ${filmId}`);
            }
            const count = await Comment.countDocuments({ filmId });
            return { filmId, count };
        });

        const results = await Promise.all(countPromises);

        return results.reduce((acc, { filmId, count }) => {
            acc[filmId] = count;
            return acc;
        }, {} as { [key: number]: number });
    } catch (error) {
        throw new Error(`Failed to retrieve comment counts: ${error}`);
    }
};


export const validateComment = async (commentDto: CommentSaveDto): Promise<void> => {
    const { filmId, nik, text } = commentDto;

    if (typeof filmId !== 'number' || isNaN(filmId)) {
        throw new Error('Invalid film ID');
    }

    const isFilmExist = await findFilmById(filmId);
    if (!isFilmExist) {
        throw new Error(`Film with ID ${filmId} does not exist`);
    }

    if (typeof nik !== 'string' || nik.trim().length === 0) {
        throw new Error('Nik cannot be empty');
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Comment description cannot be empty');
    }
};

export const findFilmById = async (filmId: number): Promise<boolean> => {
    const url = `http://localhost:8086/api/v1/films/${filmId}`;
    const logger = log4js.getLogger();

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
            },
        });

        if (!response.ok) {
            logger.error(`Error: Received status ${response.status} for film ID ${filmId}`);
            return false;
        }

        return true;
    } catch (error) {
        logger.error('Error in findFilmById.', error);
        return false;
    }
};

const toCommentDto = (comment: IComment): CommentDto => {
    return ({
        _id: comment._id,
        filmId: comment.filmId,
        nik: comment.nik,
        text: comment.text,
        createdAt: comment.createdAt,
    });
};