const express = require('express')
const app = express()

const port = process.env.PORT || 3000

app.get('/', function(req, res) {
  res.send("get pong!")
})

app.post('/', function(req, res) {
  res.send("post pong!")
})

app.listen(port, function() {
  console.log("Application is running on port " + port)
})
