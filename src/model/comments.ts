import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
    filmId: number,
	nik: string;
    text: string;
    createdAt: Date;
}

const commentSchema = new Schema({
  filmId: {
      required: true,
      type: Number,
  },
  nik: {
    required: true,
    type: String,
  },
  text: {
      required: true,
      type: String,
  },

}, {
    /**
     * The timestamps option tells mongoose to assign createdAt and updatedAt
     * fields to your schema. The type assigned is Date.
     */
    timestamps: true,
    timezone: 'UTC',
},
    );

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
