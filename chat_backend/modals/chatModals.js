const mongoose = require("mongoose");

const chatModel = new mongoose.Schema(
  {
    chatName: {
      type: String,
    },
    isGroupChat: { type: Boolean },
    // fectching user from user document
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // fetching message from message document
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId, // it refrence to message document
      ref: "Message",
    },
    // setting group admin from user side
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatModel);
