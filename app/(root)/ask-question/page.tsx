import Question from "@/components/forms/Question";
import { getUserById } from "@/lib/actions/user.action";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
  const { userId } = auth();

  // const userId = "1234567890";
  if (!userId) redirect("/sign-in");

  // USING OUR SERVER ACTION TO GET A USERDOCUMENT IN OUR users collection in our DB
  // Passing an object to the getUserById function
  const mongoUser = await getUserById({ userId });

  console.log(mongoUser);

  return (
    <div>
      <h1>Ask question</h1>
      <div>
        <Question mongoUserId={JSON.stringify(mongoUser._id)} />
      </div>
    </div>
  );
};

export default page;
