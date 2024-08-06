"use server";

import UserModel from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import { GetTopInteractedTagsParams } from "./shared.types";

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
