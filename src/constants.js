import i18n from '@/plugins/i18n'
import { es, enGB } from 'date-fns/locale'

export const EDITOR_ALLOWED_PROTOCOLS = ['http', 'https']

export const EDITOR_EXPORT_FORMAT = {
  JSON: 'json',
  js: 'js',
}

export const TRANSACTIONS_LIMIT = 13
export const EDITOR_TRY_INTERVAL = 3000
export const EDITOR_SAVE_INTERVAL = 3000

export const NETWORK_STATUS = {
  NODE_DISCONNECTED: 'node_disconnected',
  SYNCED: 'synced',
  SYNC_ERROR: 'sync_error',
  SYNCING: 'syncing',
  WAITING_FOR_NODE_TO_SYNC: 'waiting_for_node_to_sync',
}

export const EDITOR_STAGES = {
  SETTINGS: 'settings',
  SOURCES: 'sources',
  SCRIPTS: 'scripts',
  AGGREGATIONS: 'aggregations',
  TALLY: 'tally',
}

export const SOURCES_WITH_REDUCED_DISCLAIMERS = [
  'tip',
  'stakeholder',
  'founder',
]

export const LANGUAGES = {
  es: { name: 'Español', locale: 'es', fnsLocale: es },
  en: { name: 'English', locale: 'en', fnsLocale: enGB },
}

export const DEFAULT_LOCALE = 'en'

export const CUSTOM_ICON_NAMES = [
  'add-operator',
  'add',
  'close-btn',
  'close-btn-light',
  'close',
  'delete-btn',
  'disconnected',
  'down',
  'exit-icon',
  'long-arrow',
  'negative',
  'open',
  'operator-arrow',
  'options-marketplace',
  'options',
  'positive',
  'sheikah-icon',
  'sheikah-small',
  'sheikah',
  'sort-down',
  'sort-up',
  'up',
]

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const DEFAULT_THEME = THEMES.LIGHT

export const WIT_UNIT = {
  WIT: 'Wit',
  MILLI: 'milliWit',
  MICRO: 'microWit',
  NANO: 'nanoWit',
}

export const DEFAULT_WIT_UNIT = WIT_UNIT.WIT

export const WALLET_EVENTS = {
  BLOCK: 'Block',
  MOVEMENT: 'Movement',
  SYNC_FINISH: 'SyncFinish',
  SYNC_PROGRESS: 'SyncProgress',
  SYNC_START: 'SyncStart',
  BLOCK_CONSOLIDATE: 'BlocksConsolidate',
  BLOCK_ORPHAN: 'BlocksOrphan',
  NODE_STATUS_CHANGED: 'NodeStatus',
  NODE_SYNC_ERROR: 'SyncError',
  NODE_DISCONNECTED: 'NodeDisconnected',
}

// Generate address delay in ms
export const GENERATE_ADDRESS_DELAY = 300

export const HISTORY_UPDATE_TYPE = {
  DELETE_OPERATOR: 'DELETE_OPERATOR',
  PUSH_OPERATOR: 'PUSH_OPERATOR',
  DELETE_SOURCE: 'DELETE_SOURCE',
  ADD_SOURCE: 'ADD_SOURCE',
  UPDATE_TEMPLATE: 'UPDATE_TEMPLATE',
  UPDATE_SOURCE: 'UPDATE_SOURCE',
  UPDATE_VARIABLE: 'UPDATE_VARIABLE',
  ADD_VARIABLE: 'ADD_VARIABLE',
  DELETE_VARIABLE: 'DELETE_VARIABLE',
  UPDATE_DESCRIPTION: 'UPDATE_DESCRIPTION',
  UPDATE_NAME: 'UPDATE_NAME',
}

export const EXTERNAL_URL = {
  BALANCE_LOCKED: 'https://witnet.io',
  SHEIKAH_WEBSITE: 'https://sheikah.app/',
}

export const GENESIS_EVENT_TIMESTAMP = 1602666000000

// Syncing time estimador
export const SYNCING_TIME_WINDOW_LENGTH = 100

export const NOTIFICATIONS = {
  BLOCK: {
    key: 'block',
    title: l => i18n.t('block_notifications_title', { locale: l }),
  },
  TRANSACTIONS: {
    key: 'transactions',
    title: l => i18n.t('tx_notifications_title', { locale: l }),
  },
  PAYMENTS: {
    key: 'payments',
    title: l => i18n.t('payments_notifications_title', { locale: l }),
  },
  SYNCRONIZATION: {
    key: 'syncronization',
    title: l => i18n.t('syncronization_notifications_title', { locale: l }),
  },
}

export const SETTINGS = {
  UNIT: 'UNIT',
  RESYNC: 'RESYNC',
  EXPORT_XPRV: 'EXPORT_XPRV',
  COMMUNITY: 'COMMUNITY',
  NOTIFICATIONS: 'NOTIFICATIONS',
  LANGUAGE: 'LANGUAGE',
  APPEARANCE: 'APPEARANCE',
}

export const SETTINGS_SECTIONS = {
  GENERAL: 'GENERAL',
  ADVANCED: 'ADVANCED',
  NOTIFICATIONS: 'NOTIFICATIONS',
  ABOUT: 'ABOUT',
}

export const SETTINGS_BY_SECTION = {
  // TODO: include SETTINGS.LASGUAGE within general settings section when the transalations are ready
  GENERAL: [SETTINGS.UNIT, SETTINGS.APPEARANCE, SETTINGS.LANGUAGE],
  ADVANCED: [SETTINGS.EXPORT_XPRV, SETTINGS.RESYNC],
  NOTIFICATIONS: [SETTINGS.NOTIFICATIONS],
  ABOUT: [SETTINGS.COMMUNITY],
}

export const TEMPLATES_PER_PAGE = 12
