import router from '@/router'
import { WalletApi, standardizeBalance, LocalStorageApi } from '@/api'
import {
  calculateTimeAgo,
  createNotification,
  cropString,
  encodeDataRequest,
  standardizeWitUnits,
} from '@/utils'
import i18n from '@/plugins/i18n'
import SyncingTimeEstimator from '@/services/SyncingTimeEstimator'
import ProcessWalletEvent from '@/services/ProcessWalletEvent'
import formatMillisecondsDuration from '@/services/format/formatMillisecondsDuration'

import {
  DEFAULT_WIT_UNIT,
  DEFAULT_THEME,
  GENESIS_EVENT_TIMESTAMP,
  GENERATE_ADDRESS_DELAY,
  WALLET_EVENTS,
  WIT_UNIT,
  TRANSACTIONS_LIMIT,
  NOTIFICATIONS,
  DEFAULT_LOCALE,
  LANGUAGES,
  THEMES,
  NETWORK_STATUS,
} from '@/constants'
import { SET_TEMPLATES, UPDATE_TEMPLATE } from '@/store/mutation-types'
import warning from '@/resources/svg/warning.png'

export default {
  state: {
    api: new WalletApi(),
    localStorage: new LocalStorageApi(),
    eventProcessor: new ProcessWalletEvent(),
    errors: {
      shutdown: null,
      signDisclaimer: null,
      seed: null,
      uploadFile: null,
      createMnemonics: null,
      createWallet: null,
      generateAddress: null,
      createValidPassword: null,
      mnemonics: null,
      xprv: null,
      getTransactions: null,
      getBalance: null,
      getWalletInfos: null,
      lockWallet: null,
      sendTransaction: null,
      tryDataRequest: null,
      unlockWallet: null,
      createVTT: null,
      createDataRequest: null,
      closeSession: null,
      getAddresses: null,
      network: null,
      saveItem: null,
      getItem: null,
      nodeSync: false,
    },
    repeatedWallet: null,
    exportFileLink: '',
    checkTokenGenerationEventDate: new Date(GENESIS_EVENT_TIMESTAMP),
    mainnetReady: false,
    theme: null,
    unit: DEFAULT_WIT_UNIT,
    locale: DEFAULT_LOCALE,
    prevUnit: DEFAULT_WIT_UNIT,
    balance: {},
    walletIdx: null,
    sessionId: null,
    walletId: null,
    addresses: [],
    generatedTransaction: null,
    mnemonics: null,
    xprv: null,
    xprvBackupPassword: null,
    seed: null,
    networkStatus: 'error',
    notifications: {
      [NOTIFICATIONS.BLOCK.key]: false,
      [NOTIFICATIONS.TRANSACTIONS.key]: true,
      [NOTIFICATIONS.PAYMENTS.key]: true,
      [NOTIFICATIONS.SYNCRONIZATION.key]: true,
    },
    status: {
      currentState: NETWORK_STATUS.WAITING_FOR_NODE_TO_SYNC,
      progress: null,
      lastBlock: null,
      lastSync: null,
      lastBlockTimestamp: null,
      address: null,
      isNodeSynced: false,
      balance: null,
      network: 'mainnet',
    },
    syncingTimeEstimator: new SyncingTimeEstimator(),
    description: '',
    title: '',
    radRequestResult: null,
    transactions: [],
    transactionsLength: '0',
    currentTransactionsPage: 1,
    txLabels: {},
    walletInfos: null,
    walletLocked: false,
    validatedPassword: false,
    fileInfo: null,
    areMnemonicsValid: false,
    isXprvValid: false,
    tokenGenerationEventOccurred:
      new Date(GENESIS_EVENT_TIMESTAMP) < new Date(),
    isDefaultWallet: false,
    sessionTimeout: null,
  },
  getters: {
    network: state => state.status.network,
    unlockedWallet: state => {
      return Number.isInteger(state.walletIdx)
        ? state.walletInfos[state.walletIdx]
        : null
    },
    estimatedTimeOfSync: state => {
      return formatMillisecondsDuration(state.syncingTimeEstimator.calculate())
    },
    language: state => {
      return Object.values(LANGUAGES).find(
        language => language.locale === state.locale,
      )
    },
  },
  mutations: {
    setWalletOwner(status, { isDefaultWallet }) {
      status.isDefaultWallet = isDefaultWallet
    },
    setStatus(state, status) {
      state.status = status
    },
    stopSyncEstimator(state) {
      state.syncingTimeEstimator.reset()
    },
    startSyncEstimator(state) {
      state.syncingTimeEstimator.start(Date.now())
    },
    toggleNotification(state, name) {
      state.notifications[name] = !state.notifications[name]
      state.localStorage.setNotificationsSettings(state.notifications)
    },
    toggleTheme(state) {
      if (state.theme === THEMES.DARK) {
        state.theme = THEMES.LIGHT
      } else {
        state.theme = THEMES.DARK
      }
      state.localStorage.setThemeSettings(state.theme)
    },
    setUnit(state, unit) {
      state.unit = unit
    },
    setLanguage(state, { locale, i18n }) {
      if (locale) {
        state.locale = locale
        i18n.locale = LANGUAGES[state.locale].locale
      } else {
        state.locale = LANGUAGES[i18n.locale].locale
      }
    },
    setTheme(state, theme) {
      if (theme === THEMES.LIGHT) {
        state.theme = THEMES.LIGHT
      } else {
        state.theme = THEMES.DARK
      }
      document.documentElement.setAttribute('theme', state.theme)
    },
    setNotifications(state, notifications) {
      state.notifications = notifications
    },
    addSyncEstimatorSample(state, { current, finish }) {
      state.syncingTimeEstimator.addSample({
        currentBlock: current,
        lastBlock: finish,
      })
    },
    setRepeatedWallet(state, payload) {
      state.repeatedWallet = payload.exist
    },
    setWalletDescription(state, payload) {
      // set title and description when received
      Object.entries(payload).forEach(entry => {
        state[entry[0]] = entry[1]
      })
    },
    clearXprvInfo(state) {
      state.xprv = null
      state.fileInfo = null
    },
    clearXprvBackupPassword(state) {
      state.xprvBackupPassword = null
    },
    setComputedVesting(state, computedVesting) {
      state.computedVesting = computedVesting
    },
    setXprvInfo(state, info) {
      state.fileInfo = info
    },
    setExportFileLink(state, link) {
      state.exportFileLink = link
    },
    setVesting(state, vesting) {
      state.vesting = vesting
    },
    setTransactions(state, { transactions, total }) {
      state.transactionsLength = total
      state.transactions = transactions.map(transaction => ({
        ...transaction,
        timeAgo: calculateTimeAgo(transaction.timestamp, state.locale),
      }))
    },
    setWalletIndex(state, { walletIndex }) {
      const walletInfos = state.walletInfos
      state.walletIdx = walletIndex === -1 ? walletInfos.length : walletIndex
      state.localStorage.setWalletIndex(state.walletIdx)
    },
    setLabels(state, { labels }) {
      state.txLabels = labels
    },
    setBalance(state, { balance }) {
      if (balance) {
        state.balance = balance
      }
    },
    changeLocale(state, { locale, i18n }) {
      if (Object.keys(LANGUAGES).includes(locale)) {
        state.locale = locale
        state.localStorage.setLanguageSettings(locale)

        i18n.locale = locale
      } else {
        console.warn('[mutation setUnit]: invalid language')
      }
    },
    changeDefaultUnit(state, unit) {
      if (Object.values(WIT_UNIT).includes(unit)) {
        state.unit = unit
        state.localStorage.setUnitSettings(state.unit)
      } else {
        console.warn('[mutation setUnit]: invalid unit')
      }
    },
    changeUnit(state) {
      const unitsValues = Object.values(WIT_UNIT)
      const unitsKeys = Object.keys(WIT_UNIT)
      // Get index of the next unit
      state.prevUnit = state.unit
      const index = (unitsValues.indexOf(state.unit) + 1) % unitsValues.length
      state.unit = WIT_UNIT[unitsKeys[index]]
    },
    deleteSession(state) {
      state.sessionId = null
      state.walletId = null
    },
    checkTokenGenerationEventDate(state) {
      const tokenGenerationEventDate = state.checkTokenGenerationEventDate
      const currentDate = new Date()
      if (tokenGenerationEventDate < currentDate) {
        state.tokenGenerationEventOccurred = true
      }
    },
    checkNetworkStatus(state) {
      if (state.api.client.ws.ready) {
        state.networkStatus = 'synced'
        this.commit('clearError', { error: 'network' })
        if (state.errors.length) {
          state.errors.map(err =>
            this.commit('clearError', { error: err.name }),
          )
        }
      } else {
        this.commit('setWalletOwner', { isDefaultWallet: false })
        state.networkStatus = 'error'
        if (state.networkStatus === 'error') {
          this.commit('setError', {
            name: 'network',
            error: i18n.t('connection_error'),
            message: i18n.t('connection_error_message'),
          })
        }
      }
    },
    setDataRequestResult(state, { result }) {
      const retrievePartialResults = !!result.result.retrieve[0].partial_results
      if (retrievePartialResults) {
        state.radRequestResult = { ...result, timestamp: Date.now() }
      } else {
        if (state.radRequestResult) {
          const lastUpdatedOperator =
            state.radRequestResult.result.retrieve[0].context.call_index + 1
          const radonError = result.result.retrieve[0].result
          const prevRequestPartialResult =
            state.radRequestResult.result.retrieve[0].partial_results
          if (prevRequestPartialResult) {
            state.radRequestResult.result.retrieve[0].result = radonError
            state.radRequestResult.result.retrieve[0].partial_results[
              lastUpdatedOperator
            ] = null
          } else {
            state.radRequestResult = { ...result, timestamp: Date.now() }
          }
        } else {
          const radonError = result.result.retrieve[0].result
          state.radRequestResult = { ...result, timestamp: Date.now() }
          state.radRequestResult.result.retrieve[0].result = radonError
        }
      }
    },
    clearDataRequestResult(state) {
      state.radRequestResult = null
    },
    setSeed(state, { result }) {
      Object.assign(state, { seed: result })
    },
    setMnemonics(state, result) {
      Object.assign(state, { mnemonics: result })
    },
    setXprv(state, { result }) {
      Object.assign(state, { xprv: result })
    },
    setBackupPassword(state, { result }) {
      Object.assign(state, { xprvBackupPassword: result })
    },
    setWallet(state, { walletId, sessionId }) {
      state.walletId = walletId
      state.sessionId = sessionId
    },

    setWalletInfos(state, { walletInfos }) {
      state.walletInfos = walletInfos
    },

    lockWallet(state, id) {
      state.lockWallet = id
    },

    setError(state, { name, error, message }) {
      if (
        error === 'Validation Error' ||
        name === 'uploadFile' ||
        name === 'mnemonics' ||
        name === 'xprv' ||
        name === 'seed' ||
        name === 'nodeSync'
      ) {
        state.errors[name] = {
          name,
          error,
          message,
        }
      } else {
        const socketNotReady = error === 'socket not ready'
        const networkStatusError = state.networkStatus === 'error'
        if (networkStatusError || socketNotReady) {
          return ''
        } else {
          // notification options
          const notificationProps = {
            title: error,
            body: message,
            icon: warning,
          }
          // create notification
          createNotification(notificationProps)
        }
      }
    },
    clearError(state, { error }) {
      state.errors[error] = null
    },
    setGeneratedTransaction(state, { transaction }) {
      state.generatedTransaction = transaction
    },
    clearGeneratedTransaction(state) {
      state.generatedTransaction = null
    },
    clearSeed(state) {
      state.seed = null
    },
    clearMnemonics(state) {
      state.mnemonics = null
    },
    addAddress(state, { address }) {
      if (address) {
        state.addresses.add(address)
      }
    },
    validateMnemonics(state, { seed = '', mnemonics = '' }) {
      const validate = (s = '', m = '') => {
        return (
          s &&
          s.trim() ===
            m
              .trim()
              .split('')
              .slice(0, s.trim().length)
              .join('')
        )
      }

      if (validate(seed, mnemonics)) {
        state.areMnemonicsValid = true
      } else {
        state.areMnemonicsValid = false
      }
    },
    validatePassword(state, { password, repeatedPassword }) {
      const passwordLength = password ? password.split('').length : 0
      const repeatedPasswordLength = repeatedPassword
        ? repeatedPassword.split('').length
        : 0
      if (passwordLength < 8 || repeatedPasswordLength < 8) {
        this.commit('setError', {
          name: 'createValidPassword',
          error: i18n.t('validation_error'),
          message: i18n.t('validate_password_length_message'),
        })
        state.validatedPassword = false
      } else if (password !== repeatedPassword) {
        this.commit('setError', {
          name: 'createValidPassword',
          error: i18n.t('validation_error'),
          message: i18n.t('validate_password_match_message'),
        })
        state.validatedPassword = false
      } else {
        state.validatedPassword = true
      }
    },
    setCurrentTransactionPage(state, { page }) {
      state.currentTransactionsPage = page
    },
    setAddresses(state, { addresses }) {
      if (addresses) {
        state.addresses = addresses.reverse()
      }
    },
    startSessionTimeout(state, ms) {
      // Redirect to wallet list when the session has expired
      state.sessionTimeout = setTimeout(() => {
        router.push('/welcome-back/wallet-list')
        this.commit('stopSessionTimeout')
      }, ms)
    },
    stopSessionTimeout(state) {
      clearTimeout(state.sessionTimeout)
      state.sessionTimeout = null
    },
  },
  actions: {
    async setCurrentTransactionsPage(context, { page }) {
      await context.dispatch('getTransactions', { page })
      if (!context.state.errors.getTransactions) {
        context.commit('setCurrentTransactionPage', { page })
      }
    },
    startTransactionDateSync(context) {
      if (!this.transactionSync) {
        this.transactionSync = setInterval(() => {
          context.commit('setTransactions', {
            transactions: context.state.transactions,
            total: context.state.transactionsLength,
          })
        }, 15000)
      }
    },
    stopTransactionDateSync(context) {
      clearInterval(this.transactionSync)
    },
    shutdown: async function(context) {
      if (context.state.isDefaultWallet) {
        // don't handle the response in client because the wallet is being closed.
        // This is handled in background.js when 'exit' event is emitted
        context.state.api.shutdown({
          session_id: context.state.sessionId,
        })
      }
    },
    closeSession: async function(context) {
      const request = await context.state.api.closeSession({
        wallet_id: context.state.walletId,
        session_id: context.state.sessionId,
      })
      if (request.result) {
        context.commit('stopSessionTimeout')
        context.commit('deleteSession')
        context.commit(SET_TEMPLATES, { templates: {} })
        router.push('/welcome-back/wallet-list')
      } else {
        context.commit('setError', {
          name: 'closeSession',
          error: request.error.message,
          message: i18n.t('close_session_error_message'),
        })
      }
    },
    exportMasterKey: async function(context, { password }) {
      const request = await context.state.api.exportMasterKey({
        wallet_id: context.rootState.wallet.walletId,
        session_id: context.rootState.wallet.sessionId,
        password,
      })
      if (request.result) {
        context.commit('setXprv', { result: request.result })
      } else {
        // TODO: improve error handling
        context.commit('setError', {
          name: 'exportXprv',
          error: request.error.message,
          message: i18n.t('export_xprv_error_message'),
        })
      }
    },
    getLabels: async function(context) {
      const request = await context.state.api.getItem({
        wallet_id: context.rootState.wallet.walletId,
        session_id: context.rootState.wallet.sessionId,
        key: `${context.rootState.wallet.walletId}_labels`,
      })
      if (request.result) {
        context.commit('setLabels', { labels: request.result.value || {} })
      } else {
        // TODO: improve error handling
        context.commit('setError', {
          name: 'getItem',
          error: request.error.message,
          message: i18n.t('get_labels_error_message'),
        })
      }
    },
    sendTransaction: async function(context, { label }) {
      const transactionToSend = context.state.generatedTransaction
      const request = await context.state.api.sendTransaction({
        wallet_id: context.state.walletId,
        session_id: context.state.sessionId,
        transaction: transactionToSend.transaction,
      })

      if (request.result) {
        context.dispatch('saveLabel', { label, transaction: transactionToSend })
        context.commit('clearGeneratedTransaction')
        if (context.state.notifications.transactions) {
          createNotification({
            title: i18n.t('send_tx_notification_title'),
            body: i18n.t('send_tx_notification_body', {
              variable: cropString(
                transactionToSend.transaction_id,
                12,
                'middle',
              ),
            }),
          })
        }
      } else {
        context.commit('setError', {
          name: 'sendTransaction',
          error: request.error.message,
          message: i18n.t('send_transaction_error_message'),
        })
        context.commit('clearGeneratedTransaction')
      }
    },
    saveLabel: async function(context, { label, transaction }) {
      const transactionId = transaction.transactionId
      context.state.txLabels[transactionId] = { label }
      const txLabels = context.state.txLabels
      const request = await context.state.api.saveItem({
        wallet_id: context.rootState.wallet.walletId,
        session_id: context.rootState.wallet.sessionId,
        key: `${context.rootState.wallet.walletId}_labels`,
        value: txLabels,
      })
      if (request.result) {
        console.log('label saved!', request.result)
      } else {
        // TODO: improve error handling
        context.commit('setError', {
          name: 'saveItem',
          error: request.error.message,
          message: i18n.t('save_label_error_message'),
        })
      }
    },
    createDataRequest: async function(context, { label, parameters, request }) {
      // TODO(#1760): When the wallet is ready, the generated transaction values should be strings
      const data = {
        session_id: this.state.wallet.sessionId,
        wallet_id: this.state.wallet.walletId,
        label,
        fee: standardizeWitUnits(parameters.fee, WIT_UNIT.NANO),
        request: {
          data_request: encodeDataRequest(request),
          collateral: standardizeWitUnits(
            parameters.collateral,
            WIT_UNIT.NANO,
            WIT_UNIT.WIT,
          ),
          witness_reward: standardizeWitUnits(
            parameters.rewardFee,
            WIT_UNIT.NANO,
          ),
          witnesses: parameters.witnesses,
          commit_and_reveal_fee: standardizeWitUnits(
            parameters.commitAndRevealFee,
            WIT_UNIT.NANO,
          ),
          min_consensus_percentage: parameters.minConsensusPercentage,
        },
      }
      const req = await context.state.api.createDataRequest(data)
      if (req.result) {
        const generatedTransaction = req.result
        context.commit('setGeneratedTransaction', {
          transaction: generatedTransaction,
        })
      } else {
        context.commit('setError', {
          name: 'createDataRequest',
          error: req.error.message,
          message: req.error.data[0] ? req.error.data[0][1] : null,
        })
      }
    },
    createVTT: async function(context, { address, amount, fee, label }) {
      // TODO(#1760): When the wallet is ready, the generated transaction values should be strings
      const request = await context.state.api.createVTT({
        session_id: this.state.wallet.sessionId,
        wallet_id: this.state.wallet.walletId,
        outputs: [
          {
            address: address,
            amount: standardizeWitUnits(
              amount,
              WIT_UNIT.NANO,
              context.state.unit,
            ),
          },
        ],
        fee: standardizeWitUnits(fee, WIT_UNIT.NANO),
        label,
      })
      if (request.result) {
        const generatedTransaction = request.result
        context.commit('setGeneratedTransaction', {
          transaction: generatedTransaction,
        })
      } else {
        let error = i18n.t('vtt_error')
        if (request.error.data[0]) {
          const usableBalance = JSON.parse(request.error.data[0][0])
          const availableBalance = context.state.balance.available
          const unit = context.state.unit
          if (
            usableBalance &&
            usableBalance.available_balance < availableBalance
          ) {
            error = i18n.t('vtt_balance_error', {
              pending_balance: `${standardizeWitUnits(
                availableBalance - usableBalance.available_balance,
                unit,
              )} ${unit}`,
            })
          } else {
            error = request.error.data[0][1]
          }
        } else if (request.error.data.cause) {
          error = request.error.data.cause
        }
        await context.commit('setError', {
          name: 'createVTT',
          error: request.error.message,
          message: error,
        })
      }
    },

    getAddresses: async function(context) {
      const request = await context.state.api.getAddresses({
        wallet_id: context.state.walletId,
        session_id: context.state.sessionId,
      })
      if (request.result) {
        context.commit('setAddresses', { addresses: request.result })
        this.commit('clearError', { error: 'getAddresses' })
      } else {
        context.commit('setError', {
          name: 'getAddresses',
          error: request.error.message,
          message: i18n.t('get_addresses_error_message'),
        })
      }
    },
    generateAddress: async function(context, { label, external = true }) {
      context.commit('generateAddressLoading', null, { root: true })

      const request = await context.state.api.generateAddress({
        label,
        wallet_id: context.state.walletId,
        session_id: context.state.sessionId,
        external,
      })
      if (request.result) {
        // Delay to get a smoother flow
        setTimeout(() => {
          context.dispatch('getAddresses')
        }, GENERATE_ADDRESS_DELAY)
      } else {
        context.commit('setError', {
          name: 'generateAddress',
          error: request.error.message,
          message: i18n.t('generate_address_error_message'),
        })
      }
    },

    unlockWallet: async function(context, { walletId, password }) {
      context.commit('deleteSession')
      const request = await context.state.api.unlockWallet({
        wallet_id: walletId,
        password,
        session_id: '1',
        prefill: [1000, 2000, 3000],
      })
      if (request.result) {
        // TODO(#706) We should receive a wallet structure instead a walletId
        context.commit('setWallet', {
          sessionId: request.result.session_id,
          walletId,
        })
        const walletInfos = context.state.walletInfos
        const index = walletInfos.findIndex(wallet => wallet.id === walletId)

        context.commit('setWalletIndex', { walletIndex: index })
        context.commit(
          'startSessionTimeout',
          request.result.session_expiration_secs * 1000,
        )

        context.dispatch('subscribeToWalletNotifications')
      } else {
        context.commit('setError', {
          name: 'unlockWallet',
          error: request.error.message,
        })
      }
    },

    lockWallet: async function(context, { walletId, wipe }) {
      const request = await context.state.api.lockWallet({
        wallet_id: walletId,
        wipe,
      })
      if (request.result) {
        context.commit('lockWallet', context.store.wallet.id)
      } else {
        context.commit('setError', 'lockWallet', request.error)
      }
    },

    createMnemonics: async function(context) {
      const request = await context.state.api.createMnemonics({ length: 12 })

      if (request.result) {
        context.commit('setMnemonics', request.result.mnemonics)
      } else {
        context.commit('setError', {
          name: 'createMnemonics',
          error: request.error.message,
          message: i18n.t('create_mnemonics_error_message'),
        })
      }
    },

    validateImportedWallet: async function(context, params) {
      const importType = params.mnemonics ? 'mnemonics' : 'xprv'
      const request = await context.state.api.validateMnemonics({
        seed_source: importType,
        seed_data: params[importType],
        backup_password: params.backupPassword ? params.backupPassword : null,
        password: params.password ? params.password : null,
      })
      if (request.error) {
        context.commit('setError', {
          name: importType,
          error: i18n.t('validate_imported_wallet_error', {
            variable: importType,
          }),
          message: request.error.data[0][1],
        })
      } else if (request.result.exist) {
        this.commit('setRepeatedWallet', { exist: request.result.exist })
      }
    },

    createWallet: async function(context, params) {
      const request = await context.state.api.createWallet({
        overwrite: context.state.repeatedWallet,
        name: context.state.title,
        description: context.state.description,
        seed_data: params[params.sourceType],
        seed_source: params.sourceType,
        password: params.password,
        backup_password: params.backupPassword,
      })

      context.commit('setWalletDescription', { title: '', description: '' })
      context.commit('setRepeatedWallet', { exist: null })
      if (request.result) {
        context.dispatch('unlockWallet', {
          walletId: request.result.wallet_id,
          password: params.password,
        })
        context.commit('clearSeed')
        context.commit('clearMnemonics')
        context.commit('clearXprvInfo')
        context.commit('clearXprvBackupPassword')
      } else {
        context.commit('setError', {
          name: 'createWallet',
          error: request.error.data[0][1],
          message: i18n.t('create_wallet_error_message'),
        })
        context.commit('clearSeed')
        context.commit('clearMnemonics')
        context.commit('clearXprvInfo')
        context.commit('clearXprvBackupPassword')
        params.sourceType === 'mnemonics'
          ? router.push('/ftu/import-wallet')
          : router.push('/ftu/import-xprv')
      }
    },

    getTransactions: async function(context, payload = { page: null }) {
      const currentPage = Number.isInteger(payload.page)
        ? payload.page
        : context.state.currentTransactionsPage
      const offset = (currentPage - 1) * TRANSACTIONS_LIMIT
      const request = await context.state.api.getTransactions({
        wallet_id: context.state.walletId,
        session_id: context.state.sessionId,
        limit: TRANSACTIONS_LIMIT,
        offset,
      })
      if (request.result) {
        context.commit('setTransactions', request.result)
        context.dispatch('getBalance')
        this.commit('clearError', { error: 'getTransactions' })
      } else {
        context.commit('setError', {
          name: 'getTransactions',
          error: request.error.message,
          message: i18n.t('get_tx_error_message'),
        })
      }
    },

    getBalance: async function(context) {
      const request = await context.state.api.getBalance({
        wallet_id: context.state.walletId,
        session_id: context.state.sessionId,
      })
      if (request.result) {
        context.commit('setBalance', { balance: request.result })
        this.commit('clearError', { error: 'getBalance' })
      } else {
        if (request.error.message === 'Unauthorized') {
          context.commit('deleteSession')
          router.push('/welcome-back/wallet-list')
        } else {
          context.commit('setError', {
            name: 'getBalance',
            error: request.error.message,
            message: i18n.t('get_balance_error_message'),
          })
        }
      }
    },
    getUnit: async function(context) {
      const unit = context.state.localStorage.getUnitSettings()
      const defaultUnit = context.state.unit
      unit
        ? context.commit('setUnit', unit)
        : context.commit('setUnit', defaultUnit)
    },
    getLocale: async function(context, payload) {
      const locale = context.state.localStorage.getLanguageSettings()
      if (locale) {
        context.commit('setLanguage', {
          locale: locale,
          i18n: payload.i18n,
        })
      } else {
        context.commit('setLanguage', {
          locale: payload.i18n.locale,
          i18n: payload.i18n,
        })
      }
    },
    getTheme: async function(context) {
      const theme = context.state.localStorage.getThemeSettings()
      const defaultTheme = DEFAULT_THEME
      if (theme) {
        context.commit('setTheme', theme)
      } else {
        context.commit('setTheme', defaultTheme)
      }
    },
    getNotifications: async function(context) {
      const notifications = context.state.localStorage.getNotificationsSettings()
      const defaultNotifications = context.state.notifications
      if (notifications) {
        context.commit('setNotifications', notifications)
      } else {
        context.commit('setNotifications', defaultNotifications)
      }
    },
    getWalletInfos: async function(context) {
      const request = await context.state.api.getWalletInfos()
      if (request.result) {
        context.commit('setWalletInfos', { walletInfos: request.result })
      } else {
        context.commit('setError', {
          name: 'getWalletInfos',
          error: request.error.message,
          message: i18n.t('get_wallet_infos_error_message'),
        })
      }
    },
    subscribeToWalletNotifications: async function(context) {
      await context.state.api.subscribeToNotifications(
        { session_id: this.state.wallet.sessionId },
        ([notifications]) => {
          if (notifications.events.length > 0) {
            for (const event of notifications.events) {
              context.dispatch('processEvent', {
                event,
                status: notifications.status,
              })
            }
          } else {
            const eventProcessed = context.state.eventProcessor.processNotification(
              notifications.status,
            )
            context.commit('setStatus', eventProcessed)
          }
        },
      )
    },
    unsubscribeFromWalletNotifications: async function(context) {
      await context.state.api.unsubscribeFromNotifications({
        session_id: this.state.wallet.sessionId,
      })
    },
    tryDataRequest: async function(context) {
      context.commit('generateRadRequestResultLoading', { root: true })
      context.rootState.rad.currentTemplate.usedVariables.forEach(variable => {
        const id = variable.id
        const value = variable.value
        context.commit(UPDATE_TEMPLATE, { id, value })
      })
      const request = await context.state.api.runRadRequest({
        rad_request: encodeDataRequest(
          context.rootState.rad.currentRadonMarkupInterpreter.getMir(),
        ),
      })
      if (request.result) {
        context.commit('setDataRequestResult', { result: request.result })
        context.commit('clearGenerateRadRequestResultLoading', { root: true })
      } else {
        context.commit('setError', {
          name: 'tryDataRequest',
          error: request.error.message,
          message: i18n.t('try_dr_error_message'),
        })
      }
      context.rootState.rad.currentTemplate.usedVariables.forEach(variable => {
        const id = variable.id
        const key = variable.variable
        context.commit(UPDATE_TEMPLATE, { id, value: '$' + key })
      })
    },
    nodeMovement: async function(context, event) {
      await context.dispatch('getTransactions')
      const balance = standardizeBalance({
        result: context.state.status.balance,
      })
      context.commit('setBalance', {
        balance,
      })
      context.dispatch('getAddresses')
      const amount = standardizeWitUnits(event.amount, context.state.unit)
      const total = standardizeWitUnits(
        balance.result.total,
        context.state.unit,
      )
      if (
        event.type === 'POSITIVE' &&
        context.state.notifications.transactions
      ) {
        createNotification({
          title: i18n.t('received_tx_notification_title', {
            variable: `${amount} ${context.state.unit}s`,
          }),
          body: i18n.t('received_tx_notification_body', {
            variable: `${total} ${context.state.unit}s`,
          }),
        })
      }
    },
    syncFinished: async function(context, event) {
      context.dispatch('retrieveWalletMovements')
      context.commit('stopSyncEstimator')
      const [start, finish] = event
      if (finish > start) {
        if (context.state.notifications.syncronization) {
          createNotification({
            title: i18n.t('synced_notification_title'),
            body: i18n.t('synced_notification_body', {
              range: `${finish - start}`,
              finish: `(#${finish}).`,
            }),
          })
        }
      }
    },
    syncProgress: async function(context, event) {
      if (!context.state.syncingTimeEstimator.hasStarted()) {
        context.commit('startSyncEstimator')
      }
      // eslint-disable-next-line
      const [_start, current, finish] = event
      context.commit('addSyncEstimatorSample', { current, finish })
      // Re-render transactions, balances and wallets every 2000 blocks
      if (Math.floor((current - 50) / 2000) < Math.floor(current / 2000)) {
        context.dispatch('retrieveWalletMovements')
      }
    },
    syncStart: async function(context, event) {
      const [start, finish] = event
      context.dispatch('retrieveWalletMovements')
      context.commit('stopSyncEstimator')
      context.commit('startSyncEstimator')
      if (finish - start > 100) {
        if (context.state.notifications.syncronization) {
          createNotification({
            title: i18n.t('sync_start_notification_title'),
            body: i18n.t('sync_start_notification_body', {
              range: `${finish - start}`,
              start: `#${start}`,
              finish: `(#${finish}).`,
            }),
          })
        }
      }
    },
    retrieveWalletMovements: async function(context, event) {
      await context.dispatch('getTransactions')
      const balance = standardizeBalance({
        result: context.state.status.balance,
      })
      context.commit('setBalance', {
        balance,
      })
      context.dispatch('getAddresses')
      if (event && context.state.notifications.block) {
        if (Array.isArray(event)) {
          createNotification({
            title: i18n.t('blocks_confirmed_notification_title', {
              variable: event.length,
            }),
            body: `${event[0]} ... ${event[event.length - 1]}`,
          })
        } else {
          createNotification({
            title: i18n.t('block_notification_title', {
              variable: event.epoch,
            }),
            body: event.block_hash,
          })
        }
      }
    },
    processEvent: async function(context, rawEvent) {
      const eventProcessed = context.state.eventProcessor.processEvent(rawEvent)
      const { eventType, event } = eventProcessed
      context.commit('setStatus', eventProcessed)

      if (
        eventType === WALLET_EVENTS.BLOCK ||
        eventType === WALLET_EVENTS.BLOCK_CONSOLIDATE ||
        eventType === WALLET_EVENTS.BLOCK_ORPHAN
      ) {
        context.dispatch('retrieveWalletMovements', event)
      } else if (eventType === WALLET_EVENTS.MOVEMENT) {
        context.dispatch('nodeMovement', event)
      } else if (eventType === WALLET_EVENTS.SYNC_FINISH) {
        context.dispatch('syncFinished', event)
      } else if (eventType === WALLET_EVENTS.SYNC_PROGRESS) {
        context.dispatch('syncProgress', event)
      } else if (eventType === WALLET_EVENTS.SYNC_START) {
        context.dispatch('syncStart', event)
      }
    },
    resync(context) {
      context.state.api.resync({
        wallet_id: context.state.walletId,
        session_id: context.state.sessionId,
      })
    },
  },
}
