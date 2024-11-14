"use server";

import { FilterQuery } from "mongoose";
import UserModel from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import {
  CreateUserParams,
  DeleteUserParams,
  GetAllUsersParams,
  GetSavedQuestionsParams,
  GetUserByIdParams,
  GetUserStatsParams,
  ToggleSaveQuestionParams,
  UpdateUserParams,
} from "./shared.types";
import { revalidatePath } from "next/cache";
import QuestionModel from "@/database/question.model";
import TagModel from "@/database/tag.model";
import AnswerModel from "@/database/answer.model";

export async function getUserById(params: GetUserByIdParams) {
  try {
    connectToDatabase();
    console.log("from getUserById", params);

    const { userId } = params;

    const user = await UserModel.findOne({ clerkId: userId });

    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function createUser(userData: CreateUserParams) {
  try {
    connectToDatabase();

    const newUser = await UserModel.create(userData);

    return newUser;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function updateUser(params: UpdateUserParams) {
  try {
    connectToDatabase();

    const { clerkId, updateData, path } = params;

    // {new: true} returns the updated instance of the user
    await UserModel.findOneAndUpdate({ clerkId }, updateData, { new: true });

    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function deleteUser(params: DeleteUserParams) {
  try {
    connectToDatabase();

    const { clerkId } = params;

    // find the user so we can have the reference 'user'
    const user = await UserModel.findOneAndDelete({ clerkId });

    // If no user with that id was found
    if (!user) {
      throw new Error("User not found");
    }
    // if a user with the id exists,
    // Delete the user from the database
    // Delete everything the user has ever done
    // ---> questions, answers, comments, etc
    // DELETING QUESTIONS
    // get user question ids

    // const userQuestionIds = await QuestionModel.find({
    //   author: user._id,
    // }).distinct("_id");

    // delete user questions
    await QuestionModel.deleteMany({ author: user._id });

    // TODO: delete user answers, comments, etc

    // delete user
    const deletedUser = await UserModel.findByIdAndDelete(user._id);

    return deletedUser;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function getAllUsers(params: GetAllUsersParams) {
  try {
    connectToDatabase();

    const { searchQuery, filter, page = 1, pageSize = 10 } = params;

    const skipAmount = (page - 1) * pageSize;

    const query: FilterQuery<typeof UserModel> = {};

    // searching both the username and name
    if (searchQuery) {
      query.$or = [
        { name: { $regex: new RegExp(searchQuery, "i") } },
        { username: { $regex: new RegExp(searchQuery, "i") } },
      ];
    }

    let sortOptions = {};

    switch (filter) {
      case "new_users":
        sortOptions = { joinedAt: -1 };
        break;

      case "old_users":
        sortOptions = { joinedAt: 1 };
        break;

      case "top_contributors":
        sortOptions = { reputation: -1 };
        break;

      default:
        break;
    }

    // destructuring the params and setting default values
    // const { page = 1, pageSize = 20, filter, searchQuery } = params;

    // passing an empty object into the UserModel(usercollection on mongoDB) means we want to get all users(user documents in the user collection) then .sort({createdAt:-1}) shows the new user document at the top
    const users = await UserModel.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalUsers = await UserModel.countDocuments(query);

    const isNext = totalUsers > skipAmount * users.length;

    // returning the users within an object
    return { users, isNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function toggleSaveQuestion(params: ToggleSaveQuestionParams) {
  try {
    connectToDatabase();

    const { userId, questionId, path } = params;

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const isQuestionSaved = user.saved.includes(questionId);

    if (isQuestionSaved) {
      // remove question from saved
      await UserModel.findByIdAndUpdate(
        userId,
        { $pull: { saved: questionId } },
        { new: true }
      );
    } else {
      // add question to saved
      await UserModel.findByIdAndUpdate(
        userId,
        { $addToSet: { saved: questionId } },
        { new: true }
      );
    }

    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getSavedQuestions(params: GetSavedQuestionsParams) {
  try {
    connectToDatabase();

    const { clerkId, searchQuery, filter, page = 1, pageSize = 20 } = params;

    const skipAmount = (page - 1) * pageSize;

    const query: FilterQuery<typeof QuestionModel> = searchQuery
      ? { title: { $regex: new RegExp(searchQuery, "i") } }
      : {};

    let sortOptions = {};

    switch (filter) {
      case "most_recent":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 }; // ascending order
        break;
      case "most_voted":
        sortOptions = { upvotes: -1 }; // descending order
        break;

      case "most_viewed":
        sortOptions = { views: -1 };
        break;

      case "most_answered":
        sortOptions = { answers: -1 };
        break;

      default:
        break;
    }

    const user = await UserModel.findOne({ clerkId }).populate({
      path: "saved",
      match: query,
      options: {
        sort: sortOptions,
        skip: skipAmount,
        limit: pageSize + 1,
      },
      populate: [
        { path: "tags", model: TagModel, select: "_id name" },
        {
          path: "author",
          model: UserModel,
          select: "_id clerkId name picture",
        },
      ],
    });

    const isNext = user.saved.length > pageSize;

    if (!user) {
      throw new Error("User not found");
    }

    const savedQuestions = user.saved;

    return { questions: savedQuestions, isNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserInfo(params: GetUserByIdParams) {
  try {
    connectToDatabase();

    const { userId } = params;

    const user = await UserModel.findOne({ clerkId: userId });

    if (!user) {
      throw new Error("User not found");
    }

    const totalQuestions = await QuestionModel.countDocuments({
      author: user._id,
    });
    const totalAnswers = await AnswerModel.countDocuments({ author: user._id });

    return {
      user,
      totalQuestions,
      totalAnswers,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserQuestions(params: GetUserStatsParams) {
  try {
    connectToDatabase();

    const { userId, page = 1, pageSize = 10 } = params;

    const skipAmount = (page - 1) * pageSize;

    const totalQuestions = await QuestionModel.countDocuments({
      author: userId,
    });

    const userQuestions = await QuestionModel.find({ author: userId })
      .sort({ createdAt: -1, views: -1, upvotes: -1 })
      .skip(skipAmount)
      .limit(pageSize)
      .populate("tags", "_id name")
      .populate("author", "_id clerkId name picture");

    const isNextQuestions = totalQuestions > skipAmount + userQuestions.length;

    return { totalQuestions, questions: userQuestions, isNextQuestions };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserAnswers(params: GetUserStatsParams) {
  try {
    connectToDatabase();

    const { userId, page = 1, pageSize = 10 } = params;

    const skipAmount = (page - 1) * pageSize;

    const totalAnswers = await AnswerModel.countDocuments({ author: userId });

    const userAnswers = await AnswerModel.find({ author: userId })
      .sort({ upvotes: -1 })
      .skip(skipAmount)
      .limit(pageSize)
      .populate("question", "_id title")
      .populate("author", "_id clerkId name picture");

    // checking if the next page exists
    const isNextAnswers = totalAnswers > skipAmount + userAnswers.length;

    return { totalAnswers, answers: userAnswers, isNextAnswers };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// export async function getAllUsers(params: GetAllUsersParams) {
//   try {
//     connectToDatabase();
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }
