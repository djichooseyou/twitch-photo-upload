const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
PATHS
-------------------------- */

const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");
const publicDir = path.join(__dirname, "public");

/* --------------------------
ENSURE FOLDERS EXIST
-------------------------- */

[pendingDir, approvedDir, publicDir].forEach(dir => {
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir);
}
});

/* --------------------------
🔥 STATIC FILES (FIXES YOUR ERROR)
-------------------------- */

app.use(express.static(publicDir));

/* --------------------------
MULTER SET
