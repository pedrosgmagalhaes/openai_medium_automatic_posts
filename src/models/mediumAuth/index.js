const mongoose = require('mongoose');

const mediumAuthSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  access_token: {
    type: String,
    required: true
  }
});

const MediumAuth = mongoose.model('MediumAuth', mediumAuthSchema);

module.exports = MediumAuth;