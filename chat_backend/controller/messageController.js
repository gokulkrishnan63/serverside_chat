const MessageArray = require("../modals/messageModel");
const UserArray = require("../modals/userModel");
const ChatArray = require("../modals/chatModals");

const allMessages = async (req, res) => {
  try {
    const chatId = req.params.chatId;

    const messages = await MessageArray.aggregate([
      {
        $match: { chat: mongoose.Types.ObjectId(chatId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          as: "senderInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reciver",
          foreignField: "_id",
          as: "receiverInfo",
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chatInfo",
        },
      },
      // {
      //   $project: {
      //     senderInfo: { name: 1, email: 1 },
      //     receiverInfo: 1,
      //     chatInfor: 1,
      //   },
      // },
    ]);
    res.json(messages);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const sendMessage = async (req, res) => {
  // content ==>content represent to message
  // chatId  ==>  chatId coming body it has previous chat
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400);
  }

  // sender
  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    const message = await MessageArray.create(newMessage);
    const populatedMessage = await MessageArray.aggregate([
      {
        $match: { _id: message._id },
      },
      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          as: "senderInfo",
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chatInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reciver",
          foreignField: "_id",
          as: "receiverInfo",
        },
      },
    ]);

    await UserArray.populate(populatedMessage, {
      path: "chatInfo.users",
      select: " name email",
    });

    await ChatArray.findByIdAndUpdate(chatId, {
      latestMessage: populatedMessage[0],
    });
    res.json(populatedMessage[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


module.exports ={allMessages,sendMessage}