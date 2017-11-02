import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import rimraf from 'rimraf'
import { updateXwingData } from './src/repo-service'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000
const temp_dir = './tmp'

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send("get pong!")
})

app.post('/', function(req, res) {
  const link_parts = req.body.link.split('/')
  const tag = link_parts[link_parts.length - 1]
  
  rimraf(temp_dir, function() {
    updateXwingData(temp_dir, tag)
  })

  res.json({
    tag: tag
  })
})

app.listen(port, function() {
  console.log(`Application is running on port ${port}`)
})
