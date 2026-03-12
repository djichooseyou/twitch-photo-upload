const fs = require("fs");
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

/* serve image folders */
app.use("/approved", express.static("approved"));
app.use("/pending", express.static("pending"));

/* configure uploads */
const storage = multer.diskStorage({
 destination: function(req, file, cb) {
   cb(null, "uploads/");
 },
 filename: function(req, file, cb) {
   cb(null, Date.now() + path.extname(file.originalname));
 }
});

/* upload settings */
const upload = multer({
 storage,
 limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* upload photo */
app.post("/upload", upload.single("photo"), (req, res) => {

 const username = req.body.username || "Fan";

 const safeName = username.replace(/[^a-z0-9]/gi,"_");

 const newName =
  safeName + "_" + Date.now() + path.extname(req.file.originalname);

 const newPath = path.join(__dirname,"pending",newName);

 fs.renameSync(req.file.path,newPath);

 res.send("Photo submitted for approval!");

});

/* approve photo */
app.get("/approve/:file",(req,res)=>{

 const file=req.params.file;

 const oldPath=path.join(__dirname,"pending",file);
 const newPath=path.join(__dirname,"approved",file);

 if(!fs.existsSync(oldPath)){
  return res.status(404).send("File not found");
 }

 fs.renameSync(oldPath,newPath);

 res.send("approved");

});

/* list pending photos */
app.get("/pending",(req,res)=>{

 fs.readdir("./pending",(err,files)=>{

  if(err) return res.json([]);

  const images = files.filter(file =>
   file.endsWith(".jpg") ||
   file.endsWith(".jpeg") ||
   file.endsWith(".png") ||
   file.endsWith(".webp")
  );

  res.json(images);

 });

});

/* list approved photos */
app.get("/approved",(req,res)=>{

 fs.readdir("./approved",(err,files)=>{

  if(err) return res.json([]);

  const images = files.filter(file =>
   file.endsWith(".jpg") ||
   file.endsWith(".jpeg") ||
   file.endsWith(".png") ||
   file.endsWith(".webp")
  );

  res.json(images);

 });

});

/* start server */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
 console.log("Server running on port " + PORT);
});