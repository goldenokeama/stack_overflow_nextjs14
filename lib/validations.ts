import * as z from "zod";
// NOTE formSchema is from zod
export const QuestionsSchema = z.object({
  // username: z.string().min(2, {
  //   message: "Username must be at least 2 characters.",
  // }),
  // title: z.string().min(5, { message: "WRONG!!!" }).max(130),
  title: z.string().min(5).max(130),
});
