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
const safeName = Date.now() + "_" + file.originalname;
cb(null, safeName);
}
});

const upload = multer({ storage });

/* --------------------------
HELPERS
-------------------------- */

function fullyDecode(str) {
try {
return decodeURIComponent(decodeURIComponent(str));
} catch {
return decodeURIComponent(str);
}
}

/* --------------------------
ROUTES
-------------------------- */

// Upload
app.post("/upload", upload.single("photo"), (req, res) => {
res.send("Upload successful");
});

// Get pending files
app.get("/pending", (req, res) => {
fs.readdir(pendingDir, (err, files) => {
if (err) return res.status(500).send("Error reading folder");
res.json(files);
});
});

// Serve pending images
app.use("/pending", express.static(pendingDir));

// Serve approved images
app.use("/approved", express.static(approvedDir));

/* --------------------------
APPROVE (FIXED)
-------------------------- */

app.post("/approve/:filename", (req, res) => {
try {
const filename = fullyDecode(req.params.filename);

```
const oldPath = path.join(pendingDir, filename);
const newPath = path.join(approvedDir, filename);

if (!fs.existsSync(oldPath)) {
  console.log("NOT FOUND:", oldPath);
  return res.status(404).send("File not found");
}

fs.rename(oldPath, newPath, (err) => {
  if (err) {
    console.error("MOVE ERROR:", err);
    return res.status(500).send("Move failed");
  }

  res.sendStatus(200);
});
```

} catch (err) {
console.error("APPROVE ERROR:", err);
res.status(500).send("Server error");
}
});

/* --------------------------
DELETE (FIXED)
-------------------------- */

app.delete("/delete/:filename", (req, res) => {
try {
const filename = fullyDecode(req.params.filename);

```
const filePath = path.join(pendingDir, filename);

if (!fs.existsSync(filePath)) {
  console.log("DELETE NOT FOUND:", filePath);
  return res.status(404).send("File not found");
}

fs.unlink(filePath, (err) => {
  if (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).send("Delete failed");
  }

  res.sendStatus(200);
});
```

} catch (err) {
console.error("DELETE ROUTE ERROR:", err);
res.status(500).send("Server error");
}
});

/* --------------------------
START SERVER
-------------------------- */

app.listen(PORT, () => {
console.log("Server running on port " + PORT);
});
