import debug from 'debug'
import SwapApp, { SwapInterface, constants, util } from 'swap.app'
import BigNumber from 'bignumber.js'
import InputDataDecoder from 'ethereum-input-data-decoder'


class EthLikeTokenSwap extends SwapInterface {

  options: any
  _swapName: string
  address: string
  abi: any[]
  decimals: number
  tokenAddress: string
  tokenAbi: any[]
  gasLimit: number
  gasPrice: number
  fetchBalance: any
  estimateGasPrice: any
  _allSwapEvents: any

  web3adapter: any // web3.eth
  web3utils: any // web3.utils
  getMyAddress: any
  getParticipantAddress: any
  blockchainName: string

  app: any
  decoder: any
  contract: any
  ERC20: any

  /**
   *
   * @param {object}    options
   * @param {string}    options.name
   * @param {string}    options.address
   * @param {array}     options.abi
   * @param {string}    options.tokenAddress
   * @param {array}     options.tokenAbi
   * @param {number}    options.gasLimit
   * @param {function}  options.fetchBalance
   */
  constructor(options) {
    super()

    if (options.blockchainName === undefined) {
      throw new Error('EthLikeTokenSwap swap - option `blockchainName` not defined')
    }
    if (!options.name) {
      throw new Error('EthLikeTokenSwap: "name" required')
    }
    if (!Object.values(constants.COINS).includes(options.name.toUpperCase())) {
      throw new Error('EthLikeTokenSwap: "name" should be correct')
    }
    if (typeof options.address !== 'string') {
      throw new Error('EthLikeTokenSwap: "address" required')
    }
    if (typeof options.decimals !== 'number') {
      throw new Error('EthLikeTokenSwap: "decimals" required')
    }
    if (!Array.isArray(options.abi)) {
      throw new Error('EthLikeTokenSwap: "abi" required')
    }
    if (typeof options.tokenAddress !== 'string') {
      throw new Error('EthLikeTokenSwap: "tokenAddress" required')
    }
    if (!Array.isArray(options.tokenAbi)) {
      throw new Error('EthLikeTokenSwap: "tokenAbi" required')
    }
    if (options.getWeb3Adapter === undefined) {
      throw new Error(`EthLikeTokenSwap ${options.blockchainName}: option 'getWeb3Adapter' not defined`)
    }
    if (options.getWeb3Utils === undefined) {
      throw new Error(`EthLikeTokenSwap ${options.blockchainName}: option 'getWeb3Utils' not defined`)
    }
    if (options.getMyAddress === undefined) {
      throw new Error(`EthLikeTokenSwap ${options.blockchainName}: option 'getMyAddress' not defined`)
    }
    if (options.getParticipantAddress === undefined) {
      throw new Error(`EthLikeTokenSwap ${options.blockchainName}: option 'getParticipantAddress' not defined`)
    }
    if (typeof options.estimateGasPrice !== 'function') {
      // ({ speed } = {}) => gasPrice
      console.warn(`EthLikeTokenSwap: "estimateGasPrice" is not a function. You will not be able use automatic mempool-based fee`)
    }


    this.options        = options
    this._swapName      = options.name.toUpperCase()
    this.blockchainName = options.blockchainName

    this.address        = options.address
    this.abi            = options.abi
    this.decimals       = options.decimals
    this.tokenAddress   = options.tokenAddress
    this.tokenAbi       = options.tokenAbi

    this.gasLimit       = options.gasLimit || 2e5
    this.gasPrice       = options.gasPrice || 2e9
    this.fetchBalance   = options.fetchBalance
    this.estimateGasPrice = options.estimateGasPrice || (() => {})

  }

