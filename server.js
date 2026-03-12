const fs = require("fs");
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use("/approved", express.static("approved"));
app.use("/pending", express.static("pending"));

const storage = multer.diskStorage({
 destination: function(req, file, cb) {
   cb(null, "uploads/");
 },
 filename: function(req, file, cb) {
   cb(null, Date.now() + path.extname(file.originalname));
 }
});

const upload = multer({ storage });

/* Upload photo */
app.post("/upload", upload.single("photo"), (req, res) => {

 const username = req.body.username || "Fan";

 const safeName = username.replace(/[^a-z0-9]/gi,"_");

 const newName = safeName + "_" + Date.now() + path.extname(req.file.originalname);

 const newPath = path.join(__dirname,"pending",newName);

 fs.renameSync(req.file.path,newPath);

 res.send("Photo submitted for approval!");

});

/* Approve photo */
app.get("/approved",(req,res)=>{

 fs.readdir("./approved",(err,files)=>{

  const images = files.filter(file =>
   file.endsWith(".jpg") ||
   file.endsWith(".jpeg") ||
   file.endsWith(".png") ||
   file.endsWith(".webp")
  );

  res.json(images);

 });

});

/* List pending photos */
app.get("/pending",(req,res)=>{

 fs.readdir("./pending",(err,files)=>{

  const images = files.filter(file =>
   file.endsWith(".jpg") ||
   file.endsWith(".jpeg") ||
   file.endsWith(".png") ||
   file.endsWith(".webp")
  );

  res.json(images);

 });

});

/* List approved photos */
app.get("/approved",(req,res)=>{

 fs.readdir("./approved",(err,files)=>{
  res.json(files);
 });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
 console.log("Server running on port " + PORT);
});