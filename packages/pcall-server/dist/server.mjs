var _a;
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import mongoose, { models as models$5 } from "mongoose";
import { v4 } from "uuid";
import validator from "validator";
import { uniqueNamesGenerator } from "unique-names-generator";
import { nanoid } from "nanoid";
import "timeago.js";
import "crypto";
import Queue from "bull";
import { Worker, Queue as Queue$1 } from "bullmq";
import { config } from "dotenv";
import "dotenv/config";
import express from "express";
var TokenRoles;
(function(TokenRoles2) {
  TokenRoles2["ADMIN"] = "ADMIN";
  TokenRoles2["PUBLIC"] = "PUBLIC";
  TokenRoles2["AGENT"] = "AGENT";
  TokenRoles2["TALENT"] = "TALENT";
})(TokenRoles || (TokenRoles = {}));
var ActorType;
(function(ActorType2) {
  ActorType2["AGENT"] = "AGENT";
  ActorType2["TALENT"] = "TALENT";
  ActorType2["CUSTOMER"] = "CUSTOMER";
  ActorType2["SERVICE"] = "SERVICE";
  ActorType2["TIMER"] = "TIMER";
})(ActorType || (ActorType = {}));
const redisOptions = {
  connection: {
    host: process.env.REDIS_HOST || "",
    port: process.env.REDIS_PORT || 6379,
    username: process.env.REDIS_USERNAME || "",
    password: process.env.REDIS_PASSWORD || "",
    enableReadyCheck: false
  }
};
process.env.MONGO_DB_ENDPOINT || "";
process.env.PUBLIC_MONGO_FIELD_SECRET || "";
const PUBLIC_DEFAULT_PROFILE_IMAGE = process.env.PUBLIC_DEFAULT_PROFILE_IMAGE;
const { Schema: Schema$5, models: models$4 } = mongoose;
var ShowStatus;
(function(ShowStatus2) {
  ShowStatus2["CREATED"] = "CREATED";
  ShowStatus2["BOX_OFFICE_OPEN"] = "BOX OFFICE OPEN";
  ShowStatus2["BOX_OFFICE_CLOSED"] = "BOX OFFICE CLOSED";
  ShowStatus2["CANCELLED"] = "CANCELLED";
  ShowStatus2["FINALIZED"] = "FINALIZED";
  ShowStatus2["CANCELLATION_INITIATED"] = "CANCELLATION INITIATED";
  ShowStatus2["REFUND_INITIATED"] = "REFUND INITIATED";
  ShowStatus2["LIVE"] = "LIVE";
  ShowStatus2["ENDED"] = "ENDED";
  ShowStatus2["STOPPED"] = "STOPPED";
  ShowStatus2["IN_ESCROW"] = "IN ESCROW";
})(ShowStatus || (ShowStatus = {}));
var ShowCancelReason;
(function(ShowCancelReason2) {
  ShowCancelReason2["TALENT_NO_SHOW"] = "TALENT NO SHOW";
  ShowCancelReason2["CUSTOMER_NO_SHOW"] = "CUSTOMER NO SHOW";
  ShowCancelReason2["SHOW_RESCHEDULED"] = "SHOW RESCHEDULED";
  ShowCancelReason2["TALENT_CANCELLED"] = "TALENT CANCELLED";
  ShowCancelReason2["CUSTOMER_CANCELLED"] = "CUSTOMER CANCELLED";
})(ShowCancelReason || (ShowCancelReason = {}));
const cancelSchema$1 = new Schema$5({
  cancelledAt: { type: Date, required: true, default: Date.now },
  cancelledInState: { type: String },
  requestedBy: { type: String, enum: ActorType, required: true },
  reason: { type: String, enum: ShowCancelReason, required: true }
});
const finalizeSchema$1 = new Schema$5({
  finalizedAt: { type: Date, required: true, default: Date.now },
  finalizedBy: { type: String, enum: ActorType, required: true }
});
const escrowSchema$1 = new Schema$5({
  startDate: { type: Date, required: true },
  endDate: { type: Date }
});
const refundSchema$1 = new Schema$5({
  refundedAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema$5.Types.ObjectId, ref: "Transaction", required: true }
  ],
  ticket: { type: Schema$5.Types.ObjectId, ref: "Ticket", required: true },
  requestedBy: { type: String, enum: ActorType, required: true },
  amount: { type: Number, required: true, default: 0 }
});
const saleSchema$1 = new Schema$5({
  soldAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema$5.Types.ObjectId, ref: "Transaction", required: true }
  ],
  ticket: { type: Schema$5.Types.ObjectId, ref: "Ticket", required: true },
  amount: { type: Number, required: true, default: 0 }
});
const runtimeSchema = new Schema$5({
  startDate: { type: Date, required: true },
  endDate: { type: Date }
});
const salesStatsSchema = new Schema$5({
  ticketsAvailable: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  ticketsSold: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  ticketsReserved: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  ticketsRefunded: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  ticketsRedeemed: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  totalSales: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  totalRefunded: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  }
});
const showStateSchema = new Schema$5({
  status: {
    type: String,
    enum: ShowStatus,
    required: true,
    default: ShowStatus.CREATED
  },
  active: { type: Boolean, required: true, default: true },
  salesStats: {
    type: salesStatsSchema,
    required: true,
    default: () => ({})
  },
  cancel: cancelSchema$1,
  finalize: finalizeSchema$1,
  escrow: escrowSchema$1,
  runtime: runtimeSchema,
  refunds: { type: [refundSchema$1], required: true, default: () => [] },
  sales: { type: [saleSchema$1], required: true, default: () => [] }
}, { timestamps: true });
const showSchema = new Schema$5({
  _id: { type: Schema$5.Types.ObjectId, required: true, auto: true },
  talent: { type: Schema$5.Types.ObjectId, ref: "Talent", required: true },
  agent: { type: Schema$5.Types.ObjectId, ref: "Agent", required: true },
  roomId: {
    type: String,
    required: true,
    default: function() {
      return v4();
    },
    unique: true
  },
  coverImageUrl: { type: String, trim: true },
  duration: {
    type: Number,
    required: true,
    min: [0, "Duration must be over 0"],
    max: [180, "Duration must be under 180 minutes"],
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: [3, "Name must be at least 3 characters"],
    maxLength: [50, "Name must be under 50 characters"]
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  price: { type: Number, required: true, min: 1 },
  talentInfo: {
    type: {
      name: { type: String, required: true },
      profileImageUrl: { type: String, required: true },
      ratingAvg: { type: Number, required: true, default: 0 },
      numReviews: { type: Number, required: true, default: 0 }
    },
    required: true
  },
  showState: { type: showStateSchema, required: true, default: () => ({}) }
}, {
  timestamps: true
});
(models$4 == null ? void 0 : models$4.Show) ? models$4.Show : mongoose.model("Show", showSchema);
const { Schema: Schema$4, models: models$3 } = mongoose;
var TicketStatus;
(function(TicketStatus2) {
  TicketStatus2["RESERVED"] = "RESERVED";
  TicketStatus2["CANCELLATION_INITIATED"] = "CANCELLATION INITIATED";
  TicketStatus2["CANCELLED"] = "CANCELLED";
  TicketStatus2["FINALIZED"] = "FINALIZED";
  TicketStatus2["REDEEMED"] = "REDEEMED";
  TicketStatus2["IN_ESCROW"] = "IN ESCROW";
  TicketStatus2["IN_DISPUTE"] = "IN DISPUTE";
  TicketStatus2["REFUNDED"] = "REFUNDED";
  TicketStatus2["MISSED_SHOW"] = "MISSED SHOW";
  TicketStatus2["SHOW_CANCELLED"] = "SHOW CANCELLED";
})(TicketStatus || (TicketStatus = {}));
var TicketCancelReason;
(function(TicketCancelReason2) {
  TicketCancelReason2["SHOW_CANCELLED"] = "SHOW CANCELLED";
  TicketCancelReason2["TALENT_NO_SHOW"] = "TALENT NO SHOW";
  TicketCancelReason2["CUSTOMER_NO_SHOW"] = "CUSTOMER NO SHOW";
  TicketCancelReason2["SHOW_RESCHEDULED"] = "SHOW RESCHEDULED";
  TicketCancelReason2["CUSTOMER_CANCELLED"] = "CUSTOMER CANCELLED";
})(TicketCancelReason || (TicketCancelReason = {}));
var TicketDisputeDecision;
(function(TicketDisputeDecision2) {
  TicketDisputeDecision2["TALENT_WON"] = "TALENT WON";
  TicketDisputeDecision2["CUSTOMER_WON"] = "CUSTOMER WON";
  TicketDisputeDecision2["SPLIT"] = "SPLIT";
})(TicketDisputeDecision || (TicketDisputeDecision = {}));
var TicketDisputeReason;
(function(TicketDisputeReason2) {
  TicketDisputeReason2["ATTEMPTED_SCAM"] = "ATTEMPTED SCAM";
  TicketDisputeReason2["ENDED_EARLY"] = "ENDED EARLY";
  TicketDisputeReason2["LOW_QUALITY"] = "LOW QUALITY";
  TicketDisputeReason2["TALENT_NO_SHOW"] = "TALENT NO SHOW";
  TicketDisputeReason2["SHOW_NEVER_STARTED"] = "SHOW NEVER STARTED";
})(TicketDisputeReason || (TicketDisputeReason = {}));
const cancelSchema = new Schema$4({
  cancelledAt: { type: Date, required: true, default: Date.now },
  cancelledBy: { type: String, enum: ActorType, required: true },
  reason: { type: String, enum: TicketCancelReason, required: true },
  cancelledInState: { type: String, enum: TicketStatus }
});
const redemptionSchema = new Schema$4({
  redeemedAt: { type: Date, required: true, default: Date.now }
});
const reservationSchema = new Schema$4({
  reservedAt: { type: Date, required: true, default: Date.now },
  name: { type: String, required: true },
  pin: {
    type: String,
    required: true,
    minLength: 8,
    maxLength: 8,
    validator: (v) => validator.isNumeric(v, { no_symbols: true })
  }
});
const escrowSchema = new Schema$4({
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date }
});
const disputeSchema = new Schema$4({
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date },
  reason: { type: String, enum: TicketDisputeReason, required: true },
  disputedBy: { type: String, enum: ActorType, required: true },
  explanation: { type: String, required: true },
  decision: { type: String, enum: TicketDisputeDecision }
});
const finalizeSchema = new Schema$4({
  finalizedAt: { type: Date, required: true, default: Date.now },
  finalizer: { type: String, enum: ActorType, required: true }
});
const feedbackSchema = new Schema$4({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  review: { type: String },
  createdAt: { type: Date, required: true, default: Date.now }
});
const refundSchema = new Schema$4({
  refundedAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema$4.Types.ObjectId, ref: "Transaction", required: true }
  ],
  amount: { type: Number, required: true, default: 0 }
});
const saleSchema = new Schema$4({
  soldAt: { type: Date, required: true, default: Date.now },
  transactions: [
    { type: Schema$4.Types.ObjectId, ref: "Transaction", required: true }
  ],
  amount: { type: Number, required: true, default: 0 }
});
const ticketStateSchema = new Schema$4({
  status: {
    type: String,
    enum: TicketStatus,
    required: true,
    default: TicketStatus.RESERVED
  },
  active: { type: Boolean, required: true, default: true },
  totalPaid: { type: Number, required: true, default: 0 },
  totalRefunded: { type: Number, required: true, default: 0 },
  cancel: cancelSchema,
  redemption: redemptionSchema,
  reservation: reservationSchema,
  escrow: escrowSchema,
  dispute: disputeSchema,
  finalize: finalizeSchema,
  feedback: feedbackSchema,
  refund: refundSchema,
  sale: saleSchema
}, { timestamps: true });
const ticketSchema = new Schema$4({
  _id: { type: Schema$4.Types.ObjectId, required: true, auto: true },
  paymentAddress: {
    type: String,
    maxLength: 50,
    required: true,
    validator: (v) => validator.isEthereumAddress(v)
  },
  price: { type: Number, required: true },
  show: { type: Schema$4.Types.ObjectId, ref: "Show" },
  ticketState: {
    type: ticketStateSchema,
    required: true,
    default: () => ({})
  },
  agent: { type: Schema$4.Types.ObjectId, ref: "Agent", required: true },
  talent: { type: Schema$4.Types.ObjectId, ref: "Talent", required: true },
  transactions: [{ type: Schema$4.Types.ObjectId, ref: "Transaction" }]
}, { timestamps: true });
(models$3 == null ? void 0 : models$3.Ticket) ? models$3.Ticket : mongoose.model("Ticket", ticketSchema);
const womensNames = [
  "Silver Breeze",
  "Daisie",
  "Joy",
  "Cinnamon",
  "Fantasia",
  "Windy",
  "Kittyn",
  "Busty",
  "Sugar",
  "Nixie",
  "Frost",
  "Juli Lee ",
  "Sweet Tart Roxie",
  "Toye Darlene",
  "O. Claudette",
  "Jade",
  "Brandi Lynn",
  "Lix",
  "Silky",
  "Night",
  "Spring",
  "Joy Kittie",
  "Paris",
  "Darlene",
  "Chaise",
  "Brandi Rae",
  "Emerald Michelle",
  "Dee Divyne",
  "Missy",
  "Pearl",
  "Juli",
  "Lynn",
  "Kelli Ann ",
  "Dee Starr",
  "Marie",
  "Sukie Rae",
  "Galore",
  "Justine",
  "Shaneese O.",
  "Hazy",
  "Luv",
  "Dominique",
  "Sweetheart",
  "Dominique ",
  "Dee Satin ",
  "Sunshine",
  "Vinyl Spring",
  "Starr",
  "Autumn ",
  "Amber Lynn",
  "Trixie",
  "Kittie",
  "Lacy",
  "Azure",
  "Lacy Nixie",
  "Chanel",
  "Darla",
  "Furr Brandi",
  "Trixie",
  "Kelli Ann Dee Furr",
  "Brandalina",
  "Toye",
  "Evening ",
  "Lee Marie",
  "Kelli Ann",
  "Candi",
  "Foxxx",
  "Chyna",
  "Rainy",
  "Creme",
  "Blondie",
  "Vinyl",
  "Mandi",
  "Jenny",
  "Lucious",
  "Harmony",
  "Paris",
  "Cinnamon",
  "Dominix",
  "Claudette Dee Lynn",
  "Tawny",
  "Brittni Rae",
  "G. Nixie",
  "Starr",
  "Bree",
  "Justine",
  "Spring",
  "Fantasia",
  "Ruby",
  "Luv",
  "Roxie",
  "Frost",
  "Baby",
  "Moon",
  "Ivory",
  "Vinyl",
  "Jenny",
  "Velvet",
  "Misty",
  "Frost",
  "Sweetie Dee ",
  "Morning Lacy",
  "Night Autumn ",
  "Lee Fabergé",
  "Autumn Dee ",
  "Chantelle",
  "Baby",
  "Frost Kittie",
  "Lacy",
  "Lipps Brandi Rae",
  "Chantelle",
  "Missi Ann",
  "Dominix",
  "Breezy",
  "Furr",
  "Kittie",
  "Eve Kelli Ann",
  "Rayne",
  "Rainy",
  "Paris",
  "Mandi",
  "Roma Elle",
  "Dior",
  "Misha",
  "Toye ",
  "Lola O.",
  "Roxie",
  "Silkk",
  "Silver",
  "Lisa Rae",
  "Cream Puff",
  "Amber Lynn Dee Marie",
  "Missy",
  "Sugar",
  "Mahoganie",
  "Jo",
  "Cinnamon",
  "Pearl Mahoganie",
  "Kittyn",
  "Melody",
  "Hooters Lacy",
  "Hooters",
  "Bree",
  "Vinyl",
  "Juli",
  "Mahoganie",
  "Foxxx",
  "Misha",
  "Cream Puff",
  "Baby",
  "Morning",
  "Missi Rae",
  "Heart",
  "Stormy",
  "Louise",
  "Busty",
  "Sweetie",
  "Silkk",
  "Brandalina",
  "Chantelle",
  "Diamond",
  "Cherry Kitty",
  "Brianna Wild",
  "Lianna Swift",
  "Brianna Luv",
  "Angelica Diamond",
  "Glory Valentine",
  "Fiona Faith",
  "Ininity Angel",
  "Roxy Summers",
  "Nikki Candy",
  "Brianna Gold",
  "Fiona Sky",
  "Angel Blue",
  "Cherry Skye",
  "Sasha Wild",
  "Nadya Darling",
  "Alexis Heart",
  "Alexis Texas",
  "Bunny Amore",
  "Jasmine Saint",
  "Sasha Sweet",
  "Ininity Sweet",
  "Cherry Chains",
  "Jade Valentine",
  "Bunny Sweet",
  "Nadya Wild",
  "Rose Sparx",
  "Fiona Wild",
  "Nikki Luv",
  "Kristal Steel",
  "Bunny Diamond",
  "Arianna Ryder",
  "April Fox",
  "Roxy Ryder",
  "Angelica Angel",
  "Brianna Cox",
  "Jade Amore",
  "Rose Cox",
  "Mona Angel",
  "Lexi Skye",
  "Heather Kitty",
  "Cherry Diamond",
  "Inferno Ryder",
  "Kristal Silver",
  "Angel Angel",
  "Lexi Swift",
  "Jade Ryder",
  "Nikki Cox",
  "Inferno Texas",
  "Mistress Texas",
  "Amethyst",
  "Annika",
  "Arabella",
  "Ariana",
  "Ariel",
  "Athena",
  "Aurora",
  "Beatrix",
  "Bebe",
  "Bishop",
  "Blaze",
  "Cameo",
  "Camilla",
  "Cashmere",
  "Cayenne",
  "Cecilia",
  "Cerise",
  "Charis",
  "Charlotte",
  "Cherish",
  "Christabel",
  "Cleo",
  "Coco",
  "Cricket",
  "Darcy",
  "Delilah",
  "Demi",
  "Desiree",
  "Domino",
  "Dylan",
  "Echo",
  "Edie",
  "Elektra",
  "Eliza",
  "Ella",
  "Emery",
  "Epiphany",
  "Estelle",
  "Evelyn",
  "Fawn",
  "Felix",
  "Fiona",
  "Francesca",
  "Gabriela",
  "Gemma",
  "Genesis",
  "Gigi",
  "Giovanna",
  "Harlow",
  "Harper",
  "Havana",
  "Hera",
  "Hero",
  "Ivory",
  "Jezebel",
  "Jinx",
  "Josie",
  "Journey",
  "Juna",
  "Kitty",
  "Lenora",
  "Lila",
  "Lilith",
  "Livia",
  "Lola",
  "Lotus",
  "Love Assplay",
  "Luna",
  "Lux",
  "Lyric",
  "Maya",
  "Mirabelle",
  "Misty",
  "Monique",
  "Neve",
  "Odessa",
  "Onyx",
  "Ophelia",
  "Persia",
  "Phoebe",
  "Phoenix",
  "Piper",
  "Pippa",
  "Portia",
  "Quinn",
  "Revel",
  "Rhapsody",
  "Rio",
  "Roxanna",
  "Roxy",
  "Rumer",
  "Sabra",
  "Sadie",
  "Sari",
  "Sasha",
  "Satine",
  "Selene",
  "Seraphina",
  "Serena",
  "Shay",
  "Skyla",
  "Stella",
  "Stormy",
  "Story",
  "Tabitha",
  "Tasha",
  "Tatiana",
  "Tatum",
  "Tierra",
  "Tyra",
  "Vegas",
  "Venus",
  "Vesta",
  "Violet",
  "Vivian",
  "Zandra",
  "Zaria",
  "Zelda",
  "Zephyr",
  "Zion"
];
const { Schema: Schema$3 } = mongoose;
const agentSchema = new Schema$3({
  _id: { type: Schema$3.Types.ObjectId, required: true, auto: true },
  walletAddress: {
    type: String,
    maxLength: 50,
    validator: (v) => validator.isEthereumAddress(v)
  },
  name: {
    type: String,
    maxLength: 50,
    minLength: [4, "Name is too short"],
    required: true,
    trim: true,
    default: function() {
      return uniqueNamesGenerator({
        dictionaries: [womensNames]
      });
    }
  },
  address: {
    type: String,
    required: true,
    maxLength: 50,
    unique: true,
    index: true,
    validator: (v) => validator.isEthereumAddress(v)
  }
}, { timestamps: true });
((_a = models$5) == null ? void 0 : _a.Agent) ? models$5.Agent : mongoose.model("Agent", agentSchema);
const { Schema: Schema$2, models: models$2 } = mongoose;
const showeventSchema = new Schema$2({
  _id: { type: Schema$2.Types.ObjectId, required: true, auto: true },
  type: { type: String, required: true },
  show: { type: Schema$2.Types.ObjectId, ref: "Show", required: true },
  talent: { type: Schema$2.Types.ObjectId, ref: "Talent", required: true },
  agent: { type: Schema$2.Types.ObjectId, ref: "Agent", required: true },
  ticket: { type: Schema$2.Types.ObjectId, ref: "Ticket" },
  transactions: [{ type: Schema$2.Types.ObjectId, ref: "Transaction" }],
  ticketInfo: {
    type: {
      name: { type: String },
      price: { type: Number }
    },
    required: true
  }
}, { timestamps: true });
showeventSchema.index({ createdAt: -1 });
(models$2 == null ? void 0 : models$2.ShowEvent) ? models$2 == null ? void 0 : models$2.ShowEvent : mongoose.model("ShowEvent", showeventSchema);
const { Schema: Schema$1, models: models$1 } = mongoose;
const statSchema = new Schema$1({
  ratingAvg: { type: Number, default: 0, min: 0, max: 5, required: true },
  totalEarnings: { type: Number, default: 0, min: 0, required: true },
  totalRating: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  numReviews: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  numCompletedShows: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  completedShows: [
    {
      type: Schema$1.Types.ObjectId,
      ref: "Show",
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value"
      }
    }
  ]
}, { timestamps: true });
const talentSchema = new Schema$1({
  _id: { type: Schema$1.Types.ObjectId, required: true, auto: true },
  key: {
    type: String,
    required: true,
    maxLength: 30,
    minLength: 30,
    unique: true,
    default: function() {
      return nanoid(30);
    }
  },
  walletAddress: {
    type: String,
    maxLength: 50,
    validator: (v) => validator.isEthereumAddress(v)
  },
  name: {
    type: String,
    maxLength: 50,
    minLength: [4, "Name is too short"],
    required: true,
    trim: true,
    default: function() {
      return uniqueNamesGenerator({
        dictionaries: [womensNames]
      });
    }
  },
  profileImageUrl: {
    type: String,
    default: PUBLIC_DEFAULT_PROFILE_IMAGE,
    required: true
  },
  agentCommission: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  agent: { type: Schema$1.Types.ObjectId, ref: "Agent", required: true },
  activeShows: [{ type: Schema$1.Types.ObjectId, ref: "Show" }],
  stats: { type: statSchema, required: true, default: () => ({}) }
}, { timestamps: true });
(models$1 == null ? void 0 : models$1.Talent) ? models$1 == null ? void 0 : models$1.Talent : mongoose.model("Talent", talentSchema);
const { Schema, models } = mongoose;
var TransactionReasonType;
(function(TransactionReasonType2) {
  TransactionReasonType2["TICKET_PAYMENT"] = "TICKET PAYMENT";
  TransactionReasonType2["TICKET_REFUND"] = "TICKET REFUND";
  TransactionReasonType2["DISPUTE_RESOLUTION"] = "DISPUTE RESOLUTION";
})(TransactionReasonType || (TransactionReasonType = {}));
const transactionSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true, auto: true },
  hash: { type: String },
  block: { type: Number },
  from: { type: String },
  to: { type: String },
  reason: { type: String, enum: TransactionReasonType },
  value: {
    type: String,
    required: true,
    validator: (v) => validator.isNumeric(v)
  },
  ticket: { type: Schema.Types.ObjectId, ref: "Ticket" },
  talent: { type: Schema.Types.ObjectId, ref: "Talent" },
  agent: { type: Schema.Types.ObjectId, ref: "Agent" },
  show: { type: Schema.Types.ObjectId, ref: "Show" }
}, { timestamps: true });
(models == null ? void 0 : models.Transaction) ? models == null ? void 0 : models.Transaction : mongoose.model("Transaction", transactionSchema);
new Queue("show", {});
const processJob = async (job) => {
  console.log("showWorker: ", job.data);
};
const showWorker = new Worker("show", processJob, redisOptions);
const conf = config();
showWorker.on("completed", (job) => {
  console.log(`Job completed with result ${job.returnvalue}`);
});
console.log("conf: ", conf);
console.log("redisOptions: ", redisOptions);
const showQueue = new Queue$1("show", redisOptions);
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [new BullAdapter(showQueue)],
  serverAdapter
});
const app = express();
app.listen(3e3, () => {
  console.log("Running on 3000...");
  console.log("For the UI, open http://localhost:3000/admin/queues");
  console.log("Make sure Redis is running on port 6379 by default");
});
const bullmqServer = app;
app.use("/admin/queues", serverAdapter.getRouter());
export {
  bullmqServer
};
