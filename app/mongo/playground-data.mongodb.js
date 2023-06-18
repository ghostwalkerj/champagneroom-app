use('test');

// Insert a few documents into the sales collection.
// db.getCollection("agents").insertMany([
//   {
//     address: "0x0fa5c03b4802bf7e98f1bd2a13ce59fb04e2698c",
//     name: "Lola",
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     address: "0xb6b1c83f0d381db135f6ebf6ee412f6966adb086",
//     name: "Ophelia",
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
// ]);

//const agent = db.getCollection("agents").findOne();

// db.getCollection("talents").insertMany([
//   {
//     agent: agent._id,
//     name: "Sexy Babe",
//     profileImageUrl:
//       "https://bafkreieyzmlltipqvqgpx66uupuqm7c7llkbtgtrgynewfnmcid45s2i4m.ipfs.w3s.link",
//     agentCommission: 10,
//     activeShows: [],
//     key: "QCPSNDx4cyVUwsN9ZwT-RJYxVf1sfH",
//     stats: {
//       ratingAvg: 0,
//       totalEarnings: 0,
//       totalRating: 0,
//       numberOfReviews: 0,
//       numCompletedShows: 0,
//       completedShows: [],
//       createdAt: {
//         $date: "2023-05-23T05:41:11.486Z",
//       },
//       updatedAt: {
//         $date: "2023-05-23T05:41:11.486Z",
//       },
//     },
//     createdAt: {
//       $date: "2023-05-23T05:41:11.487Z",
//     },
//     updatedAt: {
//       $date: "2023-06-02T22:09:50.703Z",
//     },
//   },
// ]);

//const talent = db.getCollection("talents").findOne();

// db.getCollection("shows").insertMany([
//   {
//     talent: talent._id,
//     agent: agent._id,
//     coverImageUrl:
//       "https://bafkreieyzmlltipqvqgpx66uupuqm7c7llkbtgtrgynewfnmcid45s2i4m.ipfs.w3s.link",
//     duration: 60,
//     name: "Sexy Babes Show",
//     capacity: 1,
//     price: 22,
//     talentInfo: {
//       name: "Sexy Babe",
//       profileImageUrl:
//         "https://bafkreieyzmlltipqvqgpx66uupuqm7c7llkbtgtrgynewfnmcid45s2i4m.ipfs.w3s.link",
//       ratingAvg: 0,
//       numberOfReviews: 0,
//     },
//     showState: {
//       status: "CANCELLED",
//       active: false,
//       salesStats: {
//         ticketsAvailable: 0,
//         ticketsSold: 0,
//         ticketsReserved: 0,
//         ticketsRefunded: 0,
//         ticketsRedeemed: 0,
//         totalSales: 0,
//         totalRefunded: 0,
//       },
//       feedbackStats: {
//         numberOfReviews: 0,
//         averageRating: 0,
//       },
//       cancel: {
//         cancelledAt: {
//           $date: "2023-06-02T22:09:47.124Z",
//         },
//         cancelledInState: "boxOfficeOpen",
//         requestedBy: "TALENT",
//         reason: "TALENT CANCELLED",
//       },
//       refunds: [],
//       sales: [],
//       createdAt: {
//         $date: "2023-06-02T22:09:47.131Z",
//       },
//       updatedAt: {
//         $date: "2023-06-02T22:09:47.131Z",
//       },
//     },
//     roomId:
//       "531891c9d837a6115b1be870e41014fb:5f43e7ef75e4f5c2074ad5e1c446b94da8588c6674792a0f9cc2bbb38ffd7887",
//     createdAt: {
//       $date: "2023-06-02T00:49:02.445Z",
//     },
//     updatedAt: {
//       $date: "2023-06-02T22:09:47.131Z",
//     },
//     __enc_roomId: true,
//   },
//   {
//     talent: talent._id,
//     agent: agent._id,
//     coverImageUrl:
//       "https://bafkreieyzmlltipqvqgpx66uupuqm7c7llkbtgtrgynewfnmcid45s2i4m.ipfs.w3s.link",
//     duration: 60,
//     name: "Sexy Babes Show",
//     capacity: 1,
//     price: 22,
//     talentInfo: {
//       name: "Sexy Babe",
//       profileImageUrl:
//         "https://bafkreieyzmlltipqvqgpx66uupuqm7c7llkbtgtrgynewfnmcid45s2i4m.ipfs.w3s.link",
//       ratingAvg: 0,
//       numberOfReviews: 0,
//     },
//     showState: {
//       status: "BOX OFFICE OPEN",
//       active: true,
//       salesStats: {
//         ticketsAvailable: 1,
//         ticketsSold: 0,
//         ticketsReserved: 0,
//         ticketsRefunded: 0,
//         ticketsRedeemed: 0,
//         totalSales: 0,
//         totalRefunded: 0,
//       },
//       feedbackStats: {
//         numberOfReviews: 0,
//         averageRating: 0,
//       },
//       refunds: [],
//       sales: [],
//       createdAt: {
//         $date: "2023-06-02T22:09:50.669Z",
//       },
//       updatedAt: {
//         $date: "2023-06-02T22:09:50.669Z",
//       },
//     },
//     roomId:
//       "b11070ffa1ad1b0dd8201f0e830baf00:7fbb9c3b8f4da6fdaca5083265e3e69975117ffedccf52c801ac1a60719c59c2",
//     createdAt: {
//       $date: "2023-06-02T22:09:50.669Z",
//     },
//     updatedAt: {
//       $date: "2023-06-02T22:09:50.669Z",
//     },
//     __enc_roomId: true,
//   },
// ]);

//const show = db.getCollection("shows").findOne();

// db.getCollection("tickets").insertMany([
//   {
//     paymentAddress: "0x0000000000000000000000000000000000000000",
//     price: 22,
//     show: show._id,
//     customerName: "Dick Jackin",
//     pin: "b9c7d6b19c1f682ccccd969c794dfde2:307e4b50a543fc77aae9b105544666d1",
//     agent: agent._id,
//     talent: talent._id,
//     ticketState: {
//       status: "FINALIZED",
//       active: false,
//       totalPaid: 22,
//       totalRefunded: 0,
//       cancel: [],
//       refund: [],
//       feedback: {
//         rating: 5,
//         review: "This is a review",
//       },
//       sale: {
//         soldAt: {
//           $date: "2023-05-30T20:29:25.178Z",
//         },
//         transactions: [
//           {
//             $oid: "64765ca592666761b84ed006",
//           },
//         ],
//         amount: 22,
//         _id: {
//           $oid: "64765ca592666761b84ed013",
//         },
//       },
//       createdAt: {
//         $date: "2023-05-30T20:30:20.174Z",
//       },
//       updatedAt: {
//         $date: "2023-05-30T20:30:20.174Z",
//       },
//     },
//     createdAt: {
//       $date: "2023-05-30T20:29:19.204Z",
//     },
//     updatedAt: {
//       $date: "2023-05-30T20:30:20.174Z",
//     },
//     __enc_pin: true,
//     __v: 0,
//   },
// ]);

db.getCollection('operators').insertOne({
  user: { address: '0x5E90C65c58a4AD95EEA3b04615A4270d1D2ec1B1' },
});
