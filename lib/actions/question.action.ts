// NOTE: WE WILL PUT ALL OUR SERVER ACTIONS FOR THE QUESTIONS MODEL
"use server";

import QuestionModel from "@/database/question.model";
import { connectToDatabase } from "../mongoose";
import TagModel from "@/database/tag.model";
import {
  CreateQuestionParams,
  DeleteQuestionParams,
  EditQuestionParams,
  GetQuestionByIdParams,
  GetQuestionsParams,
  QuestionVoteParams,
} from "./shared.types";
import UserModel from "@/database/user.model";
import { revalidatePath } from "next/cache";
import AnswerModel from "@/database/answer.model";
import InteractionModel from "@/database/interaction.model";
import { FilterQuery } from "mongoose";

export async function getQuestions(params: GetQuestionsParams) {
  // the GetQuestionsParams type helps us to know what's coming from the frontend
  // and what can be accessed right here in our server

  try {
    connectToDatabase();

    const { searchQuery, filter, page = 1, pageSize = 10 } = params;

    // Calculcate the number of posts to skip based on the page number and page size
    // for instance, if we are on page 2, and pageSize is 20, then the skipAmount will be 20 posts
    const skipAmount = (page - 1) * pageSize;

    const query: FilterQuery<typeof QuestionModel> = {};

    if (searchQuery) {
      query.$or = [
        { title: { $regex: new RegExp(searchQuery, "i") } },
        { content: { $regex: new RegExp(searchQuery, "i") } },
      ];
    }

    let sortOptions = {};

    switch (filter) {
      // key is filter and values are the different cases
      case "newest":
        sortOptions = { createdAt: -1 };
        break;

      case "frequent":
        sortOptions = { views: -1 };
        break;

      case "unanswered":
        query.answers = { $size: 0 };
        break;
      default:
        break;
    }

    // Getting all the question documents from the database and populating the tags array of id with the actual value
    // and the author field with the actual user data instead if the user id
    const questions = await QuestionModel.find(query)
      .populate({ path: "tags", model: TagModel })
      .populate({ path: "author", model: UserModel })
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions);

    // figuring out if the next page exists
    const totalQuestions = await QuestionModel.countDocuments(query);

    const isNext = totalQuestions > skipAmount + questions.length;
    // skipAmount is the questions(posts) we have already skipped
    // questions.length is the questions(posts) showing on the page

    return { questions, isNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function createQuestion(params: CreateQuestionParams) {
  // we use trycatch block bcus we are dealing with asynchronous code
  // eslint-disable-next-line no-empty
  try {
    // connect to the Database
    connectToDatabase();
    // destructuring the props
    // path is the url of the page we need to reload i.e home page so nextjs knows that something has changed
    const { title, content, tags, author, path } = params;

    // create the question document using the QuestionModel
    const questionDoc = await QuestionModel.create({
      title,
      content,
      author,
    });

    const tagDocuments = [];

    // CREATE THE TAG OR GET THEM IF THEY ALREADY exist
    // REMEMBER each tag is going to be a document in the database as well
    for (const tag of tags) {
      // checking if the tag already exists
      const existingOrNewlyCreatedTag = await TagModel.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${tag}$`, "i") } },
        { $setOnInsert: { name: tag }, $push: { questions: questionDoc._id } },
        { upsert: true, new: true }
      );

      tagDocuments.push(existingOrNewlyCreatedTag._id);
    }

    // NOW WE CAN UPDATE THE QUESTION dDOCUMENT WE CREATED FROM OUR QUESTIONMODEL WITH THE TAG
    await QuestionModel.findByIdAndUpdate(questionDoc._id, {
      $push: { tags: { $each: tagDocuments } },
    });

    // Create an interaction record for the user's ask_question action
    await InteractionModel.create({
      user: author,
      action: "ask_question",
      question: questionDoc._id,
      tags: tagDocuments,
    });

    // Increment author's reputation by +5 for creating a question
    await UserModel.findByIdAndUpdate(author, { $inc: { reputation: 5 } });

    // NOTE: IN NEXTjs13, we have to reload the home page after asking a question so it apppears on the home page
    revalidatePath(path);
  } catch (error) {}
}

export async function getQuestionById(params: GetQuestionByIdParams) {
  try {
    connectToDatabase();

    // get the id of the question we want to fetch from the database from our params
    const { questionId } = params;

    // using the id to get the question document from our questions collection(QuestionModel) and populate the tags
    const question = await QuestionModel.findById(questionId)
      .populate({ path: "tags", model: TagModel, select: "_id name" })
      .populate({
        path: "author",
        model: UserModel,
        select: "_id clerkId name picture",
      });

    return question;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function upVoteQuestion(params: QuestionVoteParams) {
  try {
    connectToDatabase();

    const { questionId, userId, hasUpVoted, hasDownVoted, path } = params;

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

    const question = await QuestionModel.findByIdAndUpdate(
      questionId,
      updateQuery,
      { new: true }
    );

    if (!question) {
      throw new Error("Question not found");
    }

    // Increment author's reputation by +1/-1 for upvoting/revoking an upvote to the question
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { reputation: hasUpVoted ? -1 : 1 },
    });

    // Increment author's reputation by +10/-10 for recieving an upvote/downvote to the question
    await UserModel.findByIdAndUpdate(question.author, {
      $inc: { reputation: hasUpVoted ? -10 : 10 },
    });

    // revalidate the peth so the front-end updates with the latest information
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function downVoteQuestion(params: QuestionVoteParams) {
  try {
    connectToDatabase();

    const { questionId, userId, hasUpVoted, hasDownVoted, path } = params;

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

    const question = await QuestionModel.findByIdAndUpdate(
      questionId,
      updateQuery,
      { new: true }
    );

    if (!question) {
      throw new Error("Question not found");
    }

    // Increment author's reputation
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { reputation: hasDownVoted ? -2 : 2 },
    });

    await UserModel.findByIdAndUpdate(question.author, {
      $inc: { reputation: hasDownVoted ? -10 : 10 },
    });

    // revalidate the peth so the front-end updates with the latest information
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function deleteQuestion(params: DeleteQuestionParams) {
  try {
    connectToDatabase();

    const { questionId, path } = params;

    await QuestionModel.deleteOne({ _id: questionId });
    await AnswerModel.deleteMany({ question: questionId });
    await InteractionModel.deleteMany({ question: questionId });
    await TagModel.updateMany(
      { questions: questionId },
      { $pull: { questions: questionId } }
    );

    revalidatePath(path);
  } catch (error) {
    console.log(error);
  }
}
export async function editQuestion(params: EditQuestionParams) {
  try {
    connectToDatabase();

    const { questionId, title, content, path } = params;

    const question = await QuestionModel.findById(questionId).populate("tags");

    if (!question) {
      throw new Error("Question not found");
    }

    question.title = title;
    question.content = content;

    await question.save();

    revalidatePath(path);
  } catch (error) {
    console.log(error);
  }
}

export async function getHotQuestions() {
  try {
    connectToDatabase();
    // find all questions "{}" the ones with highest views and upvotes on top(descending order)
    const hotQuestions = await QuestionModel.find({})
      .sort({ views: -1, upvotes: -1 })
      .limit(5);

    return hotQuestions;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
