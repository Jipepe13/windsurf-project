import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reportedUser: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'resolved';
  resolution?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
}

const ReportSchema: Schema = new Schema({
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
  },
  resolution: {
    type: String,
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Report = mongoose.model<IReport>('Report', ReportSchema);
export default Report;
