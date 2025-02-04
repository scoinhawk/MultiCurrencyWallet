import config from 'app-config'
import { util } from 'swap.app'
import { constants } from 'swap.app'
import BigNumber from 'bignumber.js'
import reducers from 'redux/core/reducers'
import TOKEN_STANDARDS from 'helpers/constants/TOKEN_STANDARDS'

const NETWORK = process.env.MAINNET ? 'mainnet' : 'testnet'

const getCustomTokenConfig = () => {
  const tokensInfo = JSON.parse(localStorage.getItem('customToken') || '{}')

  if (!Object.keys(tokensInfo).length || !tokensInfo[NETWORK]) {
    return {}
  }

  return tokensInfo[NETWORK]
}

const initExternalConfig = () => {
  // Add to swap.core not exists tokens
  Object.keys(TOKEN_STANDARDS).forEach((key) => {
    const standard = TOKEN_STANDARDS[key].standard.toLowerCase()

    Object.keys(config[standard]).forEach((tokenSymbol) => {
      if (!constants.COIN_DATA[tokenSymbol]) {
        util[standard].register(tokenSymbol, config[standard][tokenSymbol].decimals)
      }
    })
  })
}

const externalConfig = () => {
  // Reconfigure app config if it widget or use external config
  if (config.opts && config.opts.inited) {
    return config
  }

  config.opts = {
    inited: true,
    curEnabled: {
      eth: true,
      bnb: true,
      matic: true,
      btc: true,
      ghost: true,
      next: true,
    },
    blockchainSwapEnabled: {
      btc: true,
      eth: true,
      bnb: false,
      matic: false,
      ghost: true,
      next: true,
    },
    defaultExchangePair: {
      buy: 'eth',
      sell: 'btc',
    },
    ownTokens: false,
    // TODO: addCustomERC20 -> addCustomToken
    addCustomERC20: true,
    invoiceEnabled: !config.isWidget,
    showWalletBanners: false,
    showHowItsWork: false,
    fee: {},
    hideShowPrivateKey: false,
    plugins: {
      setItemPlugin: false,
      getItemPlugin: false,
      userDataPluginApi: false,
      backupPlugin: false,
      backupPluginUrl: false,
      restorePluginUrl: false,
    },
    WPuserHash: false,
    buyViaCreditCardLink: false,
    activeFiat: 'USD',
    exchangeDisabled: false,
    ui: {
      footerDisabled: false,
    },
  }

  if (window
    && window.invoiceEnabled
  ) {
    config.opts.invoiceEnabled = true
  }

  if (window
    && window._ui_footerDisabled
  ) {
    config.opts.ui.footerDisabled = window._ui_footerDisabled
  }

  if (window
    && window.WPuserHash
  ) {
    config.opts.WPuserHash = window.WPuserHash
    window.WPuserHash = false
  }

  if (window
    && window.showHowItWorksOnExchangePage
  ) {
    config.showHowItsWork = window.showHowItWorksOnExchangePage
  }

  if (window
    && window.buildOptions
    && Object.keys(window.buildOptions)
    && Object.keys(window.buildOptions).length
  ) {
    config.opts = { ...config.opts, ...window.buildOptions }
  }

  if (window
    && window.DEFAULT_FIAT
  ) {
    config.opts.activeFiat = window.DEFAULT_FIAT
  }
  reducers.user.setActiveFiat({ activeFiat: config.opts.activeFiat })

  if (window
    && window.EXCHANGE_DISABLED
  ) {
    config.opts.exchangeDisabled = window.EXCHANGE_DISABLED
  }


  // Plugin: enable/disable currencies

  if (window && window.CUR_BTC_DISABLED === true) {
    config.opts.curEnabled.btc = false
    config.opts.blockchainSwapEnabled.btc = false
  }

  if (window && window.CUR_GHOST_DISABLED === true) {
    config.opts.curEnabled.ghost = false
    config.opts.blockchainSwapEnabled.ghost = false
  }

  if (window && window.CUR_NEXT_DISABLED === true) {
    config.opts.curEnabled.next = false
    config.opts.blockchainSwapEnabled.next = false
  }

  if (window && window.CUR_ETH_DISABLED === true) {
    config.opts.curEnabled.eth = false
    config.opts.blockchainSwapEnabled.next = false
  }

  if (window && window.CUR_BNB_DISABLED === true) {
    config.opts.curEnabled.bnb = false
    config.opts.blockchainSwapEnabled.bnb = false
  }

  if (window && window.CUR_MATIC_DISABLED === true) {
    config.opts.curEnabled.matic = false
    config.opts.blockchainSwapEnabled.matic = false
  }


  // Plugins
  if (window
    && window.backupPlugin
    && window.backupUrl
    && window.restoreUrl
  ) {
    config.opts.plugins.backupPlugin = window.backupPlugin
    config.opts.plugins.backupPluginUrl = window.backupUrl
    config.opts.plugins.restorePluginUrl = window.restoreUrl
  }

  if (window
    && window.setItemPlugin
  ) {
    config.opts.plugins.setItemPlugin = window.setItemPlugin
  }
  if (window && window.getItemPlugin) {
    config.opts.plugins.getItemPlugin = window.getItemPlugin
  }
  if (window && window.userDataPluginApi) {
    config.opts.plugins.userDataPluginApi = window.userDataPluginApi
  }

  // ------
  if (window
    && window.buyViaCreditCardLink
  ) {
    config.opts.buyViaCreditCardLink = window.buyViaCreditCardLink
  }

  if (window
    && window.SWAP_HIDE_EXPORT_PRIVATEKEY !== undefined
  ) {
    config.opts.hideShowPrivateKey = window.SWAP_HIDE_EXPORT_PRIVATEKEY
  }

  if (window?.widgetERC20Tokens?.length) {
    config.opts.ownTokens = window.widgetERC20Tokens
  }

  if (config?.isWidget || config?.opts.ownTokens?.length) {
    if (config?.opts.ownTokens?.length) {
      config.opts.ownTokens.forEach((token) => {
        config[token.standard][token.name.toLowerCase()] = token
        reducers.core.markCoinAsVisible(token.name.toUpperCase())
      })
    }

    // Clean not uninitialized single-token
    // ? we can't use here as whole string {#WIDGETTOKENCODE#} ?
    const wcPb = `{#`
    const wcP = `WIDGETTOKENCODE`
    const wcPe = `#}`

    Object.keys(TOKEN_STANDARDS).forEach((key) => {
      const standard = TOKEN_STANDARDS[key].standard
      const ownTokens = {}

      Object.keys(config[standard]).forEach((tokenSymbol) => {
        if (tokenSymbol !== `${wcPb}${wcP}${wcPe}`) {
          ownTokens[tokenSymbol] = config[standard][tokenSymbol]
        }
      })

      config[standard] = ownTokens
    })
  }

  if (config.opts.addCustomERC20) {
    const customTokenConfig = getCustomTokenConfig()

    Object.keys(customTokenConfig).forEach((standard) => {
      Object.keys(customTokenConfig[standard]).forEach((tokenContractAddr) => {
        const tokenObj = customTokenConfig[standard][tokenContractAddr]
        const { symbol } = tokenObj

        if (!config[standard][symbol.toLowerCase()]) {
          config[standard][symbol.toLowerCase()] = {
            address: tokenObj.address,
            decimals: tokenObj.decimals,
            fullName: tokenObj.symbol,
          }
        }
      })
    })
  }

  // Comission config - default false
  if (window
    && window.widgetERC20Comisions
    && Object.keys(window.widgetERC20Comisions)
  ) {
    let hasTokenAdminFee = false

    Object.keys(window.widgetERC20Comisions).filter((key) => {
      const curKey = key.toLowerCase()
      if (window.widgetERC20Comisions[curKey]) {
        let { fee, address, min } = window.widgetERC20Comisions[curKey]
        let feeOk = false
        let minOk = false

        // @ToDo add currency isAddress Check
        if (fee && address && min) {
          try {
            fee = new BigNumber(fee.replace(',', '.')).toNumber()
            feeOk = true
          } catch (e) {
            console.error(`Fail convert ${fee} to number for ${curKey}`)
          }
          try {
            min = new BigNumber(min.replace(',', '.')).toNumber()
            minOk = true
          } catch (e) {
            console.error(`Fail convert ${min} to number for ${curKey}`)
          }

          if (minOk && feeOk) {
            config.opts.fee[curKey.toLowerCase()] = {
              fee,
              address,
              min,
            }
          }
        } else {
          if (TOKEN_STANDARDS[curKey.toLowerCase()] && address) {
            hasTokenAdminFee = true
            config.opts.fee[curKey.toLowerCase()] = {
              address,
            }
          }
        }
      }
    })

    // add currency commissions for tokens
    if (hasTokenAdminFee) {
      const feeObj = config.opts.fee

      Object.keys(TOKEN_STANDARDS).forEach((key) => {
        const standard = TOKEN_STANDARDS[key].standard.toLowerCase()
        const baseCurrency = TOKEN_STANDARDS[key].currency.toLowerCase()
        const currencyFee = feeObj[baseCurrency]

        if (currencyFee?.min && currencyFee?.fee) {
          feeObj[standard].min = currencyFee.min
          feeObj[standard].fee = currencyFee.fee
        }
      })
    }
  }

  console.group('%c External config', 'color: green;')
  console.log(config)
  console.groupEnd()

  return config
}

export default externalConfig()

export {
  externalConfig,
  initExternalConfig,
}
