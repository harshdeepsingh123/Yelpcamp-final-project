var express=require('express');
var app=express();
var bodyparser=require("body-parser");
var mongoose=require('mongoose');
var passport=require("passport");
var localStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var flash=require("connect-flash");
var methodOverride= require("method-override");
var Campground=require("./models/campground");
var Comment= require("./models/comment");
var User=require("./models/user");
var seedb=require("./seeds");
//seedb();
mongoose.connect("mongodb://localhost:27017/yelp_campv10",{useNewUrlParser:true});
app.use(flash());
app.use(require("express-session")({
    secret:"rusty is a cute dog",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());   
app.use(function(req,res,next){
    res.locals.currentuser=req.user;
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    next();
});
app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));

app.get("/",function(req,res){
    res.render("landing");
});
//INDEX - show all campgrounds
app.get("/campgrounds",function(req,res){
    //calling campground from db
        Campground.find({},function(err,allCampgrounds){
            if(err){
                console.log(err);
            }else{
                res.render("campgrounds/index",{campgrounds:allCampgrounds,currentuser:req.user});
            }
        })
       
});
//CREATE -add new campgrounds
app.post("/campgrounds",isLoggedIn,function(req,res){
    //get dfata from the form and to the  campground array
    var name=req.body.name;
    var price=req.body.price;
    var image=req.body.image;
    var desc=req.body.description;
    var author={
        id:req.user._id,
        username:req.user.username
    };
    var newcampground={name:name,price:price,image:image,description:desc,author:author};
    //create a new campground and save to db
    Campground.create(newcampground,function(err,newcreated){
        if(err){
            console.log(err)
        }else{
                //redirect it to campgrounds page
            req.flash("success","Successfully created  the campground");
            res.redirect("/campgrounds");
        }
    })


});
//NEW - show form to create new campground to the data base 
app.get("/campgrounds/new",isLoggedIn,function(req,res){
    res.render("campgrounds/new");
});
app.get("/campgrounds/:id",function(req,res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundcampground){
        if(err){
            console.log(err);
        }else{
            
            res.render("campgrounds/show",{campground:foundcampground});
        }
    });
    
});
//edit campgrounds

app.get("/campgrounds/:id/edit",checkuserownership,function(req,res){
    
        Campground.findById(req.params.id,function(err,foundcampground){
               res.render("campgrounds/edit",{campground:foundcampground});
        })
    })

 
//update campgrounds
app.put("/campgrounds/:id",checkuserownership,function(req,res){
    //find and update the correct campground 
    Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedcampground){
        if(err){
            res.redirect("/campgrounds");
        }else{
            res.redirect("/campgrounds/"+ req.params.id);
        }
    }) //redirect somewhere
})
//destroy campground
app.delete("/campgrounds/:id",checkuserownership,function(req,res){
    Campground.findByIdAndRemove(req.params.id,function(err){
        if(err){
            res.redirect("/campgrounds");
        }else{
            req.flash("success","Successfully deleted the campground"); 
            res.redirect("/campgrounds");
        }
    })
})
// comments routes
app.get("/campgrounds/:id/comments/new",isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
        if(err){
            console.log(err)
        }else{
            res.render("comments/new",{campground:campground});
        }
    })
   
})
app.post("/campgrounds/:id/comments",isLoggedIn,function(req,res){
    //look up campground using id
    Campground.findById(req.params.id,function(err,campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }else{
            Comment.create(req.body.comment,function(err,comment){
                if(err){
                    console.log(err);
                }else{

                    comment.author.id=req.user._id;
                    comment.author.username=req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success","Successfully created the comment");
                    res.redirect("/campgrounds/"+ campground._id);
                }
            })
        }
    })
})
//edit comment
app.get("/campgrounds/:id/comments/:comment_id/edit",checkcommentownership,function(req,res){
    Comment.findById(req.params.comment_id,function(err,foundcomment){
        if(err){
            res.redirect("back");
        }else{
            res.render("comments/edit",{campground_id:req.params.id,comment: foundcomment});
        }
    })
        
})
//comment update
app.put("/campgrounds/:id/comments/:comment_id",checkcommentownership,function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedcomment){
        if(err){
          res.redirect("back");  
        }else{
            res.redirect("/campgrounds/" + req.params.id)
        }
    })
})
//comment delete
app.delete("/campgrounds/:id/comments/:comment_id",checkcommentownership,function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id,function(err){
        if(err){
            res.redirect("back");
        }else{
            req.flash("success","Successfully deleted the comment");
            res.redirect("/campgrounds/"+req.params.id);
        }
    })

})
//auth routes
app.get("/register",function(req,res){
    res.render("register");
})
app.post("/register",function(req,res){
    var newuser= new User({username:req.body.username});
    User.register(newuser,req.body.password,function(err,user){
        if(err){
           req.flash("error",err.message);
            return res.render("register")
        }
        passport.authenticate("local")(req,res,function(){
            req.flash("success","Welcome to Yelpcamp " + user.username);
            res.redirect("/campgrounds");
        })
    })
})
app.get("/login",function(req,res){
    res.render("login")
})
app.post("/login",passport.authenticate("local",{
    successRedirect:"/campgrounds",
    failureRedirect:"/login"
}),function(req,res){
})
app.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out");
    res.redirect("/campgrounds");
})
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to be logged in");
    res.redirect("/login");
}
function checkuserownership(req,res,next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id,function(err,foundcampground){
            if(err){
                req.flash("error","Campground not found!")
                res.redirect("back");
            }else{
                if(foundcampground.author.id.equals(req.user._id)){
                    next();
                }else{
                    req.flash("error","You don't have information to do that")
                    res.redirect("back");
                }           
            }
        })
    }else{
        req.flash("error","You need to be logged in to do that");
        res.redirect("back")
    }
}
function checkcommentownership(req,res,next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id,function(err,foundcomment){
            if(err){
                req.flash("error","Comment not found!")
                res.redirect("back");
            }else{
                if(foundcomment.author.id.equals(req.user._id)){
                    next();
                }else{
                    req.flash("error","You don't have information to do that")
                    res.redirect("back");
                }           
            }
        })
    }else{
        req.flash("error","You need to be logged in to do that");   
        res.redirect("back")
    }
}
app.listen(3000,function(){
    console.log("server app is started");
});
