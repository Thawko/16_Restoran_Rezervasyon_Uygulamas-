const express = require('express');
const app = express();
const mongoose = require('mongoose');
const amqp = require('amqplib');
require('dotenv').config();
const cors = require('cors')
const PORT = process.env.PORT || 7070;

const Restaurant = require('./models/Restaurant');

mongoose.connect(
  'mongodb://mongodb:27017/restaurant-search',
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
  await channel.assertQueue("RESTAURANT_TO_SEARCH");
}
connect().then(async () => {
  channel.consume("RESTAURANT_TO_SEARCH", async (data) => {
    getRestaurant = JSON.parse(data.content);
    restaurant = getRestaurant.restaurant;
    if(restaurant != null){
      const isExist = await Restaurant.findById(restaurant._id);
      if(isExist){
        await Restaurant.findByIdAndUpdate(restaurant._id, restaurant);  
      }else{
        const newRest = Restaurant(restaurant);
        await newRest.save()
      }
      channel.ack(data);
    }
    
  });
});

app.use(express.json());
app.use(cors())
app.get('/search', async (req, res) => {
  const { location } = req.body;

  const restaurants = await Restaurant.find({location});

  return res.status(200).json({ restaurants });
})

app.listen(PORT, () => {
  console.log(`Search-Service at ${PORT}`);
});