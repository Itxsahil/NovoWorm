import mongoose, { Schema } from "mongoose";


const likeSchema = new Schema({
  likeTo: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Auth',
  }
},{
  timestamps: true
})

export const Like = mongoose.model('Like', likeSchema);

