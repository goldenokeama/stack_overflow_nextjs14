import { Schema, models, model, Document } from "mongoose";

// creating an interface so we always know which fields we have
export interface IAnswer extends Document {
  author: Schema.Types.ObjectId; // a reference to the author doc
  question: Schema.Types.ObjectId; // a reference to the question doc
  content: string;
  upvotes: Schema.Types.ObjectId[]; // array of user id
  downvotes: Schema.Types.ObjectId[]; // array of user id
  createdAt: Date;
}

// CREATING THE ANSWER MODEL
// NOTE: FIRST, WE CREATE THE SCHEMA
const AnswerSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  upvotes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  downvotes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


// NOTE: 2ND, WE USE THE SCHEMA TO CREATE THE MODEL
// checking if the model already exists if not then create it
const AnswerModel = models.Answer || model("Answer", AnswerSchema);

export default AnswerModel;
