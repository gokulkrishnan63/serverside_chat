const ChatArray = require("../modals/chatModals");
const UserArray = require("../modals/userModel");

const accessChat = async (req, res) => {
  // user id come from body
  const { userId } = req.body;

  if (!userId) {
    return res.status(400);
  }

  try {
    const isChat = await ChatArray.aggregate([
      {
        // it check the previous chat of the both users
        $match: {
          isGroupChat: false,
          users: {
            // users  name of the chatModel
            $all: [req.user._id, userId],
          },
        },
      },
      // if the existing data is found it will fetch all data
      {
        $lookup: {
          from: "users", // from and foreignfiled both are same and they just matching the localField
          localField: "latestMessage.sender", // it refrence of message  document and that refrence to user document
          foreignField: "_id",
          as: "latestMessage.sender",
        },
      },
      {
        $unwind: "$latestMessage.sender",
      },
    ]);

    // if it will send as respone
    if (isChat.length > 0) {
      res.status(200).json(isChat[0]);
    } else {
      const chatData = {
        chatName: "sender", // chatName key set in chatModel to create new chatname
        isGroupChat: false, // isGroupChat key set in chatModel and it has to be false because it is one and one chat
        users: [req.user._id, userId], // users key is an array in chatModel it will create new chat between two users
      };
      const createChat = await ChatArray.create(chatData);

      // it find the chat based on id
      const FullChat = await ChatArray.findOne({ _id: createChat._id })
        .populate("users", "-password") // it retrive users data
        .populate("latestMessage"); // the local field and retrive the data from message
      res.status(200).json({ FullChat });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const fetchChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const results = await ChatArray.aggregate([
      {
        $match: {
          users: { $elemMatch: { $eq: userId } }, // it's key name in chatmodel collection
        },
      },
      {
        $lookup: {
          from: "users", // we going to retrive chat by this collection
          localField: "users", // it retrive the conversation previously had
          foreignField: "_id", // this id use to insist data about users
          as: "userDetails", // it contains the chat conversations
        },
      },
      {
        $lookup: "users", // it for render group admin details
        localField: "groupAdmin", // it has reference user id in localfield
        foreignField: "_id", // _id it check the localField by using foreign field
        as: "groupAdminDetails", // it contains details along with chats
      },
      {
        $lookup: {
          from: "messages", // retrieve the whole data from messages documents which is belongs to given id
          localField: "latestMessage", // latestMessage is key name of chatModel
          foreignField: "_id", // foreignField it checks the chats which is concerned to given id
          as: "latestMessageDetails",
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
    ]);

    await UserArray.populate(results, {
      path: "latestMessage.sender",
      select: "name email",
    });
    res.status(200).json({ results });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//  answer would be like this

//   _id: ObjectId("chatId123"),
//   chatName: "My Group",
//   isGroupChat: true,
//   users: [ObjectId("user1"), ObjectId("user2"), ObjectId("user3")],
//   groupAdmin: ObjectId("adminUserId"),
//   groupAdminDetails: {
//     _id: ObjectId("adminUserId"),
//     name: "Admin User",
//     email: "admin@example.com",
//     // other user-related fields
//   },
//   // other chat-related fields
// }

///////////////// checking is that group chat or not

const fetchGroups = async (req, res) => {
  try {
    const allGroups = await ChatArray.where("isGroupChat").equals(true); // this function fetch the group which is equal to true
    res.status(200).json({ allGroups });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    // req.body.users ==> it's array field in chatModal || req.body.name ==> it's going to be set group name
    return res.status(400).json({ message: "data is insufficient" });
  }

  try {
    // this whole function is used to create new chat group

    const chatData = {
      chatName: req.body.name, // name of the group
      isGroupChat: true,
      users: JSON.parse(req.body.users), // it's for push the users
      groupAdmin: req.user, // req.user currently stands for that who made signup
    };

    const createChat = await Chat.create(chatData);
    // after create the group we have to invoke user details which is concern to users
    const fullChat = await Chat.aggregate([
      { $match: { _id: createChat._id } }, // it's for getting the users based on groups
      {
        // it's for fetch the users details
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },
      // it's for fetch admin details
      {
        $lookup: {
          from: "users",
          localField: "groupAdmin",
          foreignField: "_id",
          as: "populatedAdmin",
        },
      },
      // {
      //   $project: {
      //     chatName: 1,
      //     users: "$users",
      //     isGroupChat: 1,
      //     groupAdmin: "$populatedAdmin",
      //   },
      // },
    ]);

    res.status(201).json(fullChat[0]);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

// this function stands for exit group

const groupExit = async (req, res) => {
  // chatId stands for chatId which is created by above function

  // userId stands for userId
  const { chatId, userId } = req.body;
  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { user: userId } },
      { new: true }
    );
    if (!removed) {
      res.status(404).json({ message: "chat not found" });
    }

    const chatInfo = await Chat.aggregate([
      { $match: { _id: removed._id } },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "groupAdmin",
          foreignField: "_id",
          as: "groupAdmin",
        },
      },
    ]);

    res.json(chatInfo[0]);
  } catch (error) {
    res.status(500).json({ error: "interal server error" });
  }
};

module.exports = {
  accessChat,
  fetchChats,
  fetchGroups,
  createGroupChat,
  groupExit,
};
