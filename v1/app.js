var express=require('express');
var app=express();
var bodyparser=require("body-parser");
app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine","ejs");
var campgrounds=[
    {name :"salmon greek",image:"https://blog.thomascook.in/wp-content/uploads/2017/09/shutterstock_379283767-Medium-1024x737.jpg"},
    {name:"grantie hill",image:"https://blog.thomascook.in/wp-content/uploads/2017/09/shutterstock_152947547-Medium-1024x686.jpg"},
    {name:"mountain goot",image:"https://www.holidify.com/images/bgImages/MANALI.jpg"}
];
app.get("/",function(req,res){
    res.render("landing");
});
app.get("/campgrounds",function(req,res){
        
        res.render("campgrounds",{campgrounds:campgrounds});
});
app.post("/campgrounds",function(req,res){
    //get dfata from the form and to the  campground array
    var name=req.body.name;
    var image=req.body.image;
    var newcampground={name:name,image:image};
    campgrounds.push(newcampground);
    //redirect it to campgrounds page
    res.redirect("/campgrounds");
});
app.get("/campgrounds/new",function(req,res){
    res.render("new");
});
app.listen(3000,function(){
    console.log("server app is started");
});
