use("test");

db.shows.aggregate([
  {
    $match: {
      "showState.feedbackStats.numberOfReviews": { $gt: 0 },
    },
  },
  {
    $group: {
      _id: null,
      numberOfReviews: { $sum: "$showState.feedbackStats.numberOfReviews" },
      averageRating: { $avg: "$showState.feedbackStats.averageRating" },
    },
  },
  {
    $project: {
      _id: 1,
      numberOfReviews: 1,
      averageRating: 1,
    },
  },
  // {
  //   $merge: {
  //     into: "shows.showState.feedbackStats",
  //     on: "_id",
  //     whenMatched: "merge",
  //     whenNotMatched: "insert",
  //   },
  // },
]);
