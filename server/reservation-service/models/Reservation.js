const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationSchema = new Schema(
  {
    user_id: {
      type: String,
    },
    restaurant_id: {
      type: String,
      required: true,
    },
    startingTime:{
      type:String,
      required:true
    },
    endingTime:{
      type:String,
      required:true
    },area:{
      type:String,
      required:true
    },date:{
      type:String,
      required:true
    }
  },
  { timestamps: true }
);

module.exports = Reservation = mongoose.model('reservation', ReservationSchema);
