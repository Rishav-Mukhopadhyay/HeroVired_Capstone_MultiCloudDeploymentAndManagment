const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// A submitted "contact us" message. Purely a record — routes/api/contact.js
// rejects a second submission from the same email rather than allowing a
// thread of messages.
const ContactSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String
  },
  message: {
    type: String,
    trim: true
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Contact', ContactSchema);
