use("test");

db.tickets.aggregate([
  {
    $match: {
      "ticketState.feedback": { $exists: true },
    },
  },
  {
    $group: {
      _id: "$show",
      totalReviews: { $sum: 1 },
      averageRating: {
        $avg: "$ticketState.feedback.rating",
      },
    },
  },
  {
    $project: {
      _id: 1,
      totalReviews: 1,
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
