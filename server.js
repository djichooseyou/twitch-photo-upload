const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
   MIDDLEWARE (IMPORTANT)
-------------------------- */

// ✅ Needed so multer can read text fields (username/message)
app.use(express.urlencoded({ extended: true }));

// ✅ CORS
app.use(cors());

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

    // ✅ Get username + message safely
const username = encodeURIComponent(req.body.username || "anon");
const message = encodeURIComponent(req.body.message || "nomsg");

    const filename = `${Date.now()}__${username}__${message}__${file.originalname}`;

    cb(null, filename);
  }
});

const upload = multer({ storage });

/* --------------------------
   STATIC FILES
-------------------------- */

app.use(express.static(path.join(__dirname, "public")));
app.use("/pending", express.static(pendingDir));
app.use("/approved", express.static(approvedDir));

/* --------------------------
   ROUTES
-------------------------- */

// Upload
app.post("/upload", upload.single("photo"), (req, res) => {
  console.log("UPLOAD:", req.body); // 👈 helpful for testing
  res.send("Uploaded");
});

// Get pending files
app.get("/pending", (req, res) => {
  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.status(500).send("Error reading files");
    res.json(files);
  });
});

// Approved list (images only)
app.get("/approved-list", (req, res) => {
  fs.readdir(approvedDir, (err, files) => {
    if (err) return res.status(500).send("Error reading folder");

    const images = files.filter(file =>
      file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );

    res.json(images);
  });
});

// Full approved list
app.get("/approved", (req, res) => {
  fs.readdir(approvedDir, (err, files) => {
    if (err) return res.status(500).send("Error reading approved files");
    res.json(files);
  });
});

// Approve file
app.get("/approve/:file", (req, res) => {

  let requested = req.params.file;

  // Decode safely (once or twice)
  try {
    requested = decodeURIComponent(requested);
    requested = decodeURIComponent(requested);
  } catch (e) {}

  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.status(500).send("Error reading pending");

    // 🔥 Find exact match
    const match = files.find(f => f.includes(requested.split("__")[0]));

    if (!match) {
      console.error("File not found:", requested);
      return res.status(404).send("File not found");
    }

    const oldPath = path.join(pendingDir, match);
    const newPath = path.join(approvedDir, match);

    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        console.error("Approve error:", err);
        return res.status(500).send("Approve failed");
      }
      res.send("Approved");
    });
  });
});

// Delete file
app.delete("/delete/:file", (req, res) => {
  const file = req.params.file;

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