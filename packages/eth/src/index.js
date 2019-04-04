// @flow

export { default as ABI } from './abi'
export { default as BaseContract } from './Contracts/BaseContract'
export { default as EthClient } from './Client'
export { default as Web3EthAbi } from 'web3-eth-abi'
export * from './types'
export * from './utils'

export const ETH_RPC_URLS = {
  WS: {
    ropsten: 'wss://kovan.infura.io/ws/v3/8ec0911ee74c4583b1346bbc1afdf22d',
    mainnet: 'wss://mainnet.infura.io/ws/v3/8ec0911ee74c4583b1346bbc1afdf22d',
    ganache: 'ws://localhost:8545',
  },
  HTTP: {
    ropsten: 'https://kovan.infura.io/v3/8ec0911ee74c4583b1346bbc1afdf22d',
    mainnet: 'https://mainnet.infura.io/v3/8ec0911ee74c4583b1346bbc1afdf22d',
    ganache: 'http://localhost:8545',
  },
}
