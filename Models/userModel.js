var mongoose = require("mongoose")

const userSchema =  new mongoose.Schema({
    fullname : {
        type:String,
        required:[true,"fullname needed"]
    },
    email:{
        type:String,
        required:[true,"email needed"]
    },
   
    password:{
        type:String,
        required:[true,"password needed"]
    }
})
module.exports = mongoose.model('users',userSchema);