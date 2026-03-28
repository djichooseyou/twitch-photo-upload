const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const sharp = require("sharp");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
   MIDDLEWARE
-------------------------- */

app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* --------------------------
   DIRECTORIES
-------------------------- */

const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");
const thumbsDir = path.join(__dirname, "thumbs");
const tempDir = path.join(__dirname, "temp"); // ✅ NEW

[pendingDir, approvedDir, thumbsDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

/* --------------------------
   MULTER (TEMP UPLOAD)
-------------------------- */

const upload = multer({ dest: tempDir }); // ✅ FIXED

/* --------------------------
   STATIC FILES
-------------------------- */

app.use(express.static(path.join(__dirname, "public")));
app.use("/pending", express.static(pendingDir));
app.use("/approved", express.static(approvedDir));
app.use("/thumbs", express.static(thumbsDir));

/* --------------------------
   ROUTES
-------------------------- */

// 🚀 Upload (FIXED WITH TEMP + SHARP)
app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const tempPath = req.file.path;

    const username = encodeURIComponent(req.body.username || "anon");
    const message = encodeURIComponent(req.body.message || "nomsg");

    const safeName = `${Date.now()}__${username}__${message}__${req.file.originalname}`;

    const finalPath = path.join(pendingDir, safeName);
    const thumbPath = path.join(thumbsDir, safeName);

    // ✅ FULL IMAGE (compressed)
    await sharp(tempPath)
      .resize(1080)
      .jpeg({ quality: 70 })
      .toFile(finalPath);

    // ✅ THUMBNAIL
    await sharp(tempPath)
      .resize(300)
      .jpeg({ quality: 60 })
      .toFile(thumbPath);

    // ✅ REMOVE TEMP FILE
    fs.unlinkSync(tempPath);

    console.log("UPLOAD:", safeName);
    res.send("Uploaded");

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).send("Upload failed");
  }
});

// ⚡ Paginated pending list
app.get("/pending", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.status(500).send("Error reading files");

    files.sort((a, b) => b.localeCompare(a));

    const start = (page - 1) * limit;
    const paginated = files.slice(start, start + limit);

    res.json(paginated);
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

// ✅ APPROVE
app.post("/approve/:file", (req, res) => {
  const requested = req.params.file;
  const id = requested.split("__")[0];

  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.status(500).send("Error reading pending");

    const match = files.find(f => f.startsWith(id));

    if (!match) {
      console.error("File not found:", id);
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

// ❌ DELETE
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