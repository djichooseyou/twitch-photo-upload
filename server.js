const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
   FOLDERS
-------------------------- */

const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");

[pendingDir, approvedDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

/* --------------------------
   MULTER SETUP
-------------------------- */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pendingDir);
  },
  filename: function (req, file, cb) {

    const ext = path.extname(file.originalname);

    const username = (req.body.username || "user")
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "");

    const message = (req.body.message || "no_message")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");

    const filename = `${username}__${message}_${Date.now()}${ext}`;

    cb(null, filename);
  }
});

const upload = multer({ storage });

/* --------------------------
   MIDDLEWARE
-------------------------- */

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* --------------------------
   ROUTES
-------------------------- */

// Upload
app.post("/upload", upload.single("photo"), (req, res) => {
  res.send("Uploaded!");
});

// Get approved photos
app.get("/approved", (req, res) => {
  fs.readdir(approvedDir, (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

// Serve approved images
app.use("/approved", express.static(approvedDir));

// Approve endpoint (move from pending → approved)
app.post("/approve/:file", (req, res) => {

  const file = req.params.file;

  const from = path.join(pendingDir, file);
  const to = path.join(approvedDir, file);

  if (!fs.existsSync(from)) {
    return res.status(404).send("File not found");
  }

  fs.renameSync(from, to);

  res.send("Approved");
});

/* --------------------------
   START SERVER
-------------------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
