import fs from 'fs'
import Git from 'nodegit'
import path from 'path'

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
    const author = Git.Signature.now('Steve Good', 'sgood@lanctr.com')
    const committer = Git.Signature.now('Steve Good', 'sgood@lanctr.com')
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
    
    const commitOid = await repo.createCommitOnHead(
      [path.join('.', 'xwing-data')],
      author,
      committer,
      `Updating to xwing-data ${tag}`
    )
    
    console.log(`New commit: ${commitOid.toString()}`)
  
    // only push if the flag is true
    if (push) {
      console.log('Preparing to tag and release...')
      
      console.log('Loading package.json...')
      const package_json_path = path.join(__dirname, '..', temp_dir, 'package.json')
      let package_json_txt = fs.readFileSync(package_json_path)
      const package_json = JSON.parse(package_json_txt)
      package_json.version = `${tag}`
      
      console.log(`Writing version '${tag}' into package.json...`)
      fs.writeFileSync(package_json_path, JSON.stringify(package_json, null, '  '))
      
      console.log('Adding commit for version change...')
      const tagCommitOid = await repo.createCommitOnHead(
        [path.join('.', 'package.json')],
        author,
        committer,
        `Setting version to ${tag}`
      )
      console.log(`New commit: ${tagCommitOid.toString()}`)

      console.log(`Tagging repo with '${tag}'...`)
      const tagRef = await repo.createLightweightTag(tagCommitOid.toString(), tag)
      console.log(`Created tag: ${tagRef.toString()}`)

      // get the remote
      const remote = await repo.getRemote('origin')

      console.log('Pushing commits and tags...')
      const pushResult = await remote.push(
        [
          'refs/heads/master:refs/heads/master',
          tagRef.toString()
        ]
      )
      
      console.log('Done!')
    }
  }
}

export {
  updateXwingData
}
