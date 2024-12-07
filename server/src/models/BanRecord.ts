import mongoose, { Schema, Document } from 'mongoose';

export interface IBanRecord extends Document {
  userId: mongoose.Types.ObjectId;
  reason: string;
  bannedBy: mongoose.Types.ObjectId;
  bannedAt: Date;
  bannedUntil: Date | null;
}

const BanRecordSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  bannedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bannedAt: {
    type: Date,
    required: true,
  },
  bannedUntil: {
    type: Date,
    default: null,
  },
});

export const BanRecord = mongoose.model<IBanRecord>('BanRecord', BanRecordSchema);
export default BanRecord;
