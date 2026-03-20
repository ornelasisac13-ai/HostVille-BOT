// ===============================
// utils/constants.js - CONFIGURAÇÕES E CONSTANTES
// ===============================

const CONFIG = {
  logChannelId: process.env.LOG_CHANNEL_ID,
  adminRoles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : [],
  ACCESS_CODE: process.env.ACCESS_CODE,
  STAFF_USER_ID: process.env.STAFF_USER_ID,
  OWNER_ID: process.env.OWNER_ID,
  DAILY_REPORT_TIME: process.env.DAILY_REPORT_TIME || '12:00',
};

module.exports = { CONFIG };
