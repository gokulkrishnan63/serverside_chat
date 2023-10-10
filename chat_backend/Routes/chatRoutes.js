const express = require("express");
const { protect } = require("../controller/userController");

const {
  accessChat,
  fetchChats,
  fetchGroups,
  createGroupChat,
  groupExit,
} = require("../controller/chatController");

const router = express.Router();

router.route("/").post(protect,accessChat);
router.route("/").get(protect,fetchChats);
router.route("/createGroup").post(protect,createGroupChat);
router.route("/fetchGroups").get(protect,fetchGroups);
router.route("/groupExit").put(protect,groupExit)

module.exports=router;