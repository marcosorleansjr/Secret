require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.set("strictQuery", true);

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Coloque um email valido!"]
    },
    password: {
        type: String,
        required: [true, "Coloque uma senha válida!"]
    }
});


const User = mongoose.model("User", userSchema);


app.listen(3000, function(){
    console.log("SERVER STARTED ON PORT: 3000")
});

app.get("/", function(req, res){
    res.render("home");
}); 

app.route("/login")
.get(function(req, res){
    res.render("login");
})
.post(function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, usersFound){
        if(!err){
            if(usersFound){
                bcrypt.compare(password, usersFound.password, function(err, result) {
                    if(result === true){
                        res.render("secrets");
                    } else {
                        res.send("Email or password is wrong!")
                    }
                });
                
            } else {
                res.send("No have this account!")
            }
        } else {
            res.send(err);
        }
    });
}); 

app.route("/register")
.get(function(req, res){
    res.render("register");
})
.post(function(req, res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const userCreation = new User ({
            email: req.body.username,
            password: hash
        });
        userCreation.save(function(err){
            if(err){
                res.send(err);
            } else {
                res.render("secrets");
            }
        });  
    });

      
});
