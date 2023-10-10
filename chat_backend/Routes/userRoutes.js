const express = require("express");
const router = express.Router();
const {
  registerController,
  loginController,
  protect,
  fetchUsers
} = require("../controller/userController");
router.route("/login").post(loginController);
router.route("/register").post(registerController);
router.route("/fetchUsers").get(protect,fetchUsers)

module.exports = router;
