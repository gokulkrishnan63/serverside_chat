const express = require("express");
const { allMessages, sendMessage } = require("../controller/messageController");

const { protect } = require("../controller/userController");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").get(protect, sendMessage);

module.exports = router;
