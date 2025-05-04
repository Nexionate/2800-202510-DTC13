const express = require("express");
var session = require("express-session");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();


const userSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user'
    }
  }
);
const userModel = new mongoose.model('users', userSchema)


main().catch((err) => console.log(err));

async function main() {

    await mongoose.connect("mongodb://127.0.0.1:27017/GameHub");
  const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === "admin") {
      return next();
    } else {
      res.status(403).send("Forbidden");
    }
  };

  app.get("/users", async (req, res) => {
    try {
      const users = await userModel.find({ role: "user" }); // returns only normal users
      res.json(users);
    } catch (err) {
      console.error("DB error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/admin/users", isAdmin, async (req, res) => {
    try {
      const usersFound = await userModel.find({ role: "user" });

      res.json(usersFound);
    } catch (error) {
      console.log("db error", error);
    }
  });
  const SALT_ROUNDS = 10;

 

  app.use(
    session({
      secret: "keyboard cat",
      resave: true,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  const port = 3000;

  app.set("view engine", "ejs");

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  app.get("/", (req, res) => {
    res.redirect("/home");
  });

  app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html");
  });



  app.use(express.urlencoded({ extended: true }));

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await userModel.findOne({ username: username });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }
  
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      req.session.user = user;
      res.redirect("/home");
    } else {
      res.status(401).json({ message: "Invalid credentials!" });
    }
  });


  app.get("/logout", async (req, res) => {
    req.session.destroy();
    res.redirect("/login");
  });

  app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const userExists = await userModel.findOne({username});
    if (userExists) {
      return res.status(400).json({ message: "Username already taken!" });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

const newUser = new userModel({
  username: username,
  password: hashedPassword,
});
await newUser.save();
    res.render("home.ejs", { username: username });
  });

  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
      return next();
    } else {
      res.redirect("/login");
    }
  };

  app.use(isAuthenticated);

  app.get("/home", (req, res) => {
     res.render("home.ejs", {
       username: req.session.user.username,
       role: req.session.user.role,
     });
  });

app.get("/yourActiveLobby", (req, res) => {
  res.render("yourActiveLobby.ejs", {
    username: req.session.user.username,
    role: req.session.user.role,
  });
});
app.get("/createLobby", (req, res) => {
  res.render("createLobby.ejs", {
    username: req.session.user.username,
    role: req.session.user.role,
  });
});
app.get("/profile", (req, res) => {
  res.render("profile.ejs", {
    username: req.session.user.username,
    role: req.session.user.role,
  });
});
app.get("/searchGames", (req, res) => {
  res.render("searchGames.ejs", {
    username: req.session.user.username,
    role: req.session.user.role,
  });
});
app.get("/viewLobbies", (req, res) => {
  res.render("viewLobbies.ejs", {
    username: req.session.user.username,
    role: req.session.user.role,
  });
});



}
