import testWallets from '../../testWallets'

import { createBrowser, importWallet, selectSendCurrency, takeScreenshot, timeOut } from '../utils'

const amount = 50_000e-8

jest.setTimeout(150 * 1000)

describe('Send', () => {

  test('BTC', async () => {
    const { browser, page } = await createBrowser()

    try {
      await importWallet({
        page: page,
        seed: testWallets.btcMTaker.seedPhrase.split(' '),
      })

      await page.waitForSelector('#btcAddress') // waits for Maker wallet to load

      await timeOut(3 * 1000)

      const recoveredMakerBtcAddress = await page.$eval('#btcAddress', el => el.textContent)

      expect(recoveredMakerBtcAddress).toBe(testWallets.btcMTaker.address)

    } catch (error) {
      await takeScreenshot(page, 'SendBTC_RestoreWalletError')
      await browser.close()
      expect(false).toBe(true)
    }

    try {
      await timeOut(3 * 1000)

      await selectSendCurrency({page: page, currency: 'btc'})

      await page.type('#toAddressInput', testWallets.btcMMaker.address)

      await page.type('#amountInput', amount.toString())

      await timeOut(10 * 1000)

      await page.waitForSelector('#feeInfoBlockMinerFee')
      await page.evaluate((selector) => document.querySelector(selector).click(), '#slow')

      await timeOut(5 * 1000)

      await page.$('#sendButton').then((sendButton) => sendButton.click())

      await page.waitForSelector('#txAmout', {timeout: 60 * 1000})
      const btcTxAmout  = await page.$eval('#txAmout', el => el.textContent)

      await takeScreenshot(page, 'SendBTC_TxInfo')

      expect(btcTxAmout).toContain(amount.toString())

    } catch (error) {
      await takeScreenshot(page, 'SendBTCError')
      await browser.close()
      console.error('Send BTC error: ', error)
      expect(false).toBe(true)
    }

    await browser.close()

  })
})
