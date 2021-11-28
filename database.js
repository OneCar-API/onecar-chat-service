const mongoose = require('mongoose');

mongoose.connect('mongodb://root:mongo123@localhost:27017/socketchat?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false');

const Message = mongoose.model('Message', 
{
  room_id: String,
  from_id: String,
  from_name: String,
  to_id: String,
  to_name: String,
  text: String,
  sent_at: {
    type: Date,
    default: Date.now(),
  },
});

async function findMessagesByRoom(room_id) {
  await Message.find({room_id: room_id}, (error, data) => {
    if (error) {
      console.log(error);
    } else {
      return data;
    }
  })
}
