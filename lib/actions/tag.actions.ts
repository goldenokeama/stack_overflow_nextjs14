"use server";

import UserModel from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import {
  GetAllTagsParams,
  GetQuestionsByTagIdParams,
  GetTopInteractedTagsParams,
} from "./shared.types";
import TagModel, { ITag } from "@/database/tag.model";
import { FilterQuery } from "mongoose";
import QuestionModel from "@/database/question.model";

export async function getTopInteractedTags(params: GetTopInteractedTagsParams) {
  try {
    connectToDatabase();

    const { userId } = params;

    // 1st we find the user from the user collection(UserModel) on the database
    const user = await UserModel.findById(userId);

    // if we don't have a user with that id, we throw an error
    if (!user) throw new Error("User not found");

    // if the user is found, we have to FIND INTERACTIONS FOR THE USER AND GROUP BY TAGS
    // the tags in the questions the user has posted and the tags on the questions this user has answered
    // NOTE: later we will create a new Model(collection) in the db called interaction, then we will be able to do all sorts of manipulations on that model

    // FOR NOW, we are returning a static array of a couple of tags
    return [
      { _id: "1", name: "tag1" },
      { _id: "2", name: "tag2" },
    ];
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function getAllTags(params: GetAllTagsParams) {
  try {
    connectToDatabase();

    // pageSize is how many tags we want to see per page
    const { searchQuery, filter, page = 1, pageSize = 10 } = params;

    const skipAmount = (page - 1) * pageSize;

    const query: FilterQuery<typeof TagModel> = {};

    if (searchQuery) {
      query.$or = [{ name: { $regex: new RegExp(searchQuery, "i") } }];
    }

    let sortOptions = {};

    switch (filter) {
      case "popular":
        sortOptions = { questions: -1 };
        break;
      case "recent":
        sortOptions = { createdAt: -1 };
        break;
      case "name":
        sortOptions = { name: 1 };
        break;
      case "old":
        sortOptions = { createdAt: 1 };
        break;

      default:
        break;
    }
    const totalTags = await TagModel.countDocuments(query);

    // Getting all the tags(tag documents) in the tag collection (TagModel) by passing an empty object into the find method
    const tags = await TagModel.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const isNext = totalTags > skipAmount + tags.length;

    return { tags, isNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function getQuestionsByTagId(params: GetQuestionsByTagIdParams) {
  try {
    connectToDatabase();

    const { tagId, searchQuery, page = 1, pageSize = 10 } = params;

    const skipAmount = (page - 1) * pageSize;

    const tagFilter: FilterQuery<ITag> = { _id: tagId };

    const tag = await TagModel.findOne(tagFilter).populate({
      path: "questions",
      model: QuestionModel,
      match: searchQuery
        ? { title: { $regex: searchQuery, $options: "i" } }
        : {},
      options: {
        sort: { createdAt: -1 },
        skip: skipAmount,
        limit: pageSize + 1, // +1 to check if there is next page
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

    if (!tag) {
      throw new Error("Tag not found");
    }

    const isNext = tag.questions.length > pageSize;

    const questions = tag.questions;

    return { tagTitle: tag.name, questions, isNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getTopPopularTags() {
  try {
    connectToDatabase();

    // using mongoDB model aggregate function
    const popularTags = await TagModel.aggregate([
      { $project: { name: 1, numberOfQuestions: { $size: "$questions" } } },
      { $sort: { numberOfQuestions: -1 } },
      { $limit: 5 },
    ]);

    return popularTags;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
