const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const Git = require('nodegit')
const rimraf = require('rimraf')

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send("get pong!")
})

app.post('/', function(req, res) {
  const link_parts = req.body.link.split('/')
  const tag = link_parts[link_parts.length - 1]
  
  rimraf('./tmp', function() {
    updateXwingData(tag)
  })

  res.json({
    tag: tag
  })
})

async function updateXwingData(tag) {
  const username = process.env.USERNAME
  const password = process.env.PASSWORD
  const repo_url = 'github.com/stevegood/xwing-data-module.git'
  const gh_xdm_repo = 'https://' + username + ':' + password + '@' + repo_url

  const repo = await Git.Clone(gh_xdm_repo, './tmp')
  
  console.log("Cloned https://" + repo_url)
  const submoduleNames = await repo.getSubmoduleNames()
  
  if (submoduleNames.length === 0) return

  const submoduleName = submoduleNames[0]
  
  console.log("Looking up submodule " + submoduleName)
  const submodule = await Git.Submodule.lookup(repo, submoduleName)
  
  console.log("Working with submodule " + submodule.name())
  await submodule.init(1)
  await submodule.update(1, new Git.SubmoduleUpdateOptions())

  console.log("Submodule should be ready to work with now...")
  const xd_repo = await submodule.open()

  const xd_tag = await xd_repo.getTagByName(tag)
  console.log(xd_tag.targetId().toString())
  await Git.Checkout.tree(xd_repo, xd_tag.targetId(), {
    checkoutStrategy: Git.Checkout.STRATEGY.SAFE_CREATE
  })
  xd_repo.setHeadDetached(
    xd_tag.targetId(),
    xd_repo.defaultSignature,
    "Checkout: HEAD " + xd_tag.targetId()
  )
  console.log("Should be checked out at " + tag)
}

app.listen(port, function() {
  console.log("Application is running on port " + port)
})
