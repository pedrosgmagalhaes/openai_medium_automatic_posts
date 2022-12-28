const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
  title: String,
  link: String,
  originalContent: String,
  generatedContent: String,
  generatedImage: String,
  isPosted: {
    type: Boolean,
    default: false
  }
});

const Feed = mongoose.model('Feed', feedSchema);

module.exports = Feed;
