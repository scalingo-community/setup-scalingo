import * as core from '@actions/core'
import { clientFromToken } from 'scalingo'
import type ScalingoClient 'scalingo'

async function scalingoClient(): Promise<ScalingoClient> {
  core.debug(`Initializing Scalingo Client with token...`)

  const apiToken = core.getInput('api_token', { required: true })
  const client = await clientFromToken(apiToken, {})

  core.debug(`Scalingo Client is initialized.`)
  return client
}

async function run(): Promise<void> {
  try {
    const client = await scalingoClient()
    const appId = core.getInput('app_name', { required: true })
    const branch = core.getInput('branch', { required: true })

    if (await client.SCMRepoLinks.find(appId)){
      core.debug(`One SCM Repo Link is found for ${appId}. Using it for deployment.`)
      await client.SCMRepoLinks.manualDeploy(appId, branch)
    }
    else {
      core.debug(`No SCM Repo Link is found for ${appId}. Using deployment by source_url`)
      
    }

    // Wait for the deployment to be finished
    const deployment = 
      await client.Apps.deploymentListener(appId).then((listener) => {
        listener.onOpen(function() {
          console.log('Connection opened')
        })
        listener.onClose(function() {
          console.log('Connection closed')
        
        })
    
        listener.onStatus(function(status: string) {
          if (status === 'success') {
            core.info('Deployment success')
          } else if (status === 'crashed-error') {
            core.error('Deployment failure')
          } else if (status === 'timeout-error') {
            core.error('Deployment failure')
          } else if (status === 'build-error') {
            core.error('Deployment failure')
          } else if (status === 'aborted') {
            core.error('Deployment failure')
          } else {
            core.info(`Deployment status: ${status}`)
          }
        })
    
        listener.onLog(function(log) {
          console.log('New log', log)
        })
    
        listener.onNew(function(d) {
          console.log('New new', d)
        })
      })



    await client.Deployments.create(appId, { git_ref: branch })

    core.debug(`Waiting ${ms} milliseconds ...`)

    core.debug(new Date().toTimeString())
    await new Promise(resolve => setTimeout(resolve, Number(ms)))
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
