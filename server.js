const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
   CREATE FOLDERS
-------------------------- */

const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");

[pendingDir, approvedDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

/* --------------------------
   MULTER (SAFE FILENAMES)
-------------------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pendingDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "_");

    cb(null, Date.now() + "_" + safeName);
  }
});

const upload = multer({ storage });

/* --------------------------
   MIDDLEWARE
-------------------------- */

app.use(express.json());

// Serve frontend (public folder)
app.use(express.static(path.join(__dirname, "public")));

// Serve images
app.use("/pending", express.static(pendingDir));
app.use("/approved", express.static(approvedDir));

/* --------------------------
   ROUTES
-------------------------- */

// ✅ UPLOAD (NOW SAVES METADATA)
app.post("/upload", upload.single("photo"), (req, res) => {
  try {
    const name = req.body.name || "Anonymous";
    const message = req.body.message || "";
    const fileName = req.file.filename;

    const meta = {
      file: fileName,
      name,
      message,
      time: Date.now()
    };

    const metaPath = path.join(pendingDir, fileName + ".json");

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Get pending files (images only)
app.get("/pending", (req, res) => {
  fs.readdir(pendingDir, (err, files) => {
    if (err) return res.status(500).send("Error");

    const images = files.filter(f => !f.endsWith(".json"));
    res.json(images);
  });
});

// Get approved files
app.get("/approved", (req, res) => {
  fs.readdir(approvedDir, (err, files) => {
    if (err) return res.status(500).send("Error");

    const images = files.filter(f => !f.endsWith(".json"));
    res.json(images);
  });
});

/* --------------------------
   GET METADATA
-------------------------- */

app.get("/meta/:folder/:file", (req, res) => {
  const folder = req.params.folder;
  const file = decodeURIComponent(req.params.file);

  let dir;
  if (folder === "pending") dir = pendingDir;
  else if (folder === "approved") dir = approvedDir;
  else return res.status(400).send("Invalid folder");

  const metaPath = path.join(dir, file + ".json");

  if (!fs.existsSync(metaPath)) {
    return res.json({ name: "Anonymous", message: "" });
  }

  const data = JSON.parse(fs.readFileSync(metaPath));
  res.json(data);
});

/* --------------------------
   APPROVE IMAGE
-------------------------- */

app.get("/approve/:file", (req, res) => {
  const file = decodeURIComponent(req.params.file);

  const oldPath = path.join(pendingDir, file);
  const newPath = path.join(approvedDir, file);

  const oldMeta = path.join(pendingDir, file + ".json");
  const newMeta = path.join(approvedDir, file + ".json");

  if (!fs.existsSync(oldPath)) {
    return res.status(404).send("File not found");
  }

  fs.renameSync(oldPath, newPath);

  if (fs.existsSync(oldMeta)) {
    fs.renameSync(oldMeta, newMeta);
  }

  res.send("Approved");
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
  const metaPath = filePath + ".json";

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);

  res.send("Deleted");
});

/* --------------------------
   START SERVER
-------------------------- */

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
