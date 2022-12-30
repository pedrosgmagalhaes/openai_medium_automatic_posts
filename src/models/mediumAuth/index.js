const mongoose = require('mongoose');

const mediumAuthSchema = new mongoose.Schema({
  code: {
    type: String
  },
  state: {
    type: String
  },
  access_token: {
    type: String
  }
});

const MediumAuth = mongoose.model('MediumAuth', mediumAuthSchema);

module.exports = MediumAuth;