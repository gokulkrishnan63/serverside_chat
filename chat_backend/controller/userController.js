const userArray = require("../modals/userModel");
const util = require("util");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = generateToken;
const registerController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check for all fields
    if (!name || !email || !password) {
      const err = new Error("All necessary input fields have not been filled");
      err.status = 400;
      throw err;
    }

    const userExist = await userArray.findOne({ email });

    if (userExist) {
      const error = new Error("User with this email already exists");
      error.status = 409;
      throw error;
    }

    const userNameExist = await userArray.findOne({ name });
    if (userNameExist) {
      const error = new Error(
        "Username already taken, please choose another one"
      );
      error.status = 409;
      throw error;
    }

    const user = await userArray.create(req.body);
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      const error = new Error("Registration error");
      error.status = 400;
      throw error;
    }
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userArray.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      const error = new Error("Invalid username or password");
      error.status = 401;
      throw error;
    }
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

const fetchUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  try {
    const users = await userArray.find({
      ...keyword,
      _id: { $ne: req.user._id },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const protect = async (req, res, next) => {
  const testToken = req.headers.authorization;
  let token;

  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }

  if (!token) {
    const err = new Error("You are not logged in!");
    err.status = 401;
    return res.status(err.status).json({ error: err.message });
  }

  try {
    const decodedToken = await util.promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
    const user = await userArray.findById(decodedToken.id);

    if (!user) {
      const err = new Error("The user with the given token does not exist");
      err.status = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

module.exports = { registerController, loginController, protect, fetchUsers };
