"use server";

import AnswerModel from "@/database/answer.model";
import { connectToDatabase } from "../mongoose";
import {
  AnswerVoteParams,
  CreateAnswerParams,
  DeleteAnswerParams,
  GetAnswersParams,
} from "./shared.types";
import QuestionModel from "@/database/question.model";
import { revalidatePath } from "next/cache";
import InteractionModel from "@/database/interaction.model";
import UserModel from "@/database/user.model";

// createAnswer server action that we can call from our frontend
export async function createAnswer(params: CreateAnswerParams) {
  try {
    connectToDatabase();

    const { content, author, question, path } = params;

    const newAnswer = await AnswerModel.create({ content, author, question });

    // Add the just created answer document to the question document answer's array
    const questionObject = await QuestionModel.findByIdAndUpdate(question, {
      $push: { answers: newAnswer._id },
    });

    // Add interaction... i.e increase the reputation of the user that created the answer
    await InteractionModel.create({
      user: author,
      action: "answer",
      question,
      answer: newAnswer._id,
      tags: questionObject.tags,
    });

    // increasing the author's reputation by 10 points for adding an answer
    await UserModel.findByIdAndUpdate(author, { $inc: { reputation: 10 } });

    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// getAnswers server action that we can call from our frontend
export async function getAnswers(params: GetAnswersParams) {
  try {
    connectToDatabase();

    const { questionId, sortBy, page = 1, pageSize = 10 } = params;

    const skipAmount = (page - 1) * pageSize;

    let sortOptions = {};

    switch (sortBy) {
      case "highestUpvotes":
        sortOptions = { upvotes: -1 };
        break;
      case "lowestUpvotes":
        sortOptions = { upvotes: 1 };
        break;
      case "recent":
        sortOptions = { createdAt: -1 };
        break;
      case "old":
        sortOptions = { createdAt: 1 };
        break;

      default:
        break;
    }

    const answers = await AnswerModel.find({ question: questionId })
      .populate("author", "_id clerkId name picture")
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalAnswer = await AnswerModel.countDocuments({
      question: questionId,
    });

    const isNextAnswer = totalAnswer > skipAmount + answers.length;

    return { answers, isNextAnswer };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function upVoteAnswer(params: AnswerVoteParams) {
  try {
    connectToDatabase();

    const { answerId, userId, hasUpVoted, hasDownVoted, path } = params;

    let updateQuery = {};

    if (hasUpVoted) {
      updateQuery = { $pull: { upvotes: userId } };
    } else if (hasDownVoted) {
      updateQuery = {
        $pull: { downvotes: userId },
        $push: { upvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { upvotes: userId } };
    }

    const answer = await AnswerModel.findByIdAndUpdate(answerId, updateQuery, {
      new: true,
    });

    if (!answer) {
      throw new Error("Answer not found");
    }

    // Increment author's reputation
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { reputation: hasUpVoted ? -2 : 2 },
    });

    await UserModel.findByIdAndUpdate(answer.author, {
      $inc: { reputation: hasUpVoted ? -10 : 10 },
    });

    // revalidate the peth so the front-end updates with the latest information
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function downVoteAnswer(params: AnswerVoteParams) {
  try {
    connectToDatabase();

    const { answerId, userId, hasUpVoted, hasDownVoted, path } = params;

    let updateQuery = {};

    if (hasDownVoted) {
      // toggling the downvote on and off - we use $pull
      updateQuery = { $pull: { downvotes: userId } };
    } else if (hasUpVoted) {
      updateQuery = {
        $pull: { upvotes: userId },
        $push: { downvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { downvotes: userId } };
    }

    const answer = await AnswerModel.findByIdAndUpdate(answerId, updateQuery, {
      new: true,
    });

    if (!answer) {
      throw new Error("Question not found");
    }

    // Increment author's reputation
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { reputation: hasDownVoted ? -2 : 2 },
    });

    await UserModel.findByIdAndUpdate(answer.author, {
      $inc: { reputation: hasDownVoted ? -10 : 10 },
    });

    // revalidate the peth so the front-end updates with the latest information
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteAnswer(params: DeleteAnswerParams) {
  try {
    connectToDatabase();

    const { answerId, path } = params;

    const answer = await AnswerModel.findById(answerId);

    if (!answer) {
      throw new Error("Answer not found");
    }

    await answer.deleteOne({ _id: answerId });
    await QuestionModel.updateMany(
      { _id: answer.question },
      { $pull: { answers: answerId } }
    );
    await InteractionModel.deleteMany({ answer: answerId });

    revalidatePath(path);
  } catch (error) {
    console.log(error);
  }
}
