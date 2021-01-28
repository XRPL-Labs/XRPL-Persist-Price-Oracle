# Persist XRP-USD rate on the XRPL

Persists the data fetched with [XRP-Price-Aggregator](https://github.com/XRPL-Labs/XRP-Price-Aggregator) on the XRP
Ledger. This data is persisted by xrpl-labs.com on [`rXUMMaPpZqPutoRszR29jtC8amWq3APkx`](https://bithomp.com/explorer/rXUMMaPpZqPutoRszR29jtC8amWq3APkx).

Fetch the XRP-USD rate live from the XRPL with this command (XRPL WebSocket Node connection required, eg. using xrpl.ws)

```json
{
  "command": "account_lines",
  "account": "rXUMMaPpZqPutoRszR29jtC8amWq3APkx"
}
```

The account (`rXUMMaPpZqPutoRszR29jtC8amWq3APkx`) history will show you the source data (using CSV in Memo's)
