const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const { connectToDb } = require("./config/db");
const User = require("./models/user.model");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
//middlewares
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;
  console.log(username, email, password);
  try {
    if (!username || !email || !password) {
      throw new Error("All fields are required!");
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "User already exists." });
    }
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res
        .status(400)
        .json({ message: "Username is taken, try another name." });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const userDoc = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    //jwt
    if (userDoc) {
      const token = jwt.sign({ id: userDoc._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    return res
      .status(200)
      .json({ user: userDoc, message: "User created successfully." });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    if (!userDoc) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    const isPasswordValid = await bcryptjs.compareSync(
      password,
      userDoc.password,
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    //jwt
    if (userDoc) {
      const token = jwt.sign({ id: userDoc._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    return res
      .status(200)
      .json({ user: userDoc, message: "logged in successfully" });
  } catch (error) {
    console.log("Error logging in: ", error.message);

    return res.status(400).json({ message: error.message });
  }
});

app.get("/api/fetch-user", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const userDoc = await User.findById(decoded.id).select("-password");
    if (!userDoc) {
      return res.status(400).json({ message: "No user found." });
    }
    res.status(200).json({ user: userDoc });
  } catch (error) {
    console.log("Error in  fetching user: ", error.message);

    return res.status(400).json({ message: error.message });
  }
});

app.post("/api/logout", async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

app.listen(PORT, () => {
  connectToDb();
  console.log(`server is running on http://localhost:${PORT}`);
});

// I7y3l6vF9ykzCtCo
// mongodb+srv://muhdfahim786_db_user:I7y3l6vF9ykzCtCo@cluster0.g6wthuw.mongodb.net/?appName=Cluster0
