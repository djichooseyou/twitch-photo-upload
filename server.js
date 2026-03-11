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
 res.send("Upload received!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
 console.log("Server running on port " + PORT);
});