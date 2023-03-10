require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our secret!",
    resave: false,
    saveUninitialized: false,
    cookie: {}
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", true);

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.listen(3000, function(){
    console.log("SERVER STARTED ON PORT: 3000")
});

app.get("/", function(req, res){
    res.render("home");
}); 

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        } else {
            res.redirect("/");
        }
    })
});

app.route("/login")
.get(function(req, res){
    res.render("login");
})
.post(function(req, res){
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

}); 

app.route("/register")
.get(function(req, res){
    res.render("register");
})
.post(function(req, res){
  
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
      
});

app.route("/secrets")
.get(function(req, res){
    User.find({"secret": {$ne: null}},function(err, foundUser){
        if(err){
            console.log(err);
        } else{
            if(foundUser){
                res.render("secrets", {userWithSecrets: foundUser})
            }
        }
    });
});

app.route("/submit")
.get(function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})
.post(function(req, res){
    const submitSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser) {
                foundUser.secret = submitSecret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    });
});
