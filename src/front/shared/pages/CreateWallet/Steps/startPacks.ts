import config from 'helpers/externalConfig'
const curEnabled = config.opts.curEnabled

// TODO: Move it in a better place

export const defaultPack = [
  ...(!curEnabled || curEnabled.btc ? [{ name: 'BTC', capture: 'Bitcoin' }] : []),

  ...(!curEnabled || curEnabled.eth ? [{ name: 'ETH', capture: 'Ethereum' }] : []),
  ...(config.erc20 ? [{ name: 'ERC20', capture: 'Token', baseCurrency: 'ETH' }] : []),

  ...(!curEnabled || curEnabled.bnb ? [{ name: 'BNB', capture: 'Binance Coin' }] : []),
  ...(config.bep20 ? [{ name: 'BEP20', capture: 'Token', baseCurrency: 'BNB' }] : []),

  ...(!curEnabled || curEnabled.matic ? [{ name: 'MATIC', capture: 'MATIC Token' }] : []),

  ...(!curEnabled || curEnabled.ghost ? [{ name: 'GHOST', capture: 'Ghost' }] : []),
  ...(!curEnabled || curEnabled.next ? [{ name: 'NEXT', capture: 'NEXT.coin' }] : []),

  ...(config.bep20 ? [{ name: 'BTCB', capture: 'BTCB Token', baseCurrency: 'BNB' }] : []),
  ...(config.erc20
    ? [
        { name: 'WBTC', capture: 'Wrapped Bitcoin', baseCurrency: 'ETH' },
        { name: 'USDT', capture: 'Tether', baseCurrency: 'ETH' },
        { name: 'EURS', capture: 'Eurs', baseCurrency: 'ETH' },
      ]
    : []),
  ...(config.erc20matic ? [{ name: 'WBTC', capture: 'WBTC Token', baseCurrency: 'MATIC' }] : []),
  ...(process.env.MAINNET
    ? [{ name: 'SWAP', capture: 'Swap', baseCurrency: 'ETH' }]
    : [{ name: 'WEENUS', capture: 'Weenus', baseCurrency: 'ETH' }]),
]

export const widgetPack = [
  ...(!curEnabled || curEnabled.btc ? [{ name: 'BTC', capture: 'Bitcoin' }] : []),
  ...(!curEnabled || curEnabled.eth ? [{ name: 'ETH', capture: 'Ethereum' }] : []),
  ...(config.erc20 ? [{ name: 'ERC20', capture: 'Token', baseCurrency: 'ETH' }] : []),
  ...(!curEnabled || curEnabled.bnb ? [{ name: 'BNB', capture: 'Binance Coin' }] : []),
  ...(config.bep20 ? [{ name: 'BEP20', capture: 'Token', baseCurrency: 'BNB' }] : []),
  ...(!curEnabled || curEnabled.matic ? [{ name: 'MATIC', capture: 'MATIC Token' }] : []),
  ...(!curEnabled || curEnabled.ghost ? [{ name: 'GHOST', capture: 'Ghost' }] : []),
  ...(!curEnabled || curEnabled.next ? [{ name: 'NEXT', capture: 'NEXT.coin' }] : []),
]
