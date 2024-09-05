"use server";

import AnswerModel from "@/database/answer.model";
import { connectToDatabase } from "../mongoose";
import { CreateAnswerParams, GetAnswersParams } from "./shared.types";
import QuestionModel from "@/database/question.model";
import { revalidatePath } from "next/cache";

// createAnswer server action that we can call from our frontend
export async function createAnswer(params: CreateAnswerParams) {
  try {
    connectToDatabase();

    const { content, author, question, path } = params;

    const newAnswer = await AnswerModel.create({ content, author, question });

    // Add the just created answer document to the question document answer's array
    await QuestionModel.findByIdAndUpdate(question, {
      $push: { answers: newAnswer._id },
    });

    // TODO: Add interaction... i.e increase the reputation of the user that created the answer

    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
