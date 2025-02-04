export const COIN_TYPE = Object.freeze({
  NATIVE: 'NATIVE',
  ETH_TOKEN: 'ETH_TOKEN',
  BNB_TOKEN: 'BNB_TOKEN',
  MATIC_TOKEN: 'MATIC_TOKEN',
})

export const TOKEN_STANDARD = Object.freeze({
  ERC20: 'ERC20',
  BEP20: 'BEP20',
  ERC20MATIC: 'ERC20MATIC'
})

export const BLOCKCHAIN = Object.freeze({
  BTC: 'BTC',
  GHOST: 'GHOST',
  NEXT: 'NEXT',
  ETH: 'ETH',
  BNB: 'BNB', // TODO: rename with BSC
  MATIC: 'MATIC',
})

export const BASE_TOKEN_CURRENCY = Object.freeze({
  ETH: 'ETH',
  BNB: 'BNB',
  MATIC: 'MATIC'
})

export const COIN_MODEL = Object.freeze({
  UTXO: 'UTXO', // Unspent Transaction Outputs model
  AB: 'AB' // Account/Balance model
})

// TODO: change this structure
// 1) here isn't only coins (rename it?)
// 2) we can't add currencies with identical names
//    example: identical tokens but on different blockchains
export const COIN_DATA = {
  'BTC': {
    ticker: 'BTC',
    name: 'Bitcoin',
    type: COIN_TYPE.NATIVE,
    blockchain: BLOCKCHAIN.BTC,
    model: COIN_MODEL.UTXO,
    precision: 8,
  },
  'ETH': {
    ticker: 'ETH',
    name: 'Ethereum',
    type: COIN_TYPE.NATIVE,
    blockchain: BLOCKCHAIN.ETH,
    model: COIN_MODEL.AB,
    precision: 18,
  },
  'BNB': {
    ticker: 'BNB',
    name: 'Binance Coin',
    type: COIN_TYPE.NATIVE,
    blockchain: BLOCKCHAIN.BNB,
    model: COIN_MODEL.AB,
    precision: 18,
  },
  'MATIC': {
    ticker: 'MATIC',
    name: 'MATIC Token',
    type: COIN_TYPE.NATIVE,
    blockchain: BLOCKCHAIN.MATIC,
    model: COIN_MODEL.AB,
    precision: 18,
  },
  'USDT': {
    ticker: 'USDT',
    name: 'Tether',
    type: COIN_TYPE.ETH_TOKEN,
    blockchain: BLOCKCHAIN.ETH,
    standard: TOKEN_STANDARD.ERC20,
    model: COIN_MODEL.AB,
    precision: 18,
  },
  'BTCB': {
    ticker: 'BTCB',
    name: 'BTCB Token',
    type: COIN_TYPE.BNB_TOKEN,
    blockchain: BLOCKCHAIN.BNB,
    standard: TOKEN_STANDARD.BEP20,
    model: COIN_MODEL.AB,
    precision: 18,
  },
  'EURS': {
    ticker: 'EURS',
    name: 'STASIS EURO',
    type: COIN_TYPE.ETH_TOKEN,
    blockchain: BLOCKCHAIN.ETH,
    standard: TOKEN_STANDARD.ERC20,
    model: COIN_MODEL.AB,
    precision: 18,
  },
  'GHOST': {
    ticker: 'GHOST',
    name: 'Ghost',
    type: COIN_TYPE.NATIVE,
    blockchain: BLOCKCHAIN.GHOST,
    model: COIN_MODEL.UTXO,
    precision: 8,
  },
  'NEXT': {
    ticker: 'NEXT',
    name: 'NEXT.coin',
    type: COIN_TYPE.NATIVE,
    blockchain: BLOCKCHAIN.NEXT,
    model: COIN_MODEL.UTXO,
    precision: 8,
  },
  'SWAP': {
    ticker: 'SWAP',
    name: 'SWAP',
    type: COIN_TYPE.ETH_TOKEN,
    blockchain: BLOCKCHAIN.ETH,
    standard: TOKEN_STANDARD.ERC20,
    model: COIN_MODEL.AB,
    precision: 18,
  },
  'SNM': {
    ticker: 'SONM',
    name: 'SWAP',
    type: COIN_TYPE.ETH_TOKEN,
    blockchain: BLOCKCHAIN.ETH,
    standard: TOKEN_STANDARD.ERC20,
    model: COIN_MODEL.AB,
    precision: 18,
  },
}


// todo: move to COIN_DATA

export const NATIVE = {
  btc: 'BTC',
  eth: 'ETH',
  bnb: 'BNB',
  matic: 'MATIC',
  ghost: 'GHOST',
  next: 'NEXT',
}

export const BNB_TOKENS = {
  btcb: 'BTCB',
}

export const MATIC_TOKENS = {
  wbtc: 'WBTC',
}

export const ETH_TOKENS = {
  usdt: 'USDT',
  eurs: 'EURS',
  swap: 'SWAP',
  pay: 'PAY',

  // needs for the front
  proxima: 'PROXIMA',
  snm: 'SNM',
  noxon: 'NOXON',
  pbl: 'PBL',
  xsat: 'XSAT',
  hdp: 'HDP',
  scro: 'SCRO',
  xeur: 'XEUR',

}

export default {
  ...NATIVE,
  ...ETH_TOKENS,
  ...BNB_TOKENS,
  ...MATIC_TOKENS,
  ...COIN_DATA,
}
