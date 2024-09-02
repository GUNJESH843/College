const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  publishYear: Number,
  author: String,
  coverPagePath: String
});

module.exports = mongoose.model('Book', BookSchema);