  _initSwap(app) {
    super._initSwap(app)

    this.app = app
    if (typeof this.app[this.options.getWeb3Adapter] !== 'function') {
      throw new Error(`EthLikeTokenSwap ${this.blockchainName}: SwapApp function '${this.options.getWeb3Adapter}' not defined`)
    }
    if (typeof this.app[this.options.getWeb3Utils] !== 'function') {
      throw new Error(`EthLikeTokenSwap ${this.blockchainName}: SwapApp function '${this.options.getWeb3Utils}' not defined`)
    }
    if (typeof this.app[this.options.getMyAddress] !== 'function') {
      throw new Error(`EthLikeTokenSwap ${this.blockchainName}: SwapApp function '${this.options.getMyAddress}' not defined`)
    }
    if (typeof this.app[this.options.getParticipantAddress] !== 'function') {
      throw new Error(`EthLikeTokenSwap ${this.blockchainName}: SwapApp function '${this.options.getParticipantAddress}' not defined`)
    }
 
    this.web3adapter = this.app[this.options.getWeb3Adapter].bind(this.app)()
    this.web3utils = this.app[this.options.getWeb3Utils].bind(this.app)()
    this.getMyAddress = this.app[this.options.getMyAddress].bind(this.app)
    this.getParticipantAddress = this.app[this.options.getParticipantAddress].bind(this.app)

    this.decoder        = new InputDataDecoder(this.abi)
    this.contract       = new this.web3adapter.Contract(this.abi, this.address)
    this.ERC20          = new this.web3adapter.Contract(this.tokenAbi, this.tokenAddress)
  }

  async updateGasPrice() {
    //@ts-ignore
    debug('gas price before update', this.gasPrice)

    try {
      this.gasPrice = await this.estimateGasPrice({ speed: 'fast' })
    } catch(err) {
      debug(`EthLikeTokenSwap ${this.blockchainName}: Error with gas update: ${err.message}, using old value gasPrice=${this.gasPrice}`)
    }
    //@ts-ignore
    debug('gas price after update', this.gasPrice)
  }

  async send(methodName, args, _params = {}, handleTransactionHash) {
    if (typeof this.contract.methods[methodName] !== 'function') {
      throw new Error(`EthLikeTokenSwap.send ${this.blockchainName}: No method ${methodName} in contract`)
    }

    await this.updateGasPrice()

    return new Promise(async (resolve, reject) => {
      const params = {
        from: this.getMyAddress(),
        gas: this.gasLimit,
        gasPrice: this.gasPrice,
        ..._params,
      }
      //@ts-ignore
      debug(`EthLikeTokenSwap ${this.blockchainName} -> ${methodName} -> params`, params)

      let gasAmount = 0
      try {
        gasAmount = await this.contract.methods[methodName](...args).estimateGas(params)
      } catch (estimateGasError) {
        reject({ message: estimateGasError.message, gasAmount: new BigNumber(gasAmount).dividedBy(1e8).toString() })
        return
      }

      params.gas = gasAmount
      //@ts-ignore
      debug(`EthLikeTokenSwap $[this.blockchainName} -> ${methodName} -> gas`, gasAmount)
      const receipt = await this.contract.methods[methodName](...args).send(params)
        .on('transactionHash', (hash) => {
          if (typeof handleTransactionHash === 'function') {
            handleTransactionHash(hash)
          }
        })
        .catch((error) => {
          reject({ message: error.message, gasAmount: new BigNumber(gasAmount).dividedBy(1e8).toString() })
        })

      resolve(receipt)
    })
  }

