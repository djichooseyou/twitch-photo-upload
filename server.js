const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
   DIRECTORIES
-------------------------- */

const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");

// Ensure folders exist
[pendingDir, approvedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

/* --------------------------
   MULTER SETUP (UPLOAD)
-------------------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pendingDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + safeName);
  }
});

const upload = multer({ storage });

/* --------------------------
   MIDDLEWARE
-------------------------- */

app.use(express.static(path.join(__dirname, "public")));
app.use("/pending", express.static(pendingDir));
app.use("/approved", express.static(approvedDir));

/* --------------------------
   ROUTES
-------------------------- */

// Upload
app.post("/upload", upload.single("photo"), (req, res) => {
  res.send("Uploaded");
});

// Get pending files
app.get("/pending", (req, res) => {
  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.status(500).send("Error reading files");
    res.json(files);
  });
});

// Approve file (move to approved)
app.get("/approve/:file", (req, res) => {
  const file = decodeURIComponent(req.params.file);

  const oldPath = path.join(pendingDir, file);
  const newPath = path.join(approvedDir, file);

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      console.error("Approve error:", err);
      return res.status(500).send("Approve failed");
    }
    res.send("Approved");
  });
});

// Delete file
app.delete("/delete/:file", (req, res) => {
  const file = decodeURIComponent(req.params.file);

  const filePath = path.join(pendingDir, file);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Delete error:", err);
      return res.status(500).send("Delete failed");
    }
    res.send("Deleted");
  });
});

/* --------------------------
   START SERVER
-------------------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
