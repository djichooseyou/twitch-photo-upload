const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const pendingDir = path.join(__dirname, "pending");
const approvedDir = path.join(__dirname, "approved");
const publicDir = path.join(__dirname, "public");

// Ensure folders exist
[pendingDir, approvedDir, publicDir].forEach(dir => {
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir);
}
});

// Serve frontend files
app.use(express.static(publicDir));

// Upload setup
const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, pendingDir),
filename: (req, file, cb) => {
cb(null, Date.now() + "_" + file.originalname);
}
});

const upload = multer({ storage });

// Fix double-encoded filenames
function fullyDecode(str) {
try {
return decodeURIComponent(decodeURIComponent(str));
} catch {
return decodeURIComponent(str);
}
}

// Home route
app.get("/", (req, res) => {
res.sendFile(path.join(publicDir, "dashboard.html"));
});

// Upload route
app.post("/upload", upload.single("photo"), (req, res) => {
res.send("Upload successful");
});

// Get pending files
app.get("/pending", (req, res) => {
fs.readdir(pendingDir, (err, files) => {
if (err) {
return res.status(500).send("Error reading folder");
}
res.json(files);
});
});

// Serve images
app.use("/pending", express.static(pendingDir));
app.use("/approved", express.static(approvedDir));

// Approve file
app.post("/approve/:filename", (req, res) => {
try {
const filename = fullyDecode(req.params.filename);

```
const oldPath = path.join(pendingDir, filename);
const newPath = path.join(approvedDir, filename);

if (!fs.existsSync(oldPath)) {
  return res.status(404).send("File not found");
}

fs.rename(oldPath, newPath, err => {
  if (err) {
    return res.status(500).send("Move failed");
  }
  res.sendStatus(200);
});
```

} catch (err) {
res.status(500).send("Server error");
}
});

// Delete file
app.delete("/delete/:filename", (req, res) => {
  try {
    const filename = fullyDecode(req.params.filename);
    const filePath = path.join(pendingDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    fs.unlink(filePath, err => {
      if (err) {
        return res.status(500).send("Delete failed");
      }
      res.sendStatus(200);
    });

  } catch (err) {
    res.status(500).send("Server error");
  }
});
// Start server
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
