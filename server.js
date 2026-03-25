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
   MULTER STORAGE
-------------------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pendingDir); // ✅ uploads go to pending
  },
  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname);

    const username = (req.body.username || "user")
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "");

    const rawMessage = req.body.message || "";
    const encodedMessage = encodeURIComponent(rawMessage);

    const filename = `${username}__${encodedMessage}_${Date.now()}${ext}`;

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
  if (!req.file) {
    return res.status(400).send("Upload failed");
  }
  res.send("Uploaded");
});

// Get approved files
app.get("/approved", (req, res) => {
  fs.readdir(approvedDir, (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

// Get pending files
app.get("/pending", (req, res) => {
  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

// Serve images
app.use("/approved", express.static(approvedDir));
app.use("/pending", express.static(pendingDir));

// ✅ APPROVE (NO DECODE — IMPORTANT)
app.post("/approve/:file", (req, res) => {

  const file = decodeURIComponent(req.params.file);

  const from = path.join(pendingDir, file);
  const to = path.join(approvedDir, file);

  if (!fs.existsSync(from)) {
    return res.status(404).send("File not found");
  }

  fs.renameSync(from, to);

  res.send("Approved");
});

// ❌ DELETE (DECLINE)
app.delete("/delete/:file", (req, res) => {

  const file = decodeURIComponent(req.params.file);

  const filePath = path.join(pendingDir, file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  fs.unlinkSync(filePath);

  res.send("Deleted");
});

/* --------------------------
   START SERVER
-------------------------- */

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
