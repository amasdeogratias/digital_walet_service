import mongoose, { Schema } from 'mongoose';
import { env } from '../config/env';

const TestSchema = new Schema({
    name: String,
    value: Number,
});
const Test = mongoose.model('Test', TestSchema);

export const connectMongo = async (): Promise<void> => {
  await mongoose.connect(env.mongodbUrl);
  const testDoc = new Test({ name: 'Sample Data', value: 42 });
  await testDoc.save();
};

export const closeMongo = async (): Promise<void> => {
  await mongoose.disconnect();
};
