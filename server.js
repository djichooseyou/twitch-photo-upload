const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");

[pendingDir, approvedDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pendingDir);
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

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/upload", upload.single("photo"), (req, res) => {

  if (!req.file) {
    return res.status(400).send("Upload failed");
  }

  res.send("Uploaded");
});

app.get("/approved", (req, res) => {
  fs.readdir(approvedDir, (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

app.use("/approved", express.static(approvedDir));

app.post("/approve/:file", (req, res) => {

  const from = path.join(pendingDir, req.params.file);
  const to = path.join(approvedDir, req.params.file);

  if (!fs.existsSync(from)) {
    return res.status(404).send("Not found");
  }

  fs.renameSync(from, to);

  res.send("Approved");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
