// @flow

import { Environment } from '@mainframe/config'
import debug from 'debug'

import ServerHandler from './ServerHandler'

const log = debug('mainframe:daemon:rpc')

const servers: { [envName: string]: ServerHandler } = {}

export const start = async (envName: string): Promise<void> => {
  log('start server using environment', envName)
  let server = servers[envName]
  if (server == null) {
    const env = Environment.load(envName)
    server = new ServerHandler(env)
    servers[envName] = server
  }
  await server.start()
}

export const stop = async (envName: string): Promise<void> => {
  log('stop server using environment', envName)
  const server = servers[envName]
  if (server != null) {
    await server.stop()
  }
}

export const isListening = (envName: string): boolean => {
  const server = servers[envName]
  return server == null ? false : server.listening
}