  /**
   *
   * @param {object} data
   * @param {BigNumber} data.amount
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  //@ts-ignore: strictNullChecks
  async approve(data, handleTransactionHash: Function = null) {
    const { amount } = data

    const exp = new BigNumber(10).pow(this.decimals)
    const newAmount = new BigNumber(amount).times(exp).toString()

    await this.updateGasPrice()

    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          from: this.getMyAddress(),
          gas: this.gasLimit,
          gasPrice: this.gasPrice,
        }

        const gasAmount = await this.ERC20.methods.approve(this.address, newAmount).estimateGas(params)

        params.gas = gasAmount

        //@ts-ignore
        debug(`EthLikeTokenSwap ${this.blockchainName} -> approve -> params`, params)

        const result = await this.ERC20.methods.approve(this.address, newAmount).send(params)
          .on('transactionHash', (hash) => {
            if (typeof handleTransactionHash === 'function') {
              handleTransactionHash(hash)
            }
          })
          .catch((error) => {
            reject({ message: error.message, gasAmount: new BigNumber(gasAmount).dividedBy(1e8).toString() })
          })

        resolve(result)
      }
      catch (err) {
        reject(err)
      }
    })
  }

  /**
   *
   * @param {object} data
   * @param {string} data.spender
   * @returns {Promise}
   */
  checkAllowance(data): Promise<number> {
    const { owner } = data

    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.ERC20.methods.allowance(owner, this.address).call({
          from: this.getMyAddress(),
        })

        resolve(result)
      }
      catch (err) {
        reject(err)
      }
    })
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secretHash
   * @param {string} data.participantAddress
   * @param {BigNumber} data.amount
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  async create(data, handleTransactionHash) {
    if (
      data.targetWallet
      && (
        (data.targetWallet!==data.participantAddress)
        ||
        data.useTargetWallet
      )
      && this.hasTargetWallet()
    ) {
      return this.createSwapTarget(data, handleTransactionHash)
    } else {
      return this.createSwap(data, handleTransactionHash)
    }
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secretHash
   * @param {string} data.participantAddress
   * @param {BigNumber} data.amount
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  async createSwap(data, handleTransactionHash) {
    const { secretHash, participantAddress, amount } = data

    const exp = new BigNumber(10).pow(this.decimals)
    const newAmount = new BigNumber(amount).times(exp).toString()

    const hash = `0x${secretHash.replace(/^0x/, '')}`
    const args = [ hash, participantAddress, newAmount, this.tokenAddress ]

    return this.send('createSwap', [...args], {}, handleTransactionHash)
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secretHash
   * @param {string} data.participantAddress
   * @param {BigNumber} data.amount
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  async createSwapTarget(data, handleTransactionHash) {
    const { secretHash, participantAddress, amount, targetWallet } = data

    const exp = new BigNumber(10).pow(this.decimals)
    const newAmount = new BigNumber(amount).times(exp).toString()

    const hash = `0x${secretHash.replace(/^0x/, '')}`
    const args = [ hash, participantAddress, targetWallet, newAmount, this.tokenAddress ]

    return this.send('createSwapTarget', [...args], {}, handleTransactionHash)
  }

  /**
   *
   * @param {object} data
   * @param {string} data.ownerAddress
   * @param {string} data.participantAddress
   * @returns {Promise}
   */
  swaps(data) {
    const { ownerAddress, participantAddress } = data

    return this.contract.methods.swaps(ownerAddress, participantAddress).call()
  }

  /**
   *
   * @param {object} data
   * @param {string} data.ownerAddress
   * @param {string} data.participantAddress
   * @returns {Promise}
   */
  async checkSwapExists(data) {
    const swap = await this.swaps(data)
    //@ts-ignore
    debug('swapExists', swap)

    const balance = swap && swap.balance ? parseInt(swap.balance) : 0

    return balance > 0
  }

  /**
   *
   * @param {object} data
   * @param {string} data.ownerAddress
   * @returns {Promise}
   */
  getBalance(data) {
    const { ownerAddress } = data

    return this.contract.methods.getBalance(ownerAddress).call({
      from: this.getMyAddress(),
    })
  }

  /**
   *
   * @param {object} data
   * @param {string} data.ownerAddress
   * @param {BigNumber} data.expectedValue
   * @returns {Promise.<string>}
   */
  async checkBalance(data) {
    const { ownerAddress, participantAddress, expectedValue, expectedHash } = data

    const balance = await util.helpers.repeatAsyncUntilResult(() =>
      this.getBalance({ ownerAddress })
    )
    const swap = await util.helpers.repeatAsyncUntilResult(() =>
      this.contract.methods.swaps(ownerAddress, participantAddress).call()
    )
    //@ts-ignore
    const { secretHash } = swap
    debug('swap.core:swaps')(`swap.secretHash`, secretHash)

    const _secretHash = `${secretHash.replace(/^0x/, '')}`

    debug('swap.core:swaps')(`secretHash: expected hash = ${expectedHash}, contract hash = ${_secretHash}`)

    if (expectedHash !== _secretHash) {
      return `Expected hash: ${expectedHash}, got: ${_secretHash}`
    }

    const expectedValueWei = new BigNumber(expectedValue).multipliedBy(this.decimals)

    if (expectedValueWei.isGreaterThan(balance)) {
      return `Expected value: ${expectedValueWei.toString()}, got: ${balance}`
    }
  }


  /**
   *
   * @returns {Promise}
   */
  async fetchSwapEvents() {
    if (this._allSwapEvents) return this._allSwapEvents

    const allSwapEvents = await this.contract.getPastEvents('allEvents', {
      fromBlock: 0,
      toBlock: 'latest',
    })

    this.contract.events.allEvents({ fromBlock: 0, toBlock: 'latest' })
      .on('data', event => {
        this._allSwapEvents.push(event)
      })
      .on('changed', (event) => {
        console.error(`EthTokenSwap: fetchEvents: needs rescan`)
        this._allSwapEvents = null
      })
      .on('error', err => {
        console.error(err)
        this._allSwapEvents = null
      })

    this._allSwapEvents = allSwapEvents

    return allSwapEvents
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secretHash
   * @returns {Promise}
   */
  async findSwap(data) {
    const { secretHash } = data

    const allSwapEvents = await this.fetchSwapEvents()

    const swapEvents = allSwapEvents
      .filter(({ returnValues }) => returnValues._secretHash === `0x${secretHash.replace('0x','')}`)

    const [ create, close, ...rest ] = swapEvents

    if (rest && rest.length) {
      console.error(`More than two swaps with same hash`, rest)
      // throw new Error(`More than two swaps with same hash`)
    }

    return [ create, close ]
  }

  /**
    *
    * @param {object} data
    * @param {string} data.secretHash
    * @returns {Promise(status)}
    */

  async wasClosed(data) {
    const [ create, close ] = await this.findSwap(data)

    if (!create) {
      debug(`No swap with hash ${data.secretHash}`)
      return 'no swap'
    } else if (create && !close) {
      debug(`Open yet!`)
      return 'open'
    } else {
      if (close.event == 'Withdraw') {
        debug(`Withdrawn`)
        return 'withdrawn'
      } else if (close.event == 'Refund') {
        debug(`Refund`)
        return 'refunded'
      } else {
        debug(`Unknown event, error`)
        return 'error'
      }
    }
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secretHash
   * @returns {Promise(boolean)}
   */
  wasRefunded(data) {
    return this.wasClosed(data)
      .then((status) =>
        status === 'refunded'
      )
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secretHash
   * @returns {Promise(boolean)}
   */
  async wasWithdrawn(data) {
    const status = await this.wasClosed(data)
    return status === 'withdrawn'
  }


  /**
   * @param {object} data
   * @param {string} data.ownerAddress
   * @param {string} tokenAddress
   */
  async checkTokenIsValid(data) {
    const { ownerAddress, participantAddress } = data

    const swap = await util.helpers.repeatAsyncUntilResult(() => 
      this.contract.methods.swaps(ownerAddress, participantAddress).call()
    )

    const { token } = swap

    debug('swap.core:swaps')(`Token address at swap contract: ${token.toUpperCase()}`);

    return (this.tokenAddress.toUpperCase() == token.toUpperCase())
  }

  /**
   *
   * @returns {boolean}
   */
  hasTargetWallet() {
    return !!this.contract.methods.getTargetWallet
  }


  /**
   *
   * @param {string} ownerAddress
   * @returns {Promise.<string>}
   */
  async getTargetWallet(ownerAddress: string): Promise<string> {
    let address: string = await util.helpers.repeatAsyncUntilResult(() =>
      this.getTargetWalletPromise(ownerAddress)
    )
    return address
  }

  /**
   *
   * @param {string} ownerAddress
   * @returns {string}
   */
  async getTargetWalletPromise(ownerAddress) {
    debug('swap.core:swaps')('EthTokenSwap->getTargetWallet');
    return new Promise(async (resolve, reject) => {
      try {
        const targetWallet = await this.contract.methods.getTargetWallet(ownerAddress).call({
          from: this.getMyAddress(),
        })
        debug('swap.core:swaps')('EthTokenSwap->getTargetWallet',targetWallet);

        resolve(targetWallet)
      }
      catch (err) {
        reject(err)
      }
    });
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secret
   * @param {string} data.ownerAddress
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  async calcWithdrawGas(data) {
    return this.calcWithdrawOtherGas({
      ownerAddress: data.ownerAddress,
      participantAddress: this.getMyAddress(),
      secret: data.secret,
    })
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secret
   * @param {string} data.ownerAddress
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  async withdraw(data, handleTransactionHash) {
    return this.withdrawOther({
      ownerAddress: data.ownerAddress,
      participantAddress: this.getMyAddress(),
      secret: data.secret,
    } , handleTransactionHash)
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secret
   * @param {string} data.participantAddress
   * @returns {Promise}
   */
  async calcWithdrawNoMoneyGas(data) {
    return this.calcWithdrawOtherGas({
      ownerAddress: this.getMyAddress(),
      participantAddress: data.participantAddress,
      secret: data.secret,
    })
  }

  /**
   *
   * @param {object} data
   * @param {string} data.secret
   * @param {string} data.participantAddress
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  async withdrawNoMoney(data, handleTransactionHash) {
    return this.withdrawOther({
      ownerAddress: this.getMyAddress(),
      participantAddress: data.participantAddress,
      secret: data.secret,
    }, handleTransactionHash)
  }

  async calcWithdrawOtherGas(data) {
    const { ownerAddress, participantAddress, secret } = data

    await this.updateGasPrice()

    return new Promise(async (resolve, reject) => {
      const _secret = `0x${secret.replace(/^0x/, '')}`

      const params = {
        from: this.getMyAddress(),
        gas: this.gasLimit,
        gasPrice: this.gasPrice,
      }

      try {
        const gasAmount = await this.contract.methods.withdrawOther(_secret, ownerAddress, participantAddress).estimateGas(params);
        resolve(gasAmount)
      }
      catch (err) {
        reject(err)
      }
    })
  }
  /**
   *
   * @param {object} data
   * @param {string} data.secret
   * @param {string} data.ownerAddress
   * @param {string} data.participantAddress
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  async withdrawOther(data, handleTransactionHash) {
    const { ownerAddress, participantAddress, secret } = data

    const _secret = `0x${secret.replace(/^0x/, '')}`

    await this.updateGasPrice()

    return this.send('withdrawOther', [ _secret, ownerAddress, participantAddress ], {}, handleTransactionHash)
  }

  /**
   *
   * @param {object} data
   * @param {string} data.participantAddress
   * @param {function} handleTransactionHash
   * @returns {Promise}
   */
  async refund(data, handleTransactionHash?: Function) {
    const { participantAddress } = data

    await this.updateGasPrice()

    return this.send('refund', [ participantAddress ], {}, handleTransactionHash)
  }

  /**
   *
   * @param {object} data
   * @param {string} data.participantAddress
   * @returns {Promise}
   */
  getSecret(data) {
    const { participantAddress } = data

    return new Promise(async (resolve, reject) => {
      try {
        const secret = await this.contract.methods.getSecret(participantAddress).call({
          from: this.getMyAddress(),
        })

        const secretValue = secret && !/^0x0+$/.test(secret) ? secret : null

        resolve(secretValue)
      }
      catch (err) {
        reject(err)
      }
    })
  }


  /**
   *
   * @param {string} transactionHash
   * @returns {Promise<any>}
   */
  getSecretFromTxhash = (transactionHash) =>
    this.web3adapter.getTransaction(transactionHash)
      .then(txResult => {
        try {
          const bytes32 = this.decoder.decodeData(txResult.input)
          return this.web3utils.bytesToHex(bytes32.inputs[0]).split('0x')[1]
        } catch (err) {
          debug('swap.core:swaps')('Trying to fetch secret from tx: ' + err.message)
          return
        }
      })


  async fundERC20Contract({
    flow,
    useTargetWallet,
  }: {
    flow: any,
    useTargetWallet?: boolean,
  }) {
    const abClass = this
    const {
      participant,
      buyAmount,
      sellAmount,
      waitConfirm,
    } = flow.swap

    const { secretHash } = flow.state

    const swapData = {
      participantAddress: abClass.getParticipantAddress(flow.swap),
      secretHash,
      amount: sellAmount,
      targetWallet: (flow.swap.destinationSellAddress)
        ? flow.swap.destinationSellAddress
        : abClass.getParticipantAddress(flow.swap),
      useTargetWallet,
      calcFee: true,
    }

    // TODO fee after allowance
    // EthTokenSwap -> approve need gas too
    /* calc create contract fee and save this */
    /*
    flow.setState({
      createSwapFee: await flow.ethTokenSwap.create(swapData),
    })
    */
    swapData.calcFee = false
    //debug('swap.core:flow')('create swap fee', flow.state.createSwapFee)

    const tryCreateSwap = async () => {
      const { isEthContractFunded } = flow.state

      if (!isEthContractFunded) {
        try {
          debug('swap.core:flow')('fetching allowance')

          const allowance = await abClass.checkAllowance({
            owner: abClass.getMyAddress(),
          })

          const allowanceAmount = new BigNumber(allowance)
            .dp(0, BigNumber.ROUND_UP)
            .div(new BigNumber(10).pow(this.decimals))

          debug('swap.core:flow')('allowance', allowance)

          if (allowanceAmount.isLessThan(sellAmount)) {
            debug('swap.core:flow')('allowanceAmount < sellAmount', allowanceAmount.toNumber(), sellAmount)
            await abClass.approve({
              amount: sellAmount,
            })
          }

          debug('swap.core:flow')('check swap exists')
          const swapExists = await flow._checkSwapAlreadyExists()
          if (swapExists) {
            console.warn('Swap exists!! May be stucked. Try refund')
            await abClass.refund({
              participantAddress: abClass.getParticipantAddress(flow.swap),
            }, (refundTx) => {
              debug('swap.core:flow')('Stucked swap refunded', refundTx)
            })
          }
          await abClass.create(swapData, async (hash) => {
            debug('swap.core:flow')('create swap tx hash', hash)
            flow.swap.room.sendMessage({
              event: 'create eth contract',
              data: {
                ethSwapCreationTransactionHash: hash,
              },
            })

            flow.swap.room.on('request eth contract', () => {
              flow.swap.room.sendMessage({
                event: 'create eth contract',
                data: {
                  ethSwapCreationTransactionHash: hash,
                },
              })
            })

            flow.setState({
              ethSwapCreationTransactionHash: hash,
              canCreateEthTransaction: true,
              isFailedTransaction: false,
            }, true)

            debug('swap.core:flow')('created swap!', hash)
          })

        } catch (error) {
          if (flow.state.ethSwapCreationTransactionHash) {
            console.error('fail create swap, but tx already exists')
            flow.setState({
              canCreateEthTransaction: true,
              isFailedTransaction: false,
            }, true)
            return true
          }
          const { message, gasAmount } = error

          if ( /insufficient funds/.test(message) ) {
            console.error(`Insufficient ETH for gas: ${gasAmount} ETH needed`)

            flow.setState({
              canCreateEthTransaction: false,
              gasAmountNeeded: gasAmount,
            })

            return null
          } else if ( /known transaction/.test(message) ) {
            console.error(`known tx: ${message}`)
          } else if ( /out of gas/.test(message) ) {
            console.error(`tx failed (wrong secret?): ${message}`)
          } else if ( /always failing transaction/.test(message) ) {
            console.error(`Insufficient Token for transaction: ${message}`)
          } else if ( /Failed to check for transaction receipt/.test(message) ) {
            console.error(error)
          } else if ( /replacement transaction underpriced/.test(message) ) {
            console.error(error)
          } else {
            console.error(error)
          }

          flow.setState({
            isFailedTransaction: true,
            isFailedTransactionError: error.message,
          })

          return null
        }
      }

      return true
    }

    const isEthContractFunded = await util.helpers.repeatAsyncUntilResult(() =>
      tryCreateSwap(),
    )

    const { isStoppedSwap } = flow.state

    if (isEthContractFunded && !isStoppedSwap) {
      debug('swap.core:flow')(`finish step`)
      flow.finishStep({
        isEthContractFunded,
      }, {step: 'lock-eth'})
    }
  }


  async getSecretFromContract({
    flow,
  }: {
    flow: any,
  }) {
    const abClass = this

    flow.swap.room.once('ethWithdrawTxHash', async ({ethSwapWithdrawTransactionHash}) => {
      flow.setState({
        ethSwapWithdrawTransactionHash,
      }, true)

      const secretFromTxhash = await util.helpers.extractSecretFromTx({
        flow,
        swapFlow: flow.ethTokenSwap,
        app: flow.app,
        ethSwapWithdrawTransactionHash,
      })

      const { isEthWithdrawn } = flow.state

      if (!isEthWithdrawn && secretFromTxhash) {
        debug('swap.core:flow')('got secret from tx', ethSwapWithdrawTransactionHash, secretFromTxhash)
        flow.finishStep({
          isEthWithdrawn: true,
          secret: secretFromTxhash,
        }, {step: 'wait-withdraw-eth'})
      }
    })

    flow.swap.room.sendMessage({
      event: 'request ethWithdrawTxHash',
    })

    const { participant } = flow.swap

    const checkSecretExist = async () => {
      return await util.helpers.extractSecretFromContract({
        flow,
        swapFlow: abClass,
        participantAddress: flow.getParticipantAddress(flow.swap),
        ownerAddress: flow.getMyAddress(),
        app: flow.app,
      })
    }

    const secretFromContract = await util.helpers.repeatAsyncUntilResult((stopRepeat) => {
      const { isEthWithdrawn, isRefunded } = flow.state

      if (isEthWithdrawn || isRefunded) {
        stopRepeat()

        return false
      }

      return checkSecretExist()
    })

    const { isEthWithdrawn } = flow.state

    if (secretFromContract && !isEthWithdrawn) {
      debug('swap.core:flow')('got secret from smart contract', secretFromContract)

      flow.finishStep({
        isEthWithdrawn: true,
        secret: secretFromContract,
      }, { step: 'wait-withdraw-eth' })
    }
  }


  async waitAB2UTXOContract({
    flow,
    utxoCoin,
  }: {
    flow: any,
    utxoCoin: string,
  }) {
    const abClass = this

    flow.swap.room.sendMessage({
      event: 'request eth contract',
    })

    flow.swap.room.once(`request ${utxoCoin} script`, () => {
      const {
        utxoScriptValues: scriptValues,
        utxoScriptCreatingTransactionHash: txHash,
      } = flow.state

      flow.swap.room.sendMessage({
        event:  `create ${utxoCoin} script`,
        data: {
          scriptValues,
          utxoScriptCreatingTransactionHash: txHash,
        }
      })
    })

    const { participant } = flow.swap

    flow.swap.room.on('create eth contract', ({ ethSwapCreationTransactionHash }) => {
      flow.setState({
        ethSwapCreationTransactionHash,
      }, true)
    })

    const isContractBalanceOk = await this.isContractFunded(flow)

    if (isContractBalanceOk) {
      const { isEthContractFunded } = flow.state

      if (!isEthContractFunded) {
        flow.finishStep({
          isEthContractFunded: true,
        }, { step: 'wait-lock-eth' })
      }
    }
  }

  async withdrawFromABContract({
    flow,
  }: {
    flow: any,
  }) {
    const abClass = this
    const { buyAmount, participant } = flow.swap
    const { secretHash, secret } = flow.state

    const data = {
      ownerAddress: flow.getParticipantAddress(flow.swap),
      secret,
    }

    const balanceCheckError = await abClass.checkBalance({
      ownerAddress: flow.getParticipantAddress(flow.swap),
      participantAddress: flow.getMyAddress(),
      expectedValue: buyAmount,
      expectedHash: secretHash,
    })

    if (balanceCheckError) {
      console.error('Waiting until deposit: ETH balance check error:', balanceCheckError)
      flow.swap.events.dispatch('eth balance check error', balanceCheckError)

      return
    }

    if (abClass.hasTargetWallet()) {
      const targetWallet = await abClass.getTargetWallet(
        flow.getParticipantAddress(flow.swap)
      )
      const needTargetWallet = (flow.swap.destinationBuyAddress)
        ? flow.swap.destinationBuyAddress
        : flow.getMyAddress()

      if (targetWallet.toLowerCase() != needTargetWallet.toLowerCase()) {
        console.error(
          "Destination address for tokens dismatch with needed (Needed, Getted). Stop swap now!",
          needTargetWallet,
          targetWallet,
        )

        flow.swap.events.dispatch('address for tokens invalid', {
          needed: needTargetWallet,
          getted: targetWallet,
        })

        return
      }
    }

    const tokenAddressIsValid = await abClass.checkTokenIsValid({
      ownerAddress: flow.getParticipantAddress(flow.swap),
      participantAddress: flow.getMyAddress(),
    })

    if (!tokenAddressIsValid) {
      console.error("Tokens, blocked at contract dismatch with needed. Stop swap now!")
      return
    }

    const onWithdrawReady = () => {
      flow.swap.room.once('request ethWithdrawTxHash', () => {
        const { ethSwapWithdrawTransactionHash } = flow.state

        flow.swap.room.sendMessage({
          event: 'ethWithdrawTxHash',
          data: {
            ethSwapWithdrawTransactionHash,
          },
        })
      })

      const { step } = flow.state

      if (step >= 7) {
        return
      }

      flow.finishStep({
        isEthWithdrawn: true,
      }, 'withdraw-eth')
    }

    const tryWithdraw = async (stopRepeater) => {
      const { isEthWithdrawn } = flow.state

      if (!isEthWithdrawn) {
        try {
          const { withdrawFee } = flow.state

          if (!withdrawFee) {
            const withdrawNeededGas = await abClass.calcWithdrawGas({
              ownerAddress: data.ownerAddress,
              secret,
            })
            flow.setState({
              withdrawFee: withdrawNeededGas,
            })
            debug('swap.core:flow')('withdraw gas fee', withdrawNeededGas)
          }

          await abClass.withdraw(data, (hash) => {
            flow.setState({
              isEthWithdrawn: true,
              ethSwapWithdrawTransactionHash: hash,
              canCreateEthTransaction: true,
              requireWithdrawFee: false,
            }, true)

            flow.swap.room.sendMessage({
              event: 'ethWithdrawTxHash',
              data: {
                ethSwapWithdrawTransactionHash: hash,
              }
            })
          })

          stopRepeater()
          return true
        } catch (err) {
          if ( /known transaction/.test(err.message) ) {
            console.error(`known tx: ${err.message}`)
            stopRepeater()
            return true
          } else if ( /out of gas/.test(err.message) ) {
            console.error(`tx failed (wrong secret?): ${err.message}`)
          } else if ( /insufficient funds for gas/.test(err.message) ) {
            console.error(`insufficient fund for gas: ${err.message}`)

            debug('swap.core:flow')('insufficient fund for gas... wait fund or request other side to withdraw')

            const { requireWithdrawFee } = flow.state

            if (!requireWithdrawFee) {
              flow.swap.room.once('withdraw ready', ({ethSwapWithdrawTransactionHash}) => {
                flow.setState({
                  ethSwapWithdrawTransactionHash,
                })

                onWithdrawReady()
              })

              flow.setState({
                requireWithdrawFee: true,
              })
            }

          } else {
            console.error(err)
          }

          flow.setState({
            canCreateEthTransaction: false,
          })

          return null
        }
      }

      return true
    }

    const isEthWithdrawn = await util.helpers.repeatAsyncUntilResult((stopRepeater) =>
      tryWithdraw(stopRepeater),
    )

    if (isEthWithdrawn) {
      onWithdrawReady()
    }
  }

  async isSwapCreated(data) {
    const {
      ownerAddress,
      participantAddress,
      secretHash,
    } = data

    const swap = await util.helpers.repeatAsyncUntilResult(() => {
      return this.contract.methods.swaps(ownerAddress, participantAddress).call()
    })

    return (swap && swap.secretHash && swap.secretHash === `0x${secretHash}`)
  }

  async isContractFunded(flow) {
    const abClass = this
    const { buyAmount } = flow.swap

    const isContractBalanceOk = await util.helpers.repeatAsyncUntilResult(async () => {
      const balance = await abClass.getBalance({
        ownerAddress: flow.getParticipantAddress(flow.swap),
      })

      const exp = new BigNumber(10).pow(abClass.decimals)
      const needContractBalance = new BigNumber(buyAmount).times(exp)

      debug('swap.core:flow')('Checking contract balance:', balance)

      if (new BigNumber(balance).isGreaterThanOrEqualTo(needContractBalance)) {
        return true
      } else {
        if (balance > 0) {
          console.warn(`Balance on contract is less than needed. Swap stucked. Contract balance: ${balance} Needed: ${needContractBalance.toString()}`)
        }
      }

      return false
    })

    if (isContractBalanceOk) {
      return true
    }
    return false
  }

  async checkTargetAddress({
    flow,
  }: {
    flow: any
  }) {
    if (this.hasTargetWallet()) {
      const targetWallet = await this.getTargetWallet(
        this.getParticipantAddress(flow.swap)
      )
      const needTargetWallet = (flow.swap.destinationBuyAddress)
        ? flow.swap.destinationBuyAddress
        : this.getMyAddress()

      if (targetWallet.toLowerCase() === needTargetWallet.toLowerCase()) {
        return true
      }
    }
    return false
  }


}


export default EthLikeTokenSwap
