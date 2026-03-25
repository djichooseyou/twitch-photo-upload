const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// FOLDERS
const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");
const publicDir = path.join(__dirname, "public");

// ENSURE FOLDERS EXIST
[pendingDir, approvedDir, publicDir].forEach(dir => {
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir);
}
});

// STATIC FILES
app.use(express.static(publicDir));

// MULTER SETUP
const storage = multer.diskStorage({
destination: (req, file, cb) => {
cb(null, pendingDir);
},
filename: (req, file, cb) => {
const safeName = Date.now() + "_" + file.originalname;
cb(null, safeName);
}
});

const upload = multer({ storage });

// DOUBLE DECODE FIX
function fullyDecode(str) {
try {
return decodeURIComponent(decodeURIComponent(str));
} catch (e) {
return decodeURIComponent(str);
}
}

// ROOT → dashboard
app.get("/", (req, res) => {
res.sendFile(path.join(publicDir, "dashboard.html"));
});

// UPLOAD
app.post("/upload", upload.single("photo"), (req, res) => {
res.send("Upload successful");
});

// GET PENDING
app.get("/pending", (req, res) => {
fs.readdir(pendingDir, (err, files) => {
if (err) return res.status(500
