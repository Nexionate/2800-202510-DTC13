// Run this in a Node.js script
const bcrypt = require("bcrypt");

async function insertUsers() {
  const mongoose = require("mongoose");
  await mongoose.connect("mongodb://127.0.0.1:27017/GameHub");

  const userSchema = new mongoose.Schema({
    username: String,
    password: String,
  });
  const userModel = mongoose.model("users", userSchema);

  const SALT_ROUNDS = 10;

  const users = [
    { username: "admin1", password: "admin1" },
    { username: "admin2", password: "admin2" },
    { username: "user1", password: "password1" },
    { username: "user2", password: "password2" },
    { username: "user3", password: "password3" },
  ];

  for (let user of users) {
    user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
  }

  await userModel.insertMany(users);
  console.log("Users inserted!");
  process.exit();
}

insertUsers();
