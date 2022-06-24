const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors')
const PORT = process.env.PORT || 9090;

const Reservation = require("./models/Reservation")
mongoose.connect(
  'mongodb://mongodb:27017/reservation',
  {
    useNewUrlParser: true,
  }
);

var db = mongoose.connection;
db.on('error', console.error.bind(console, "ERROR"))
db.once('open', function () {
  console.log("connected")
})

app.use(express.json());
app.use(cors());

app.post('/reservation', async (req, res) => {
  const {slot, startingTime, endingTime, area, date} = req.body;
  console.log(req.body)
  const reservation = new Reservation({user_id: 1, date ,restaurant_id:slot, startingTime, endingTime, area})
  await reservation.save()

  return res.status(200).json({aferin:"aferin"});
})

app.delete('/reservation', async (req, res) => {
  const {id} = req.body;
  console.log(req.body)
  await Reservation.findByIdAndDelete(id);

  return res.status(200).json({aferin:"aferin"});
})

app.get('/reservation', async (req, res) => {

  const reservations = await Reservation.find();
  console.log(reservations)
  return res.status(200).json({reservation:reservations});
})

app.listen(PORT, () => {
  console.log(`Reservation-Service at ${PORT}`);
});