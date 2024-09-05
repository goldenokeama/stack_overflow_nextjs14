"use server";

import UserModel from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import {
  CreateUserParams,
  DeleteUserParams,
  GetAllUsersParams,
  GetUserByIdParams,
  UpdateUserParams,
} from "./shared.types";
import { revalidatePath } from "next/cache";
import QuestionModel from "@/database/question.model";

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

    // destructuring the params and setting default values
    // const { page = 1, pageSize = 20, filter, searchQuery } = params;

    // passing an empty object into the UserModel(usercollection on mongoDB) means we want to get all users(user documents in the user collection) then .sort({createdAt:-1}) shows the new user document at the top
    const users = await UserModel.find({}).sort({ createdAt: -1 });

    // returning the users within an object
    return { users };
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
