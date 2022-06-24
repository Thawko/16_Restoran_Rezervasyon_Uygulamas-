const express = require('express');
const app = express();
const mongoose = require('mongoose');
const amqp = require('amqplib');
require('dotenv').config();

const PORT = process.env.PORT || 5050;

const Restaurant = require('./models/Restaurant');

const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
    const token = req.headers["authorization"];
    console.log(req.headers["authorization"])
    jwt.verify(token, "secret", (err, user) => {
        if (err) {
            return res.json({ message: err });
        } else {
            req.user = user;
            next();
        }
    });

};

mongoose.connect(
  'mongodb://mongodb:27017/restaurant',
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
}
connect();


app.use(express.json());

sendToQueue = async (restaurant) => {
  channel.sendToQueue(
    "RESTAURANT_TO_SEARCH",
    Buffer.from(
        JSON.stringify({
            restaurant
        })
    )
);
}

app.post('/restaurant', async (req, res) => {
  const { name, description, location } = req.body;

  const newRestaurant = new Restaurant({
    name,
    description,
    location
  });

  await newRestaurant.save();
  await sendToQueue(newRestaurant);

  return res.status(201).json({ newRestaurant });
})

app.get('/restaurant',isAuthenticated, async (req, res) => {
  console.log(req.user)
  const allRestaurants = await Restaurant.find();
  return res.status(200).json({allRestaurants});
})

app.get('/restaurant/:id', async (req, res) => {

  const restaurant = await Restaurant.findById(req.params.id)
  return res.status(200).json({restaurant});
})

app.put('/restaurant/:id', async (req, res) => {
  const { name, description, location } = req.body
  await Restaurant.findByIdAndUpdate(req.params.id, { name, description, location });
  await sendToQueue(newRestaurant);
  return res.status(200).json({message: "Restoran başarıyla güncellendi."});
})

app.delete('/restaurant/:id', async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id)
  await Restaurant.findByIdAndDelete(req.params.id);
  await sendToQueue(restaurant);
  return res.status(200).json({message: "Restoran başarıyla silindi."});
})

app.listen(PORT, () => {
  console.log(`Restaurant-Service at ${PORT}`);
});