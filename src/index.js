import debug from 'debug'
import aggregator from 'xah-price-aggregator'
import {XrplClient} from 'xrpl-client'
import {utils, signAndSubmit, derive} from 'xrpl-accountlib'
import dotenv from 'dotenv'

const log = debug('oracle:persist')
log(process.env.XRPL_SOURCE_ACCOUNT_SECRET)
const keypair = derive.familySeed(process.env.XRPL_SOURCE_ACCOUNT_SECRET)

const timeoutSec = (process.env.TIMEOUT_SECONDS || 55)
const timeout = setTimeout(() => {
  log(`Error, killed by timeout after ${timeoutSec} seconds`)
  process.exit(1)
}, timeoutSec * 1000)

export default (async () => {  
  dotenv.config()
  const Connection = new XrplClient(process.env.ENDPOINT)
  const networkInfo  = await utils.txNetworkAndAccountValues(Connection, process.env.XRPL_SOURCE_ACCOUNT)

  log(`START (timeout at ${timeoutSec}), GO GET DATA!`)

  const data = await aggregator
  log('GOT DATA')
  log({data})

  const Memos = Object.keys(data.rawResultsNamed).map(k => {
    return {
      Memo: {
        MemoData: Buffer.from(data.rawResultsNamed[k].map(_v => String(_v)).join(';'), 'utf-8').toString('hex').toUpperCase(),
        MemoFormat: Buffer.from('text/csv', 'utf-8').toString('hex').toUpperCase(),
        MemoType: Buffer.from('rates:' + k, 'utf-8').toString('hex').toUpperCase()
      }
    }
  })

  const Tx = {
    TransactionType: 'TrustSet',
    Account: process.env.XRPL_SOURCE_ACCOUNT,
    Flags: 131072,
    NetworkID: Number(process.env.NETWORK_ID || 0) >= 1024 ? Number(process.env.NETWORK_ID || 0) : undefined,
    LimitAmount: {
      currency: 'USD',
      issuer: process.env.XRPL_DESTINATION_ACCOUNT,
      value: String(data.filteredMedian)
    },
    Memos,
    // Add: Sequence, Account, LastLedgerSequence, Fee (in case Hooks enabled: autodetect (from ledger))
    ...networkInfo.txValues,
    Fee: '100',
  }

  log('SIGN & SUBMIT', JSON.stringify(Tx, null, 2))
  try {
    const Signed = await signAndSubmit(Tx, Connection, keypair)
    log({Signed})
  } catch (e) {
    log(`Error signing / submitting: ${e.message}`)
  }

  if (typeof process.env.ENDPOINT_TESTNET !== 'undefined') {
    log('SIGN & SUBMIT TESTNET')
    const ConnectionTestnet = await new XrplClient(process.env.ENDPOINT_TESTNET)
    const networkInfo  = await utils.txNetworkAndAccountValues(ConnectionTestnet, process.env.XRPL_SOURCE_ACCOUNT)

    Object.assign(Tx, {
      // Add: Sequence, Account, LastLedgerSequence, Fee (in case Hooks enabled: autodetect (from ledger))
      ...networkInfo.txValues,
    })

    try {
      const SignedTestnet = await signAndSubmit(Tx, ConnectionTestnet, keypair)
      log({SignedTestnet})
    } catch (e) {
      log(`Error signing / submitting @ Testnet: ${e.message}`)
    }
    ;(await ConnectionTestnet).close()
  }

  log('WRAP UP')
  ;(await Connection).close()
  clearTimeout(timeout)
})()
