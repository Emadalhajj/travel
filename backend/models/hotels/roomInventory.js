// لأن عدد الغرف المتاحة يتغير يومياً
const RoomInventorySchema = new mongoose.Schema({
  roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
  date:     { type: Date, required: true }, // تاريخ اليوم
  available: { type: Number, default: 0 },
  price:    { type: Number }, // سعر هذا اليوم بالتحديد (موسمي)
});