</> JavaScript
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json())

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  }
})

const upload = multer({ storage: storage })

app.post('/upload', upload.single('photo'), (req, res) => {
  res.send({ status: 'uploaded' })
})

app.use('/uploads', express.static('uploads'))

app.listen(3000, () => {
  console.log("Server running")
})
