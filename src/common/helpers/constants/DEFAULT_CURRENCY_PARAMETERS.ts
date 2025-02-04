export default {
  evmLike: {
    limit: {
      send: 21 * 1e3,
      contractInteract: 100 * 1e3,
      swap: 70 * 1e3,
    },
    price: {
      slow: 0.1 * 1e9,
      normal: 1 * 1e9,
      fast: 2 * 1e9,
    },
  },
  evmLikeToken: {
    limit: {
      send: 100 * 1e3,
      swap: 300 * 1e3,
      swapDeposit: 170 * 1e3,
      swapWithdraw: 100 * 1e3,
    },
    price: {
      slow: 0.1 * 1e9,
      normal: 1 * 1e9,
      fast: 2 * 1e9,
    },
  },
  btc: {
    size: {
      send: 226,
      swap: 400,
    },
    rate: {
      slow: 5 * 1e3,
      normal: 15 * 1e3,
      fast: 30 * 1e3,
    },
  },
  ghost: {
    size: {
      send: 226,
      swap: 400,
    },
    rate: {
      slow: 5 * 1e3,
      normal: 15 * 1e3,
      fast: 30 * 1e3,
    },
  },
  next: {
    size: {
      send: 226,
      swap: 400,
    },
    rate: {
      slow: 5 * 1e3,
      normal: 15 * 1e3,
      fast: 30 * 1e3,
    },
  },
}
