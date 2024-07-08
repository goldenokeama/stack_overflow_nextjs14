// NOTE: WE WILL PUT ALL OUR SERVER ACTIONS FOR THE QUESTIONS MODEL
"use server";

import QuestionModel from "@/database/question.model";
import { connectToDatabase } from "../mongoose";
import TagModel from "@/database/tag.model";
import { GetQuestionsParams } from "./shared.types";

export async function getQuestions(params: GetQuestionsParams) {
  // the GetQuestionsParams type helps us to know what's coming from the frontend
  // and what can be accessed right here in our server
}

export async function createQuestiion(params: any) {
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

    // Increment author's reputation by +5 for creating a question
  } catch (error) {}
}
