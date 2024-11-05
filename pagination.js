const { searchQuery, filter, page = 1, pageSize = 2 } = params;

const skipAmount = (page - 1) * pageSize;
.skip(skipAmount)
.limit(pageSize)
const totalQuestions = await QuestiomModel.countDocuments(query)
const isNext = totalQuestions > skipAmount * Questions.length
return { questions, isNext }