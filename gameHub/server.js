const express = require('express');
var session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const path = require('path');
const { type } = require('os');
// const fetch = require('node-fetch');
// const { default: fetch } = await import('node-fetch');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// api key: f61c15c68f3246a3aeebcfa53cdef84f

const apiKey = 'f61c15c68f3246a3aeebcfa53cdef84f';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  region: String,
  activeLobbiesIn: [String],

  userRegion: {
    type: String,
    default: null,
  },
  displayName: String,
});
const userModel = new mongoose.model('users', userSchema);

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/GameHub');
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json());

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

    if (user.displayName == null) {
      await userModel.updateOne(
        { username },
        { $set: { displayName: username } }
      );
    }
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

    // ✅ Fetch games for home page
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${apiKey}&tags=co-op&ordering=-rating&page_size=10`
      );
      const data = await response.json();
      const topGames = data.results;

      // ✅ Render home with games and username
      res.render('home.ejs', {
        username,
        games: topGames,
      });
    } catch (error) {
      console.error('Error fetching games after register:', error);
      res.status(500).send('Failed to fetch games');
    }
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
        username: user.username,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).send('Error fetching games');
    }
  });

  app.post('/magic', async (req, res) => {
    const { topic } = req.body;
    const API_KEY = 'AIzaSyD6oYnwtMMdnDBWOpTBFjq45DD2hxdjU8k';

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Tell me a fun fact or joke about "${topic}"`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      console.log('Gemini API response:', JSON.stringify(data, null, 2));

      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text || 'No magic returned.';

      res.json({ result: text });
    } catch (err) {
      console.error('Gemini API error:', err);
      res.status(500).json({ error: 'Gemini API request failed.' });
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
  app.get('/profile', async (req, res) => {
    try {
      const username = req.session?.user?.username;
      const user = await userModel.findOne({ username });

      if (!user) return res.status(404).send('User not found');
      // this is done because if you edit and save the display name, it will be outdated since its pulling from
      res.render('profile.ejs', {
        username: req.session.user.username,
        role: req.session.user.role,
        displayName: user.displayName,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to load profile');
    }
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
      unique: true,
    },
    lobbyName: String,
    gameName: {
      type: String,
      required: true,
    },
    numPlayers: {
      type: Number,
      required: true,
      min: 2,
      max: 10,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tags: [String],
    gameID: String,
    user: {
      type: [String],
      default: [],
      unique: true,
    },
    password: String,
    owner: {
      type: String,
    },
  });

  function generateLobbyId(length = 5) {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  app.use(express.urlencoded({ extended: true }));

  const Lobby = mongoose.model('Lobby', lobbySchema);

  app.get('/createLobby/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const error = req.query.error;
    res.render('createLobby', { gameId, error });
  });

  app.get('/createLobby', (req, res) => {
    const error = req.query.error;
    res.render('createLobby', { gameId: 0, error });
  });

  app.post('/createLobby/:gameId', async (req, res) => {
    await handleCreateLobby(req, res, req.params.gameId);
  });

  app.post('/createLobby', async (req, res) => {
    await handleCreateLobby(req, res, undefined);
  });

  app.get('/api/allLobbies', async (req, res) => {
    try {
      const lobbies = await Lobby.find({});

      res.json(lobbies);
    } catch (err) {
      console.error('Error fetching all lobbies:', err.message);
      res.status(500).send('Internal server error');
    }
  });

  async function handleCreateLobby(req, res, gameID) {
    try {
      const { gameName, lobbyName, numPlayers, password, tags } = req.body;
      const user = req.session.user;

      if (!user) return res.status(401).send('User not authenticated');

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
        { $addToSet: { activeLobbiesIn: lobbyId } } // ensures no duplicates
      );

      return res.redirect(`/yourActiveLobby`);
    } catch (error) {
      console.error('Error creating lobby:', error);
      return res.redirect(
        `/createLobby${gameID ? '/' + gameID : ''}?error=${encodeURIComponent(
          'You already in a lobby'
        )}`
      );
    }
  }

  app.post('/leaveLobby/:id', async (req, res) => {
    try {
      const username = req.session?.user?.username;
      const lobbyId = req.params.id;

      if (!username) return res.status(401).send('Not authenticated');

      const lobby = await Lobby.findOne({ lobbyId });
      if (!lobby) return res.status(404).send('Lobby not found');

      if (lobby.owner === username) {
        // Owner is leaving → disband the lobby
        await Lobby.deleteOne({ lobbyId });

        // Remove this lobby from all users' activeLobbiesIn
        await userModel.updateMany(
          { activeLobbiesIn: lobbyId },
          { $pull: { activeLobbiesIn: lobbyId } }
        );

        res.send('Lobby disbanded successfully');
      } else {
        // Regular user is leaving → just update lobby and user
        await Lobby.updateOne({ lobbyId }, { $pull: { user: username } });
        await userModel.updateOne(
          { username },
          { $pull: { activeLobbiesIn: lobbyId } }
        );

        res.send('Left lobby successfully');
      }
    } catch (err) {
      console.error('Error in leave/disband lobby:', err);
      res.status(500).send('Server error');
    }
  });

  app.get('/lobbies', async (req, res) => {
    try {
      const username = req.session?.user?.username;
      if (!username) return res.status(401).send('User not authenticated');

      const lobbies = await Lobby.find({ user: { $ne: username } });

      res.json(lobbies);
    } catch (err) {
      console.error('Error fetching lobbies:', err.message);
      res.status(500).send('Internal server error');
    }
  });

  app.post('/joinLobby/:id', async (req, res) => {
    try {
      const username = req.session?.user?.username;
      const lobbyId = req.params.id;

      if (!username) return res.status(401).send('Not authenticated');

      const lobby = await Lobby.findOne({ lobbyId });
      if (!lobby) return res.status(404).send('Lobby not found');

      if (lobby.user.includes(username))
        return res.status(400).send('Already in lobby');

      if (lobby.user.length >= lobby.numPlayers)
        return res.status(400).send('Lobby is full');

      // Add user to lobby
      lobby.user.push(username);
      await lobby.save();

      // Add lobby to user's activeLobbiesIn
      await userModel.updateOne(
        { username },
        { $addToSet: { activeLobbiesIn: lobbyId } }
      );

      res.send('Joined successfully');
    } catch (err) {
      console.error('Join error:', err);
      res.status(500).send('Server error');
    }
  });

  app.post('/editDisplayName', async (req, res) => {
    try {
      const newName = req.body.displayName;
      console.log('new display name:', newName);

      const username = req.session?.user?.username;
      try {
        //update to make more resilient later
        if (newName != null) {
          await userModel.updateOne(
            { username },
            { $set: { displayName: newName } }
          );
        }
      } catch (err) {
        console.error(err);
      }
      res.redirect('/profile');
    } catch (error) {
      console.error('Fetch error:', error);
    }
  });

  app.post('/profile', async (req, res) => {
    try {
      const { location } = req.body;
      console.log('Location received:', location);

      const username = req.session?.user?.username;
      console.log('Username from session:', username);

      await userModel.updateOne(
        { username },
        { $set: { userRegion: location } }
      );

      res.status(200).send('Profile updated');
    } catch (err) {
      console.log(err);
      res.status(500).send('DB error');
    }
  });

  function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const region = getRegion(lat, lon);
    return region;
  }

  function getRegion(lat, lon) {
    if (lat >= 15 && lat <= 72 && lon >= -170 && lon <= -50) {
      return 'North America';
    } else if (lat >= -60 && lat <= 15 && lon >= -90 && lon <= -30) {
      return 'South America';
    } else if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 60) {
      return 'Europe';
    } else if (lat >= 5 && lat <= 80 && lon >= 60 && lon <= 180) {
      return 'Asia';
    } else if (lat >= -50 && lat <= 0 && lon >= 110 && lon <= 180) {
      return 'Oceania';
    } else {
      return 'Unknown Region';
    }
  }
  app.get('/api/activeLobbies', async (req, res) => {
    try {
      const username = req.session?.user?.username;
      if (!username) return res.status(401).send('Not authenticated');

      const user = await userModel.findOne({ username });
      if (!user) return res.status(404).send('User not found');

      const activeLobbyIds = user.activeLobbiesIn || [];

      console.log("User's activeLobbiesIn:", activeLobbyIds); // 🔍 Log what's stored

      const lobbies = await Lobby.find({ lobbyId: { $in: activeLobbyIds } });

      const validLobbyIds = lobbies.map((lobby) => lobby.lobbyId);

      // 🧹 Optional: clean up any stale references
      if (validLobbyIds.length !== activeLobbyIds.length) {
        await userModel.updateOne(
          { username },
          { $set: { activeLobbiesIn: validLobbyIds } }
        );
        console.log('Cleaned up invalid lobby references.');
      }

      console.log(
        'Valid lobbies returned:',
        lobbies.map((l) => l.lobbyId)
      ); // 🔍 Log matches

      res.json(lobbies);
    } catch (err) {
      console.error('Error fetching active lobbies:', err.message);
      res.status(500).send('Server error');
    }
  });

  app.use(express.urlencoded());
  app.post('/search', async (req, res) => {
    try {
      let searchName = req.body.search?.trim();
      let apiUrl = `https://api.rawg.io/api/games?key=${apiKey}&page_size=18&tags=co-op`;

      // if seach exists
      if (searchName) {
        apiUrl += `&search=${encodeURIComponent(searchName)}`;
      } else {
        searchName = 'All Games';
      }
      const response = await fetch(apiUrl);

      if (!response.ok) throw new Error('Failed to fetch from RAWG API');

      const data = await response.json();
      const games = data.results;

      // Make sure session has user info. This information is passed to allGames.ejs
      const user = req.session.user || {};
      res.render('allGames.ejs', {
        username: req.session.user.username,
        role: req.session.user.role,
        games,
        filters: { name: searchName },
        searchName,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).send('Error fetching games');
    }
  });
}
