const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
var validator = require('validator');
const amqp = require('amqplib')
const cors = require('cors');
const PORT = process.env.PORT || 4040;

const User = require('./models/User');
//mongodb:27017
mongoose.connect(
  'mongodb://mongodb:27017/authentication',
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
  await channel.assertQueue("USER_UPDATED");
}
connect().then(() => {
  channel.consume("USER_UPDATED", async (data) => {
    getUser = JSON.parse(data.content);
    console.log(getUser.newUser);
    await User.findByIdAndUpdate(getUser.newUser._id, getUser.newUser);
    channel.ack(data);
  });
});

app.use(express.json());
app.use(cors())

app.post('/auth/register', async (req, res) => {
  const { email, password, name, surname } = req.body;

  if (!validator.isEmail(email)) {
    return res
      .status(400)
      .json({ message: 'Lütfen geçerli bir email adresi giriniz.' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res
      .status(400)
      .json({ message: 'Bu Email adresi ile zaten bir kayıt var.' });
  }

  if (!validator.isStrongPassword(password, { minSymbols: 0 })) {
    return res.status(400).json({
      message:
        'Lütfen geçerli bir şifre giriniz. (parolanız en az 8 karakterden oluşmalı ve 1 büyük harf, 1 küçük harf ve 1 sayı içermelidir.)',
    });
  }

  const newUser = new User({
    name,
    surname,
    email,
    password
  });

  newUser.save();
  channel.sendToQueue(
    "USER",
    Buffer.from(
        JSON.stringify({
            newUser
        })
    )
);
  return res.status(201).json({ message: 'Başarıyla kayıt oldunuz.' });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
  }

  if (password !== user.password) {
    return res.status(403).json({ message: 'Parolanız hatalı.' });
  }

  const payload = {
    email,
    name: user.name,
  };

  if(user.type == 0){
    jwt.sign(payload, 'adminsecret', (err, token) => {
      if (err) console.log(err);
      else return res.status(200).json({ token: token });
    });
  }

  jwt.sign(payload, 'secret', (err, token) => {
    if (err) console.log(err);
    else return res.status(200).json({ token: token });
  });
});

app.listen(PORT, () => {
  console.log(`Auth-Service at ${PORT}`);
});
