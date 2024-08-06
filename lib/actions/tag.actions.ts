"use server";

import UserModel from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import { GetAllTagsParams, GetTopInteractedTagsParams } from "./shared.types";
import TagModel from "@/database/tag.model";

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

    // Getting all the tags(tag documents) in the tag collection (TagModel) by passing an empty object into the find method
    const tags = await TagModel.find({});

    return { tags };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
