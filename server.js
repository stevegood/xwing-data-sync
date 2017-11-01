const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send("get pong!")
})

app.post('/', function(req, res) {
  console.log(req.body)
  res.send("post pong!")
})

app.listen(port, function() {
  console.log("Application is running on port " + port)
})
