import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export type MessageType = 'text' | 'image' | 'video';

export interface IMessage extends Document {
  sender: IUser['_id'];
  receiver?: IUser['_id'];
  content: string;
  type: MessageType;
  mediaUrl?: string;
  isPrivate: boolean;
  readBy: IUser['_id'][];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
