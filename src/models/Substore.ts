import { Schema, model, Document } from 'mongoose';
import mongoose from 'mongoose';

export interface ISubstore extends Document {
  name: string;
  alias: string;
  substoreId: string;
}

const substoreSchema = new Schema<ISubstore>({
  name: { type: String, required: true },
  alias: { type: String, required: true, unique: true },
  substoreId: { type: String, required: true, unique: true }
});

// Explicitly set collection name to 'substores'
export const Substore = mongoose.model<ISubstore>('Substore', substoreSchema, 'substores'); 