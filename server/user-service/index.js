const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');

const PORT = process.env.PORT || 6060;

const User = require('./models/User');

mongoose.connect(
  'mongodb://mongodb:27017/user',
  {
    useNewUrlParser: true,
  }
);

var db = mongoose.connection;
db.on('error', console.error.bind(console, "ERROR"))
db.once('open', function () {
  console.log("connected")
})

async function connect() {
  const amqpServer = "amqp://guest:guest@rabbitmq";
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue("USER");
}
6
connect().then(() => {
  channel.consume("USER", async (data) => {
    getUser = JSON.parse(data.content);
    const user = new User(getUser.newUser);
    console.log(user)
    await user.save();
    channel.ack(data);
  });
});

const isAuthenticated = (req, res, next) => {
  const token = req.headers['authorization'];
  console.log(req.headers['authorization']);

  jwt.verify(token, 'secret', (err, user) => {
    if (err) {
      return res.json({ message: err });
    } else {
      req.user = user;
      next();
    }
  });
};

const isAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  console.log(req.headers['authorization']);

  jwt.verify(token, 'adminsecret', (err, user) => {
    if (err) {
      return res.json({ message: err });
    } else {
      req.user = user;
      next();
    }
  });
};

app.use(express.json());

app.get('/user', isAdmin, async (req, res) => {
  const user = await User.find();
  console.log(user)
  return res.json(user);
})

app.put('/user',isAuthenticated, async (req, res) => {
  const email = req.user.email;
  const user = await User.findOne({ email });
  if(user){
    const {name, surname} = req.body;
    await User.findByIdAndUpdate(user.id, {name,surname});
    const newUser = await User.findById(user.id);
    channel.sendToQueue(
      "USER_UPDATED",
      Buffer.from(
          JSON.stringify({
              newUser
          })
      ))
    return res.status(200).json({ newUser });
  }
})

app.listen(PORT, () => {
  console.log(`User-Service at ${PORT}`);
});