"use server";

import QuestionModel from "@/database/question.model";
import InteractionModel from "@/database/interaction.model";

import { connectToDatabase } from "../mongoose";
import { ViewQuestionParams } from "./shared.types";

export async function viewQuestion(params: ViewQuestionParams) {
  try {
    await connectToDatabase();

    const { questionId, userId } = params;

    // Update view count for the question
    await QuestionModel.findByIdAndUpdate(questionId, { $inc: { views: 1 } });

    // Checking if the user has already viewed the question
    if (userId) {
      const existingInteraction = await InteractionModel.findOne({
        user: userId,
        action: "view",
        question: questionId,
      });

      if (existingInteraction) return console.log("User has already viewed.");

      // Create interaction
      await InteractionModel.create({
        user: userId,
        action: "view",
        question: questionId,
      });
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}
