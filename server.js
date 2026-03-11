const fs = require("fs");
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.static("public"));

const storage = multer.diskStorage({
 destination: function(req, file, cb) {
   cb(null, "uploads/");
 },
 filename: function(req, file, cb) {
   cb(null, Date.now() + path.extname(file.originalname));
 }
});

const upload = multer({ storage });

app.post("/upload", upload.single("photo"), (req, res) => {

 const pendingPath = path.join(__dirname, "pending", req.file.filename);

 fs.renameSync(req.file.path, pendingPath);

 res.send("Photo submitted for approval!");

});

app.get("/approve/:file",(req,res)=>{

 const file=req.params.file;

 const oldPath=path.join(__dirname,"pending",file);
 const newPath=path.join(__dirname,"approved",file);

 fs.renameSync(oldPath,newPath);

 res.send("approved");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
 console.log("Server running on port " + PORT);
});
