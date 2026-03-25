const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
   CREATE FOLDERS
-------------------------- */

const uploadsDir = path.join(__dirname, "uploads");
const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");

[uploadsDir, pendingDir, approvedDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

/* --------------------------
   MULTER STORAGE (SAFE NAMES)
-------------------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pendingDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "_"); // REMOVE BAD CHARACTERS

    cb(null, Date.now() + "_" + safeName);
  }
});

const upload = multer({ storage });

/* --------------------------
   MIDDLEWARE
-------------------------- */

app.use(express.json());

// Serve images
app.use("/pending", express.static(pendingDir));
app.use("/approved", express.static(approvedDir));

/* --------------------------
   ROUTES
-------------------------- */

// Upload
app.post("/upload", upload.single("photo"), (req, res) => {
  res.json({ success: true });
});

// Get pending files
app.get("/pending", (req, res) => {
  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.status(500).send("Error reading pending folder");
    res.json(files);
  });
});

// Get approved files
app.get("/approved", (req, res) => {
  fs.readdir(approvedDir, (err, files) => {
    if (err) return res.status(500).send("Error reading approved folder");
    res.json(files);
  });
});

/* --------------------------
   APPROVE IMAGE
-------------------------- */

app.get("/approve/:file", (req, res) => {
  const file = decodeURIComponent(req.params.file);

  const oldPath = path.join(pendingDir, file);
  const newPath = path.join(approvedDir, file);

  if (!fs.existsSync(oldPath)) {
    return res.status(404).send("File not found");
  }

  fs.rename(oldPath, newPath, err => {
    if (err) return res.status(500).send("Error moving file");
    res.send("Approved");
  });
});

/* --------------------------
   DELETE IMAGE
-------------------------- */

app.delete("/delete/:folder/:file", (req, res) => {
  const folder = req.params.folder;
  const file = decodeURIComponent(req.params.file);

  let dir;

  if (folder === "pending") dir = pendingDir;
  else if (folder === "approved") dir = approvedDir;
  else return res.status(400).send("Invalid folder");

  const filePath = path.join(dir, file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  fs.unlink(filePath, err => {
    if (err) return res.status(500).send("Delete failed");
    res.send("Deleted");
  });
});

/* --------------------------
   START SERVER
-------------------------- */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
