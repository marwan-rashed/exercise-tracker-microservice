const moment = require('moment')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: "false" }));

const mongoUrl = `mongodb+srv://marwan:3RlCTFRdI0Lz8iAJ@urlshortner.4o8fe.mongodb.net/mongo-freecodecamp?retryWrites=true&w=majority`;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
  log: [{
    description: {
      type: String
    },
    duration: {
      type: Number
    },
    date: {
      type: Date
    }
  }],
  count: {
    type: Number,
    default: 0
  }
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  let user = new User({
    username
  });
  await user.save();
  res.json({
    username,
    _id: user._id
  })
});

app.get('/api/users', async (req, res) => {
  const users = await User.find().select('username _id');
  res.json(users);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const { _id } = req.params;
  const exerciseDate = date || Date.now();
  const exercise = {
    description,
    duration,
    date: exerciseDate
  };
  let user = await User.findOne({ _id });
  if(!user) return res.json('user not found');
  user.log.push(exercise);
  user.count = user.log.length;
  await user.save();
  res.json({
    _id,
    username: user.username,
    date: moment(exerciseDate).format('ddd MMM DD YYYY'),
    duration: parseInt(duration),
    description
  });
});

app.get('/api/users/:_id/logs', async (req, res) => {
   const { _id } = req.params;
   const { from, to, limit } = req.query;
   User.findById({ _id }).exec()
  .then( user => {
    let newLog = user.log;
    if (from){
      newLog = newLog.filter( x =>  x.date.getTime() > new Date(from).getTime() )}
    if (to)
      newLog = newLog.filter( x => x.date.getTime() < new Date(to).getTime());
    if (limit)
      newLog = newLog.slice(0, limit > newLog.length ? newLog.length : limit);
    user.log = newLog;
    let temp = user.toJSON();
    temp['count'] = newLog.length;

    return temp;
  })
  .then( result => res.json(result))
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
