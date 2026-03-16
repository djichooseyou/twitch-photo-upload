const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------
   CREATE UPLOAD FOLDER
-------------------------- */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

/* --------------------------
   STATIC FILES
-------------------------- */

app.use(express.static("public"));
app.use("/uploads", express.static(uploadDir));

/* --------------------------
   MULTER CONFIG
-------------------------- */

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() +
            "-" +
            Math.floor(Math.random() * 1000000) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

/* --------------------------
   UPLOAD ROUTE
-------------------------- */

app.post("/upload", upload.single("photo"), function (req, res) {

    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }

    res.json({
        success: true,
        image: "/uploads/" + req.file.filename
    });

});

/* --------------------------
   GET LATEST IMAGE
-------------------------- */

app.get("/latest", function (req, res) {

    fs.readdir(uploadDir, function (err, files) {

        if (err || files.length === 0) {
            return res.json({ image: null });
        }

        const newest = files
            .map(function(file){
                return {
                    name: file,
                    time: fs.statSync(path.join(uploadDir, file)).mtime.getTime()
                };
            })
            .sort(function(a,b){
                return b.time - a.time;
            })[0];

        res.json({
            image: "/uploads/" + newest.name
        });

    });

});

/* --------------------------
   DELETE OLD FILES (6 HOURS)
-------------------------- */

const MAX_AGE = 6 * 60 * 60 * 1000;

setInterval(function(){

    fs.readdir(uploadDir, function(err, files){

        if (err) return;

        files.forEach(function(file){

            const filePath = path.join(uploadDir, file);

            fs.stat(filePath, function(err, stat){

                if (err) return;

                const age = Date.now() - stat.mtimeMs;

                if (age > MAX_AGE) {
                    fs.unlink(filePath, function(){});
                }

            });

        });

    });

}, 30 * 60 * 1000);

/* --------------------------
   START SERVER
-------------------------- */

app.listen(PORT, function(){
    console.log("Server started on port " + PORT);
});

