import Git from 'nodegit'
import path from 'path'
import shell from 'shelljs'

const updateXwingData = async (temp_dir, tag) => {
  const username = process.env.USERNAME
  const password = process.env.PASSWORD
  const push = process.env.PUSH || false
  const repo_url = 'github.com/stevegood/xwing-data-module.git'
  const gh_xdm_repo = `https://${username}:${password}@${repo_url}`

  console.log(`Cloning https://${repo_url}`)
  const repo = await Git.Clone(gh_xdm_repo, temp_dir)
  console.log(`Cloned https://${repo_url}`)
  
  const tags = await Git.Tag.list(repo)
  const has_tag_already = tags.filter( t => t === tag ).length === 1

  if (has_tag_already) {
    console.log(`This repo already has a tag named ${tag}. Skipping doing any other work...`)
  } else {
    const submoduleNames = await repo.getSubmoduleNames()
    
    if (submoduleNames.length === 0) return
  
    const submoduleName = submoduleNames[0]
    
    console.log(`Looking up submodule ${submoduleName}`)
    const submodule = await Git.Submodule.lookup(repo, submoduleName)
    
    console.log(`Working with submodule ${submodule.name()}`)
    await submodule.init(1)
    await submodule.update(1, new Git.SubmoduleUpdateOptions())
  
    console.log("Submodule should be ready to work with now...")
    const xd_repo = await submodule.open()
  
    const xd_tag = await xd_repo.getTagByName(tag)
    const hash = xd_tag.targetId().toString()
    
    console.log(`Checking out hash ${hash}`)
    await Git.Checkout.tree(xd_repo, hash)
    xd_repo.setHeadDetached(hash)
    console.log(`Checked out at ${tag} (${hash})`)
  
    console.log('Refreshing the main repo index...')
    const index = await repo.refreshIndex()
    
    console.log('Adding all changes to index')
    await index.addByPath(path.join('.', 'xwing-data'))
    await index.write()
    const oidResult = await index.writeTree()
    const head = await Git.Reference.nameToId(repo, 'HEAD')
    const parent = await repo.getCommit(head)
    
    const commit_msg = `Updating to xwing-data ${tag}`
    console.log(`Adding commit with message "${commit_msg}"`)
    const author = Git.Signature.now('Steve Good', 'sgood@lanctr.com')
    const committer = Git.Signature.now('Steve Good', 'sgood@lanctr.com')
    const commitId = await repo.createCommit('HEAD', author, committer, commit_msg, oidResult, [parent])
    console.log(`New commit: ${commitId}`)
  
    // only push if the flag is true
    if (push) {
      console.log('Tagging and releasing...')
      shell.cd(temp_dir)
      const exec_opts = {
        async: false,
        silent: false
      }
      shell.exec('pwd', exec_opts)
      shell.exec('ls', exec_opts)
      console.log('Having yarn install modules...')
      shell.exec('yarn', exec_opts)
      shell.exec('ls', exec_opts)
      shell.exec('ls node_modules', exec_opts)
      shell.exec('ls node_modules/.bin', exec_opts)
  
      console.log('Running release-it...')
      // shell.exec(`node_modules/.bin/release-it ${tag} --non-interactive`, exec_opts)
      shell.cd('../')
      console.log('Done!')
    }
  }
}

export {
  updateXwingData
}
