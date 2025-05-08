const express = require('express');
var session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();

const path = require('path');

// api key: f61c15c68f3246a3aeebcfa53cdef84f

const apiKey = 'f61c15c68f3246a3aeebcfa53cdef84f';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  region: String,
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  activeLobbiesIn: [String],
});
const userModel = new mongoose.model('users', userSchema);

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/GameHub');
  app.use(express.static(path.join(__dirname, 'public')));

  const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
      return next();
    } else {
      res.status(403).send('Forbidden');
    }
  };

  app.get('/users', async (req, res) => {
    try {
      const users = await userModel.find({ role: 'user' }); // returns only normal users
      res.json(users);
    } catch (err) {
      console.error('DB error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/admin/users', isAdmin, async (req, res) => {
    try {
      const usersFound = await userModel.find({ role: 'user' });

      res.json(usersFound);
    } catch (error) {
      console.log('db error', error);
    }
  });
  const SALT_ROUNDS = 10;

  app.use(
    session({
      secret: 'keyboard cat',
      resave: true,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  const port = 3000;

  app.set('view engine', 'ejs');

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  app.get('/', (req, res) => {
    res.redirect('/home');
  });

  app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
  });

  app.use(express.urlencoded({ extended: true }));

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await userModel.findOne({ username: username });
    if (!user) {
      return res.status(400).json({ message: 'User not found!' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      req.session.user = user;
      res.redirect('/home');
    } else {
      res.status(401).json({ message: 'Invalid credentials!' });
    }
  });

  app.get('/logout', async (req, res) => {
    req.session.destroy();
    res.redirect('/login');
  });

  app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const userExists = await userModel.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already taken!' });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = new userModel({
      username: username,
      password: hashedPassword,
    });
    await newUser.save();
    res.render('home.ejs', { username: username });
  });

  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
      return next();
    } else {
      res.redirect('/login');
    }
  };

  app.use(isAuthenticated);

  app.get('/home', async (req, res) => {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${apiKey}&tags=co-op&ordering=-rating&page_size=10`
      );

      const data = await response.json();
      const topGames = data.results;

      // Make sure session has user info
      const user = req.session.user || {};

      res.render('home', {
        games: topGames,
        role: user.role,
        username: user.username,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).send('Error fetching games');
    }
  });

  app.get('/yourActiveLobby', (req, res) => {
    res.render('yourActiveLobby.ejs', {
      username: req.session.user.username,
      role: req.session.user.role,
    });
  });
  app.get('/createLobby', (req, res) => {
    res.render('createLobby.ejs', {
      username: req.session.user.username,
      role: req.session.user.role,
    });
  });
  app.get('/profile', (req, res) => {
    res.render('profile.ejs', {
      username: req.session.user.username,
      role: req.session.user.role,
    });
  });
  app.get('/searchGames', (req, res) => {
    res.render('searchGames.ejs', {
      username: req.session.user.username,
      role: req.session.user.role,
    });
  });
  app.get('/viewLobbies', (req, res) => {
    res.render('viewLobbies.ejs', {
      username: req.session.user.username,
      role: req.session.user.role,
    });
  });
  app.get('/gameDescription/:id', (req, res) => {
    const gameId = req.params.id;
    res.render('gameDescription', { gameId });
  });

  app.get('/allGames', (req, res) => {
    res.render('allGames.ejs', {
      username: req.session.user.username,
      role: req.session.user.role,
    });
  });

  const lobbySchema = new mongoose.Schema({
    lobbyId: {
      type: String,
      required: true,
      unique: true
    },
    lobbyName: String,
    gameName: {
      type: String,
      required: true
    },
    numPlayers: {
      type: Number,
      required: true,
      min: 2,
      max: 10
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tags: [String],
    gameID: String,
    user: {
      type: [String],
      default: [],
    },
    password: String,
    owner: {
      type: String,
      unique: true
    }
  });
  
  function generateLobbyId(length = 5) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  
  
  app.use(express.urlencoded({ extended: true }));
  
  const Lobby = mongoose.model("Lobby", lobbySchema);
  
  app.get('/createLobby/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const error = req.query.error;
    res.render("createLobby", { gameId, error });
  });

  app.get('/createLobby', (req, res) => {
    const error = req.query.error;
    res.render("createLobby", { gameId: undefined, error });
  });

  app.post("/createLobby/:gameId", async (req, res) => {
    await handleCreateLobby(req, res, req.params.gameId);
  });
  
  app.post("/createLobby", async (req, res) => {
    await handleCreateLobby(req, res, undefined); 
  });

    app.get("/api/allLobbies", async (req, res) => {
      try {
        const lobbies = await Lobby.find({});
        res.json(lobbies);
      } catch (err) {
        console.error("Error fetching all lobbies:", err.message);
        res.status(500).send("Internal server error");
      }
    });
  
async function handleCreateLobby(req, res, gameID) {
  try {
    const { gameName, lobbyName, numPlayers, password, tags } = req.body;
    const user = req.session.user;

    if (!user) return res.status(401).send("User not authenticated");

    const username = user.username;
    const tagList = (Array.isArray(tags) ? tags : [tags]).filter(Boolean); // Removes null
    const lobbyId = generateLobbyId();
    const userList = [username];
    const owner = username;

    const newLobby = new Lobby({
      lobbyId,
      lobbyName,
      gameName,
      numPlayers,
      tags: tagList,
      gameID,
      user: userList,
      password,
      owner,
    });

    await newLobby.save();

  
    await userModel.updateOne(
      { username },
      { $addToSet: { activeLobbiesIn: lobbyId } }
    );


    return res.redirect(`/yourActiveLobby/${lobbyId}`);
  } catch (error) {
    console.error("Error creating lobby:", error);
    return res.redirect(
      `/createLobby${gameID ? "/" + gameID : ""}?error=${encodeURIComponent(
        "Lobby creation failed"
      )}`
    );
  }


}


  app.get("/lobbies", async (req, res) => {
    try {
      const username = req.session?.user?.username;
      console.log("Logged-in user:", username); // <-- Debug check
  
      if (!username) return res.status(401).send("User not authenticated");
  
      const lobbies = await Lobby.find({ user: { $ne: username } });
      console.log("Lobbies found:", lobbies.length); // <-- Debug check
  
      res.json(lobbies)
    } catch (err) {
      console.error("Error fetching lobbies:", err.message);
      res.status(500).send("Internal server error");
    }
  });
  
  app.post("/joinLobby/:id", async (req, res) => {
    try {
      const username = req.session?.user?.username;
      const lobbyId = req.params.id;
  
      if (!username) return res.status(401).send("Not authenticated");
  
      const lobby = await Lobby.findOne({ lobbyId });
      if (!lobby) return res.status(404).send("Lobby not found");
  
      if (lobby.user.includes(username))
        return res.status(400).send("Already in lobby");
  
      if (lobby.user.length >= lobby.numPlayers)
        return res.status(400).send("Lobby is full");
  
      // Add user to lobby
      lobby.user.push(username);
      await lobby.save();
  
      // Add lobby to user's activeLobbiesIn
      await userModel.updateOne(
        { username },
        { $addToSet: { activeLobbiesIn: lobbyId } }
      );
  
      res.send("Joined successfully");
    } catch (err) {
      console.error("Join error:", err);
      res.status(500).send("Server error");
    }
  });
  app.get("/api/activeLobbies", async (req, res) => {
    try {
      const username = req.session?.user?.username;
      if (!username) return res.status(401).send("Not authenticated");

      const user = await userModel.findOne({ username });
      if (!user) return res.status(404).send("User not found");

      const activeLobbyIds = user.activeLobbiesIn;

      const lobbies = await Lobby.find({ lobbyId: { $in: activeLobbyIds } });
      res.json(lobbies);
    } catch (err) {
      console.error("Error fetching active lobbies:", err.message);
      res.status(500).send("Server error");
    }
  });

}




app.get('/search/:game', async (req, res) => {
  try {
    searchName = req.params.game;
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&tags=co-op&search=${searchName}`
    );

    if (!response.ok) throw new Error('Failed to fetch from RAWG API');

    const data = await response.json();
    const games = data.results;

    res.redirect('/allGames');
    // Make sure session has user info
    const user = req.session.user || {};
    res.render('allGames', {
      games,
      filter: { name },
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).send('Error fetching games');
  }
});



