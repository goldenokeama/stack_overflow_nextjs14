// NOTE: WE WILL PUT ALL OUR SERVER ACTIONS FOR THE QUESTIONS MODEL
"use server";

import { connectToDatabase } from "../mongoose";

export async function createQuestiion(params: any) {
  // we use trycatch block bcus we are dealing with asynchronous code
  // eslint-disable-next-line no-empty
  try {
    // connect to the Database
    connectToDatabase();
  } catch (error) {}
}
