const BookingSchema = new mongoose.Schema({
  hotel:      { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  roomType:   { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  checkIn:    Date,
  checkOut:   Date,
  nights:     Number,
  adults:     Number,
  children:   Number,

  totalPrice: Number,
  currency:   String,

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },

  paymentMethod: String,
  paymentStatus: String,
});