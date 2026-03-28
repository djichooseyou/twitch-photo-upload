const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const sharp = require("sharp"); // ✅ NEW

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
const thumbsDir = path.join(__dirname, "thumbs"); // ✅ NEW

[pendingDir, approvedDir, thumbsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

/* --------------------------
   MULTER SETUP
-------------------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pendingDir);
  },
  filename: (req, file, cb) => {
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
app.use("/thumbs", express.static(thumbsDir)); // ✅ NEW

/* --------------------------
   ROUTES
-------------------------- */

// 🚀 Upload + Compress + Thumbnail
app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const filename = req.file.filename;

    const finalPath = path.join(pendingDir, filename);
    const thumbPath = path.join(thumbsDir, filename);

    // ✅ Compress main image
    await sharp(filePath)
      .resize(1080)
      .jpeg({ quality: 70 })
      .toFile(finalPath);

    // ✅ Create thumbnail
    await sharp(filePath)
      .resize(300)
      .jpeg({ quality: 60 })
      .toFile(thumbPath);

    // ✅ Remove original temp file
    fs.unlinkSync(filePath);

    console.log("UPLOAD:", req.body);
    res.send("Uploaded");

  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

// ⚡ Paginated pending images
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

// Approve file
app.post("/approve/:file", (req, res) => {
  const requested = req.params.file;
  const id = requested.split("__")[0];

  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.status(500).send("Error reading pending");

    const match = files.find(f => f.startsWith(id));

    if (!match) {
      console.error("File not found for ID:", id);
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