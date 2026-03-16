console.log("RUNNING OPTION B SERVER");

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
   CREATE FOLDERS
-------------------------- */

const uploadsDir = path.join(__dirname,"uploads");
const pendingDir = path.join(__dirname,"pending");
const approvedDir = path.join(__dirname,"approved");

[uploadsDir,pendingDir,approvedDir].forEach(dir=>{
 if(!fs.existsSync(dir)){
  fs.mkdirSync(dir);
 }
});

/* --------------------------
   STATIC FILES
-------------------------- */

app.use(express.static("public"));
app.use("/pending",express.static(pendingDir));
app.use("/approved",express.static(approvedDir));

app.use(express.urlencoded({extended:true}));

/* --------------------------
   MULTER CONFIG
-------------------------- */

const storage = multer.diskStorage({
 destination:function(req,file,cb){
  cb(null,uploadsDir);
 },
 filename:function(req,file,cb){
  cb(null,Date.now()+path.extname(file.originalname));
 }
});

const upload = multer({
 storage,
 limits:{
  fileSize: 10 * 1024 * 1024
 }
});

/* --------------------------
   UPLOAD PHOTO
-------------------------- */

app.post("/upload",upload.single("photo"),(req,res)=>{

 const username = req.body.username || "Fan";
 const message = req.body.message || "";

 const safeName = username.replace(/\s+/g,"_").replace(/__/g,"_");
const safeMessage = message.replace(/\s+/g,"_").replace(/__/g,"_");

 const newName =
 safeName+"__"+safeMessage+"__"+Date.now()+
 path.extname(req.file.originalname);

 const newPath = path.join(pendingDir,newName);

 fs.renameSync(req.file.path,newPath);

 res.send("Photo submitted for approval!");

});

/* --------------------------
   APPROVE PHOTO
-------------------------- */

app.get("/approve/:file",(req,res)=>{

 const file = req.params.file;

 const oldPath = path.join(pendingDir,file);
 const newPath = path.join(approvedDir,file);

 if(!fs.existsSync(oldPath)){
  return res.status(404).send("File not found");
 }

 fs.renameSync(oldPath,newPath);

 res.send("approved");

});

/* --------------------------
   LIST PENDING
-------------------------- */

app.get("/pending",(req,res)=>{

 fs.readdir(pendingDir,(err,files)=>{

  if(err) return res.json([]);

  const images = files.filter(file=>
   file.endsWith(".jpg") ||
   file.endsWith(".jpeg") ||
   file.endsWith(".png") ||
   file.endsWith(".webp")
  );

  res.json(images);

 });

});

/* --------------------------
   LIST APPROVED
-------------------------- */

app.get("/approved",(req,res)=>{

 fs.readdir(approvedDir,(err,files)=>{

  if(err) return res.json([]);

  const images = files.filter(file=>
   file.endsWith(".jpg") ||
   file.endsWith(".jpeg") ||
   file.endsWith(".png") ||
   file.endsWith(".webp")
  );

  res.json(images);

 });

});

/* --------------------------
   START SERVER
-------------------------- */

app.listen(PORT,()=>{
 console.log("Server running on port "+PORT);
});