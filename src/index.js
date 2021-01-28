import debug from 'debug'
import aggregator from 'xrp-price-aggregator'
import Conn from 'rippled-ws-client'
import Sign from 'rippled-ws-client-sign'
import dotenv from 'dotenv'

const log = debug('oracle:persist')

const timeout = setTimeout(() => {
  log('Error, killed by timeout')
  process.exit(1)
}, (process.env.TIMEOUT_SECONDS || 55) * 1000)

export default (async () => {  
  dotenv.config()
  const Connection = new Conn(process.env.ENDPOINT)

  log('START, GO GET DATA!')

  const data = await aggregator
  log('GOT DATA')
  log({data})

  await Connection

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
    Fee: '10',
    LimitAmount: {
      currency: 'USD',
      issuer: process.env.XRPL_DESTINATION_ACCOUNT,
      value: String(data.filteredMedian)
    },
    Memos
  }

  log('SIGN & SUBMIT')
  const Signed = await new Sign(Tx, process.env.XRPL_SOURCE_ACCOUNT_SECRET, await Connection)
  log({Signed})

  log('WRAP UP')
  ;(await Connection).close()
  clearTimeout(timeout)
})()
