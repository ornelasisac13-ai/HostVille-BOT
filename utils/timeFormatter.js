// ===============================
// utils/timeFormatter.js - FUNÇÃO PARA FORMATAR TEMPO
// ===============================
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return `${days}d ${hours % 24}h ${minutes % 60}m`;
}

module.exports = { formatTime };
