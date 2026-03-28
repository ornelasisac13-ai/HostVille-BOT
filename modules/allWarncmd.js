// ===============================
// allWarncmd.js - CONFIGURAÇÕES COMPLETAS DOS COMANDOS DE WARN
// ===============================
// Local: ./modules/allWarncmd.js
// Versão: 3.0.0
// ===============================

const { 
  Colors, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

// ===============================
// CONFIGURAÇÕES DOS SUBCOMANDOS /warn
// ===============================

// ========== SUBCOMANDO ADD ==========
const warnAddConfig = {
  name: 'add',
  description: '➕ Adicionar warn a um usuário',
  type: 1,
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true },
    { name: 'user', type: 6, description: '👤 Usuário a ser warnado', required: true },
    { name: 'reason', type: 3, description: '📋 Motivo do warn', required: true },
    { name: 'duration', type: 4, description: '⏰ Duração em dias (0 = permanente)', required: false }
  ]
};

// ========== SUBCOMANDO REMOVE ==========
const warnRemoveConfig = {
  name: 'remove',
  description: '🗑️ Remover um warn específico',
  type: 1,
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true },
    { name: 'user', type: 6, description: '👤 Usuário', required: true },
    { name: 'warnid', type: 3, description: '🆔 ID do warn a remover', required: true },
    { name: 'reason', type: 3, description: '📋 Motivo da remoção', required: true }
  ]
};

// ========== SUBCOMANDO CLEAR ==========
const warnClearConfig = {
  name: 'clear',
  description: '🧹 Limpar todos os warns de um usuário',
  type: 1,
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true },
    { name: 'user', type: 6, description: '👤 Usuário', required: true },
    { name: 'reason', type: 3, description: '📋 Motivo da limpeza', required: true }
  ]
};

// ========== SUBCOMANDO CHECK ==========
const warnCheckConfig = {
  name: 'check',
  description: '🔍 Verificar warns de um usuário',
  type: 1,
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true },
    { name: 'user', type: 6, description: '👤 Usuário', required: true }
  ]
};

// ========== SUBCOMANDO STATS ==========
const warnStatsConfig = {
  name: 'stats',
  description: '📊 Estatísticas de warns',
  type: 1,
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true },
    { name: 'user', type: 6, description: '👤 Ver estatísticas de um usuário', required: false }
  ]
};

// ===============================
// COMANDOS DE ATALHO
// ===============================

// Comando /warnings (atalho para check)
const warningsCommandData = {
  name: 'warnings',
  description: '[Atalho] 🔍 Ver warns de um usuário',
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true },
    { name: 'user', type: 6, description: '👤 Usuário', required: true }
  ]
};

// Comando /clearwarns (atalho para clear)
const clearwarnsCommandData = {
  name: 'clearwarns',
  description: '[Atalho] 🧹 Limpar warns de um usuário',
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true },
    { name: 'user', type: 6, description: '👤 Usuário', required: true },
    { name: 'reason', type: 3, description: '📋 Motivo', required: false }
  ]
};

// Comando /warnstats (atalho para stats)
const warnstatsCommandData = {
  name: 'warnstats',
  description: '[Atalho] 📊 Estatísticas de warns',
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true },
    { name: 'user', type: 6, description: '👤 Usuário', required: false }
  ]
};

// Comando /mywarns (para usuários verem seus próprios warns)
const mywarnsCommandData = {
  name: 'mywarns',
  description: '👤 Ver seus próprios warns',
  options: [
    { name: 'code', type: 3, description: '🔐 Código de acesso', required: true }
  ]
};

// ===============================
// CONFIGURAÇÃO PRINCIPAL DO COMANDO /warn
// ===============================
const warnCommandData = {
  name: 'warn',
  description: '⚠️ Sistema completo de warns',
  options: [
    warnAddConfig,
    warnRemoveConfig,
    warnClearConfig,
    warnCheckConfig,
    warnStatsConfig
  ]
};

// ===============================
// FUNÇÕES AUXILIARES - EMOJIS E CORES
// ===============================

// Função para obter emoji baseado no nível de risco
function getRiskEmoji(warnCount) {
  if (warnCount >= 7) return '💀';
  if (warnCount >= 5) return '🔴';
  if (warnCount >= 3) return '🟠';
  if (warnCount >= 1) return '🟡';
  return '🟢';
}

// Função para obter cor baseada no nível de risco
function getRiskColor(warnCount) {
  if (warnCount >= 7) return Colors.DarkRed;
  if (warnCount >= 5) return Colors.Red;
  if (warnCount >= 3) return Colors.Orange;
  if (warnCount >= 1) return Colors.Yellow;
  return Colors.Green;
}

// Função para obter texto do nível de risco
function getRiskLevel(warnCount) {
  if (warnCount >= 7) return 'CRÍTICO';
  if (warnCount >= 5) return 'ALTO';
  if (warnCount >= 3) return 'MÉDIO';
  if (warnCount >= 1) return 'BAIXO';
  return 'NENHUM';
}

// Função para formatar data
function formatDate(timestamp) {
  if (!timestamp) return 'Nunca';
  const date = new Date(timestamp);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
}

// Função para formatar duração
function formatDuration(days) {
  if (days === 0) return 'Permanente';
  if (days === 1) return '1 dia';
  if (days < 30) return `${days} dias`;
  if (days < 365) return `${Math.floor(days / 30)} meses`;
  return `${Math.floor(days / 365)} anos`;
}

// ===============================
// FUNÇÕES DE EMBED - COMPLETAS E DETALHADAS
// ===============================

// ========== EMBED DE WARN ADICIONADO ==========
function createWarnAddEmbed(user, moderator, reason, warnCount, warnId, duration) {
  const riskLevel = getRiskLevel(warnCount);
  const riskEmoji = getRiskEmoji(warnCount);
  const riskColor = getRiskColor(warnCount);
  
  const embed = new EmbedBuilder()
    .setTitle(`⚠️ ${riskEmoji} WARN ADICIONADO ${riskEmoji}`)
    .setColor(riskColor)
    .setDescription(`┌─────────────────────────────────────────┐\n│  ⚠️ **WARN REGISTRADO COM SUCESSO**  │\n└─────────────────────────────────────────┘`)
    .addFields(
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '👤 **USUÁRIO**',
        value: `┌─────────────────────────────┐\n│ ${user.toString()}\n│ **Tag:** ${user.tag}\n│ **ID:** \`${user.id}\`\n└─────────────────────────────┘`,
        inline: true
      },
      {
        name: '🛡️ **MODERADOR**',
        value: `┌─────────────────────────────┐\n│ ${moderator.toString()}\n│ **Tag:** ${moderator.tag}\n│ **ID:** \`${moderator.id}\`\n└─────────────────────────────┘`,
        inline: true
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '📋 **MOTIVO**',
        value: `\`\`\`ansi\n\u001b[1;33m${reason.substring(0, 500)}\u001b[0m\n\`\`\``,
        inline: false
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '⚠️ **WARNS ATIVOS**',
        value: `\`\`\`diff\n+ ${warnCount} warn(s) ativo(s)\n\`\`\``,
        inline: true
      },
      {
        name: '📊 **NÍVEL DE RISCO**',
        value: `\`\`\`css\n[ ${riskLevel} ] ${riskEmoji}\n\`\`\``,
        inline: true
      },
      {
        name: '🆔 **ID DO WARN**',
        value: `\`\`\`ini\n[${warnId}]\n\`\`\``,
        inline: true
      }
    )
    .setFooter({ 
      text: `Sistema de Warns • ID: ${warnId} • ${new Date().toLocaleString('pt-BR')}`,
      iconURL: moderator.displayAvatarURL({ dynamic: true })
    })
    .setTimestamp();

  if (duration > 0) {
    embed.addFields({
      name: '⏰ **EXPIRA EM**',
      value: `\`\`\`yaml\n${formatDuration(duration)}\n\`\`\``,
      inline: true
    });
  }

  return embed;
}

// ========== EMBED DE WARN REMOVIDO ==========
function createWarnRemoveEmbed(user, warnId, reason, moderator) {
  const embed = new EmbedBuilder()
    .setTitle('✅ WARN REMOVIDO')
    .setColor(Colors.Green)
    .setDescription(`┌─────────────────────────────────────────┐\n│  ✅ **WARN REMOVIDO COM SUCESSO**   │\n└─────────────────────────────────────────┘`)
    .addFields(
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '👤 **USUÁRIO**',
        value: `┌─────────────────────────────┐\n│ ${user.toString()}\n│ **Tag:** ${user.tag}\n│ **ID:** \`${user.id}\`\n└─────────────────────────────┘`,
        inline: true
      },
      {
        name: '🛡️ **MODERADOR**',
        value: `┌─────────────────────────────┐\n│ ${moderator.toString()}\n│ **Tag:** ${moderator.tag}\n│ **ID:** \`${moderator.id}\`\n└─────────────────────────────┘`,
        inline: true
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '🆔 **ID DO WARN**',
        value: `\`\`\`ini\n[${warnId}]\n\`\`\``,
        inline: true
      },
      {
        name: '📋 **MOTIVO DA REMOÇÃO**',
        value: `\`\`\`ansi\n\u001b[1;32m${reason.substring(0, 300)}\u001b[0m\n\`\`\``,
        inline: false
      }
    )
    .setFooter({ 
      text: `Sistema de Warns • ${new Date().toLocaleString('pt-BR')}`,
      iconURL: moderator.displayAvatarURL({ dynamic: true })
    })
    .setTimestamp();

  return embed;
}

// ========== EMBED DE WARNS LIMPOS ==========
function createWarnClearEmbed(user, clearedCount, reason, moderator) {
  const embed = new EmbedBuilder()
    .setTitle('🧹 WARNS LIMPOS')
    .setColor(Colors.Green)
    .setDescription(`┌─────────────────────────────────────────┐\n│  🧹 **TODOS OS WARNS FORAM LIMPOS**  │\n└─────────────────────────────────────────┘`)
    .addFields(
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '👤 **USUÁRIO**',
        value: `┌─────────────────────────────┐\n│ ${user.toString()}\n│ **Tag:** ${user.tag}\n│ **ID:** \`${user.id}\`\n└─────────────────────────────┘`,
        inline: true
      },
      {
        name: '🛡️ **MODERADOR**',
        value: `┌─────────────────────────────┐\n│ ${moderator.toString()}\n│ **Tag:** ${moderator.tag}\n│ **ID:** \`${moderator.id}\`\n└─────────────────────────────┘`,
        inline: true
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '🧹 **WARNS REMOVIDOS**',
        value: `\`\`\`diff\n+ ${clearedCount} warn(s) removido(s)\n\`\`\``,
        inline: true
      },
      {
        name: '📋 **MOTIVO DA LIMPEZA**',
        value: `\`\`\`ansi\n\u001b[1;32m${reason.substring(0, 300)}\u001b[0m\n\`\`\``,
        inline: false
      }
    )
    .setFooter({ 
      text: `Sistema de Warns • ${new Date().toLocaleString('pt-BR')}`,
      iconURL: moderator.displayAvatarURL({ dynamic: true })
    })
    .setTimestamp();

  return embed;
}

// ========== EMBED DE HISTÓRICO DE WARNS (CHECK) ==========
function createWarnCheckEmbed(user, userWarns) {
  const activeCount = userWarns?.activeCount || 0;
  const totalCount = userWarns?.count || 0;
  const riskLevel = getRiskLevel(activeCount);
  const riskEmoji = getRiskEmoji(activeCount);
  const riskColor = getRiskColor(activeCount);
  
  const embed = new EmbedBuilder()
    .setTitle(`${riskEmoji} HISTÓRICO DE WARNS ${riskEmoji}`)
    .setColor(riskColor)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(`┌─────────────────────────────────────────┐\n│  📜 **HISTÓRICO COMPLETO**          │\n└─────────────────────────────────────────┘`)
    .addFields(
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '👤 **USUÁRIO**',
        value: `┌─────────────────────────────┐\n│ ${user.toString()}\n│ **Tag:** ${user.tag}\n│ **ID:** \`${user.id}\`\n└─────────────────────────────┘`,
        inline: false
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '⚠️ **WARNS ATIVOS**',
        value: `\`\`\`css\n[ ${activeCount} warn(s) ativo(s) ]\n\`\`\``,
        inline: true
      },
      {
        name: '📊 **TOTAL DE WARNS**',
        value: `\`\`\`css\n[ ${totalCount} warn(s) total(is) ]\n\`\`\``,
        inline: true
      },
      {
        name: '📊 **NÍVEL DE RISCO**',
        value: `\`\`\`diff\n+ ${riskLevel} ${riskEmoji}\n\`\`\``,
        inline: true
      },
      {
        name: '📅 **PRIMEIRO WARN**',
        value: `\`\`\`yaml\n${formatDate(userWarns?.firstWarn)}\n\`\`\``,
        inline: true
      },
      {
        name: '📅 **ÚLTIMO WARN**',
        value: `\`\`\`yaml\n${formatDate(userWarns?.lastWarn)}\n\`\`\``,
        inline: true
      }
    )
    .setFooter({ 
      text: `ID do Usuário: ${user.id} • ${new Date().toLocaleString('pt-BR')}`,
      iconURL: user.displayAvatarURL({ dynamic: true })
    })
    .setTimestamp();

  // Adicionar lista de warns recentes
  if (userWarns?.history && userWarns.history.length > 0) {
    const recentWarns = userWarns.history.slice(-8).reverse();
    let warnsList = '';
    
    recentWarns.forEach((warn, index) => {
      const status = warn.active ? '🟢 ATIVO' : '🔴 INATIVO';
      const date = formatDate(warn.timestamp);
      warnsList += `\`\`\`ansi\n`;
      warnsList += `\u001b[1;33m#${recentWarns.length - index}\u001b[0m \u001b[1;36m${warn.id}\u001b[0m\n`;
      warnsList += `📋 Motivo: \u001b[1;37m${warn.reason.substring(0, 80)}${warn.reason.length > 80 ? '...' : ''}\u001b[0m\n`;
      warnsList += `🛡️ Moderador: <@${warn.moderatorId}>\n`;
      warnsList += `📅 Data: ${date}\n`;
      warnsList += `└── ${status}\n`;
      warnsList += `\`\`\`\n`;
    });
    
    embed.addFields({
      name: '📋 **ÚLTIMOS WARNS**',
      value: warnsList.substring(0, 1024),
      inline: false
    });
  } else {
    embed.addFields({
      name: '📋 **WARNS**',
      value: `\`\`\`diff\n- Nenhum warn registrado\n\`\`\``,
      inline: false
    });
  }

  return embed;
}

// ========== EMBED DE ESTATÍSTICAS DO SERVIDOR ==========
function createServerStatsEmbed(guild, serverStats) {
  const embed = new EmbedBuilder()
    .setTitle('📊 ESTATÍSTICAS DO SERVIDOR')
    .setColor(Colors.Gold)
    .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
    .setDescription(`┌─────────────────────────────────────────┐\n│  📊 **${guild.name}**                   │\n└─────────────────────────────────────────┘`)
    .addFields(
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '⚠️ **TOTAL DE WARNS**',
        value: `\`\`\`css\n[ ${serverStats.totalWarns} warn(s) ]\n\`\`\``,
        inline: true
      },
      {
        name: '🟢 **WARNS ATIVOS**',
        value: `\`\`\`css\n[ ${serverStats.activeWarns} warn(s) ]\n\`\`\``,
        inline: true
      },
      {
        name: '👥 **USUÁRIOS WANADOS**',
        value: `\`\`\`css\n[ ${serverStats.warnedUsers} usuário(s) ]\n\`\`\``,
        inline: true
      },
      {
        name: '📊 **MÉDIA POR USUÁRIO**',
        value: `\`\`\`yaml\n${serverStats.averageWarnsPerUser} warns/usuario\n\`\`\``,
        inline: true
      }
    )
    .setFooter({ 
      text: `ID do Servidor: ${guild.id} • ${new Date().toLocaleString('pt-BR')}`,
      iconURL: guild.iconURL({ dynamic: true })
    })
    .setTimestamp();

  // Top Moderadores
  if (serverStats.topModerators && serverStats.topModerators.length > 0) {
    let modsList = '';
    serverStats.topModerators.slice(0, 5).forEach((mod, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
      modsList += `${medal} <@${mod.id}>: **${mod.count}** warns\n`;
    });
    embed.addFields({
      name: '🛡️ **TOP MODERADORES**',
      value: `\`\`\`yaml\n${modsList}\`\`\``,
      inline: false
    });
  }

  // Top Motivos
  if (serverStats.topReasons && serverStats.topReasons.length > 0) {
    let reasonsList = '';
    serverStats.topReasons.slice(0, 5).forEach((reason, i) => {
      reasonsList += `${i+1}º **${reason.reason}**: ${reason.count}x\n`;
    });
    embed.addFields({
      name: '📋 **MOTIVOS MAIS COMUNS**',
      value: `\`\`\`yaml\n${reasonsList}\`\`\``,
      inline: false
    });
  }

  return embed;
}

// ========== EMBED DE ESTATÍSTICAS DO USUÁRIO ==========
function createUserStatsEmbed(user, userStats) {
  const riskLevel = getRiskLevel(userStats.activeWarns);
  const riskEmoji = getRiskEmoji(userStats.activeWarns);
  const riskColor = getRiskColor(userStats.activeWarns);
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 ESTATÍSTICAS DE ${user.username.toUpperCase()}`)
    .setColor(riskColor)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(`┌─────────────────────────────────────────┐\n│  📊 **ANÁLISE COMPLETA**               │\n└─────────────────────────────────────────┘`)
    .addFields(
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '👤 **USUÁRIO**',
        value: `┌─────────────────────────────┐\n│ ${user.toString()}\n│ **Tag:** ${user.tag}\n│ **ID:** \`${user.id}\`\n└─────────────────────────────┘`,
        inline: false
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'ㅤ',
        inline: false
      },
      {
        name: '⚠️ **TOTAL DE WARNS**',
        value: `\`\`\`css\n[ ${userStats.totalWarns} warn(s) ]\n\`\`\``,
        inline: true
      },
      {
        name: '🟢 **WARNS ATIVOS**',
        value: `\`\`\`css\n[ ${userStats.activeWarns} warn(s) ]\n\`\`\``,
        inline: true
      },
      {
        name: '📊 **NÍVEL DE RISCO**',
        value: `\`\`\`diff\n+ ${riskLevel} ${riskEmoji}\n\`\`\``,
        inline: true
      },
      {
        name: '📅 **PRIMEIRO WARN**',
        value: `\`\`\`yaml\n${formatDate(userStats.firstWarn)}\n\`\`\``,
        inline: true
      },
      {
        name: '📅 **ÚLTIMO WARN**',
        value: `\`\`\`yaml\n${formatDate(userStats.lastWarn)}\n\`\`\``,
        inline: true
      },
      {
        name: '⏱️ **INTERVALO MÉDIO**',
        value: `\`\`\`yaml\n${userStats.averageInterval} dias entre warns\n\`\`\``,
        inline: true
      }
    )
    .setFooter({ 
      text: `ID do Usuário: ${user.id} • ${new Date().toLocaleString('pt-BR')}`,
      iconURL: user.displayAvatarURL({ dynamic: true })
    })
    .setTimestamp();

  return embed;
}

// ===============================
// EXPORTAÇÃO DO MÓDULO (PARTE 1/3)
// ===============================
module.exports = {
  // Configurações dos subcomandos
  warnAddConfig,
  warnRemoveConfig,
  warnClearConfig,
  warnCheckConfig,
  warnStatsConfig,
  
  // Comandos de atalho
  warningsCommandData,
  clearwarnsCommandData,
  warnstatsCommandData,
  mywarnsCommandData,
  
  // Comando principal
  warnCommandData,
  
  // Funções auxiliares
  getRiskEmoji,
  getRiskColor,
  getRiskLevel,
  formatDate,
  formatDuration,
  
  // Funções de embed
  createWarnAddEmbed,
  createWarnRemoveEmbed,
  createWarnClearEmbed,
  createWarnCheckEmbed,
  createServerStatsEmbed,
  createUserStatsEmbed
};
// ===============================
// allWarncmd.js - PARTE 2/3
// FUNÇÕES DE PROCESSAMENTO E VALIDAÇÃO DOS COMANDOS DE WARN
// ===============================

// ===============================
// FUNÇÕES DE VALIDAÇÃO
// ===============================

// Validação de motivo
function validateReason(reason) {
  if (!reason || reason.trim().length === 0) {
    return { valid: false, error: '❌ O motivo não pode estar vazio!' };
  }
  
  if (reason.length < 3) {
    return { valid: false, error: '❌ O motivo deve ter pelo menos 3 caracteres!' };
  }
  
  if (reason.length > 500) {
    return { valid: false, error: '❌ O motivo não pode ter mais de 500 caracteres!' };
  }
  
  // Lista de palavras proibidas em motivos
  const forbiddenWords = ['sexo', 'puta', 'caralho', 'foda', 'merda', 'bosta'];
  const lowerReason = reason.toLowerCase();
  
  for (const word of forbiddenWords) {
    if (lowerReason.includes(word)) {
      return { valid: false, error: `❌ O motivo contém linguagem inadequada: "${word}"` };
    }
  }
  
  return { valid: true };
}

// Validação de usuário para warn
function validateUserForWarn(member, moderator) {
  if (!member) {
    return { valid: false, error: '❌ Usuário não encontrado no servidor!' };
  }
  
  if (member.user.bot) {
    return { valid: false, error: '❌ Não é possível warnar bots!' };
  }
  
  if (member.id === moderator.id) {
    return { valid: false, error: '❌ Você não pode warnar a si mesmo!' };
  }
  
  // Verificar se é staff ou admin (usando funções globais)
  if (global.isStaff && global.isStaff(member.id)) {
    return { valid: false, error: '❌ Não é possível warnar membros da staff!' };
  }
  
  if (global.isAdmin && global.isAdmin(member)) {
    return { valid: false, error: '❌ Não é possível warnar administradores!' };
  }
  
  return { valid: true };
}

// Validação de warn ID
function validateWarnId(warnId) {
  if (!warnId || warnId.trim().length === 0) {
    return { valid: false, error: '❌ ID do warn não pode estar vazio!' };
  }
  
  // Formato esperado: WRN-XXXXXXXX-XXXXXX
  const warnIdPattern = /^WRN-[A-Z0-9]+-[A-Z0-9]+$/i;
  if (!warnIdPattern.test(warnId)) {
    return { valid: false, error: '❌ Formato de ID inválido! O formato correto é: WRN-XXXXXXXX-XXXXXX' };
  }
  
  return { valid: true };
}

// Validação de duração
function validateDuration(duration) {
  if (duration === null || duration === undefined) return { valid: true };
  
  if (typeof duration !== 'number' || isNaN(duration)) {
    return { valid: false, error: '❌ Duração inválida!' };
  }
  
  if (duration < 0) {
    return { valid: false, error: '❌ A duração não pode ser negativa!' };
  }
  
  if (duration > 365) {
    return { valid: false, error: '❌ A duração máxima é de 365 dias!' };
  }
  
  return { valid: true };
}

// ===============================
// FUNÇÕES DE PROCESSAMENTO DE RESULTADOS
// ===============================

// Processa resultado de add warn e retorna mensagem formatada
function processAddResult(result, user, moderator, reason, duration) {
  if (!result.success) {
    return {
      success: false,
      message: `❌ **Erro ao adicionar warn:**\n\`\`\`\n${result.error}\n\`\`\``,
      embed: null
    };
  }
  
  const embed = createWarnAddEmbed(user, moderator, reason, result.warnCount, result.warnId, duration);
  
  return {
    success: true,
    message: null,
    embed: embed,
    warnCount: result.warnCount,
    warnId: result.warnId
  };
}

// Processa resultado de remove warn
function processRemoveResult(result, user, warnId, reason, moderator) {
  if (!result.success) {
    return {
      success: false,
      message: `❌ **Erro ao remover warn:**\n\`\`\`\n${result.error}\n\`\`\``,
      embed: null
    };
  }
  
  const embed = createWarnRemoveEmbed(user, warnId, reason, moderator);
  
  return {
    success: true,
    message: null,
    embed: embed
  };
}

// Processa resultado de clear warns
function processClearResult(result, user, reason, moderator) {
  if (!result.success) {
    return {
      success: false,
      message: `❌ **Erro ao limpar warns:**\n\`\`\`\n${result.error}\n\`\`\``,
      embed: null
    };
  }
  
  const embed = createWarnClearEmbed(user, result.clearedCount, reason, moderator);
  
  return {
    success: true,
    message: null,
    embed: embed,
    clearedCount: result.clearedCount
  };
}

// ===============================
// FUNÇÕES DE NOTIFICAÇÃO
// ===============================

// Envia notificação DM para o usuário sobre warn recebido
async function sendWarnNotification(user, guild, reason, warnCount, riskLevel, warnId, duration) {
  try {
    const riskEmoji = getRiskEmoji(warnCount);
    const riskColor = getRiskColor(warnCount);
    
    const embed = new EmbedBuilder()
      .setTitle(`⚠️ VOCÊ RECEBEU UM WARN`)
      .setColor(riskColor)
      .setDescription(`┌─────────────────────────────────────────┐\n│  ⚠️ **VOCÊ FOI WANADO EM ${guild.name}**  │\n└─────────────────────────────────────────┘`)
      .addFields(
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          value: 'ㅤ',
          inline: false
        },
        {
          name: '📋 **MOTIVO**',
          value: `\`\`\`ansi\n\u001b[1;33m${reason.substring(0, 300)}\u001b[0m\n\`\`\``,
          inline: false
        },
        {
          name: '⚠️ **WARNS ATIVOS**',
          value: `\`\`\`css\n[ ${warnCount} warn(s) ativo(s) ]\n\`\`\``,
          inline: true
        },
        {
          name: '📊 **NÍVEL DE RISCO**',
          value: `\`\`\`diff\n+ ${riskLevel} ${riskEmoji}\n\`\`\``,
          inline: true
        },
        {
          name: '🆔 **ID DO WARN**',
          value: `\`\`\`ini\n[${warnId}]\n\`\`\``,
          inline: true
        }
      )
      .setFooter({ 
        text: `Sistema de Warns • Caso seja um erro, use /warnappeal`,
        iconURL: guild.iconURL({ dynamic: true })
      })
      .setTimestamp();
    
    if (duration > 0) {
      embed.addFields({
        name: '⏰ **EXPIRA EM**',
        value: `\`\`\`yaml\n${formatDuration(duration)}\n\`\`\``,
        inline: true
      });
    }
    
    await user.send({ embeds: [embed] });
    return true;
  } catch (error) {
    return false;
  }
}

// Envia notificação DM sobre warn removido
async function sendWarnRemovedNotification(user, guild, warnId, reason, moderator) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(`✅ WARN REMOVIDO`)
      .setColor(Colors.Green)
      .setDescription(`┌─────────────────────────────────────────┐\n│  ✅ **SEU WARN FOI REMOVIDO**           │\n└─────────────────────────────────────────┘`)
      .addFields(
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          value: 'ㅤ',
          inline: false
        },
        {
          name: '🆔 **ID DO WARN**',
          value: `\`\`\`ini\n[${warnId}]\n\`\`\``,
          inline: true
        },
        {
          name: '📋 **MOTIVO DA REMOÇÃO**',
          value: `\`\`\`ansi\n\u001b[1;32m${reason}\u001b[0m\n\`\`\``,
          inline: false
        },
        {
          name: '🛡️ **MODERADOR**',
          value: moderator.tag,
          inline: true
        }
      )
      .setFooter({ 
        text: `Sistema de Warns • ${guild.name}`,
        iconURL: guild.iconURL({ dynamic: true })
      })
      .setTimestamp();
    
    await user.send({ embeds: [embed] });
    return true;
  } catch (error) {
    return false;
  }
}

// Envia notificação DM sobre warns limpos
async function sendWarnsClearedNotification(user, guild, clearedCount, reason, moderator) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(`🧹 SEUS WARNS FORAM LIMPOS`)
      .setColor(Colors.Green)
      .setDescription(`┌─────────────────────────────────────────┐\n│  🧹 **TODOS OS SEUS WARNS FORAM LIMPOS** │\n└─────────────────────────────────────────┘`)
      .addFields(
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          value: 'ㅤ',
          inline: false
        },
        {
          name: '🧹 **WARNS REMOVIDOS**',
          value: `\`\`\`css\n[ ${clearedCount} warn(s) removido(s) ]\n\`\`\``,
          inline: true
        },
        {
          name: '📋 **MOTIVO DA LIMPEZA**',
          value: `\`\`\`ansi\n\u001b[1;32m${reason}\u001b[0m\n\`\`\``,
          inline: false
        },
        {
          name: '🛡️ **MODERADOR**',
          value: moderator.tag,
          inline: true
        }
      )
      .setFooter({ 
        text: `Sistema de Warns • ${guild.name}`,
        iconURL: guild.iconURL({ dynamic: true })
      })
      .setTimestamp();
    
    await user.send({ embeds: [embed] });
    return true;
  } catch (error) {
    return false;
  }
}

// ===============================
// FUNÇÕES DE LOG DE AUDITORIA
// ===============================

// Log de warn adicionado
function logWarnAdd(guild, user, moderator, reason, warnCount, warnId) {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const riskLevel = getRiskLevel(warnCount);
  const riskEmoji = getRiskEmoji(warnCount);
  
  console.log(chalk.yellow.bgBlack.bold('\n ⚠️ WARN ADICIONADO '));
  console.log(chalk.yellow('────────────────────────────────'));
  console.log(chalk.yellow(`   Servidor:   ${guild.name}`));
  console.log(chalk.yellow(`   Usuário:    ${user.tag} (${user.id})`));
  console.log(chalk.yellow(`   Moderador:  ${moderator.tag} (${moderator.id})`));
  console.log(chalk.yellow(`   Motivo:     ${reason}`));
  console.log(chalk.yellow(`   Warns:      ${warnCount} ${riskEmoji} (${riskLevel})`));
  console.log(chalk.yellow(`   ID:         ${warnId}`));
  console.log(chalk.yellow(`   Data:       ${timestamp}`));
  console.log(chalk.yellow('────────────────────────────────\n'));
}

// Log de warn removido
function logWarnRemove(guild, user, moderator, warnId, reason) {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  console.log(chalk.green.bgBlack.bold('\n ✅ WARN REMOVIDO '));
  console.log(chalk.green('────────────────────────────────'));
  console.log(chalk.green(`   Servidor:   ${guild.name}`));
  console.log(chalk.green(`   Usuário:    ${user.tag} (${user.id})`));
  console.log(chalk.green(`   Moderador:  ${moderator.tag} (${moderator.id})`));
  console.log(chalk.green(`   Warn ID:    ${warnId}`));
  console.log(chalk.green(`   Motivo:     ${reason}`));
  console.log(chalk.green(`   Data:       ${timestamp}`));
  console.log(chalk.green('────────────────────────────────\n'));
}

// Log de warns limpos
function logWarnsCleared(guild, user, moderator, clearedCount, reason) {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  console.log(chalk.blue.bgBlack.bold('\n 🧹 WARNS LIMPOS '));
  console.log(chalk.blue('────────────────────────────────'));
  console.log(chalk.blue(`   Servidor:   ${guild.name}`));
  console.log(chalk.blue(`   Usuário:    ${user.tag} (${user.id})`));
  console.log(chalk.blue(`   Moderador:  ${moderator.tag} (${moderator.id})`));
  console.log(chalk.blue(`   Limpos:     ${clearedCount} warns`));
  console.log(chalk.blue(`   Motivo:     ${reason}`));
  console.log(chalk.blue(`   Data:       ${timestamp}`));
  console.log(chalk.blue('────────────────────────────────\n'));
}

// ===============================
// FUNÇÕES DE CRIAÇÃO DE BOTÕES INTERATIVOS
// ===============================

// Cria botões para paginação de warns
function createWarnPaginationButtons(userId, currentPage, totalPages) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`warns_prev_${userId}_${currentPage}`)
        .setLabel('◀ ANTERIOR')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 1),
      new ButtonBuilder()
        .setCustomId(`warns_next_${userId}_${currentPage}`)
        .setLabel('PRÓXIMO ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages),
      new ButtonBuilder()
        .setCustomId(`warns_refresh_${userId}`)
        .setLabel('🔄 ATUALIZAR')
        .setStyle(ButtonStyle.Primary)
    );
  
  return row;
}

// Cria botões para ações em um warn específico
function createWarnActionButtons(warnId, userId) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`warn_details_${warnId}`)
        .setLabel('📋 DETALHES')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`warn_remove_${warnId}_${userId}`)
        .setLabel('🗑️ REMOVER')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`warn_appeal_${warnId}_${userId}`)
        .setLabel('📝 RECORRER')
        .setStyle(ButtonStyle.Success)
    );
  
  return row;
}

// Cria menu de seleção para ações em massa
function createWarnBulkActionMenu(userId) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`warn_bulk_action_${userId}`)
    .setPlaceholder('📋 Selecione uma ação em massa')
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel('Remover warns antigos')
        .setDescription('Remove warns com mais de 30 dias')
        .setValue('remove_old')
        .setEmoji('🗑️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Exportar warns')
        .setDescription('Exporta todos os warns do servidor')
        .setValue('export_all')
        .setEmoji('📤'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Gerar relatório')
        .setDescription('Gera relatório completo de warns')
        .setValue('generate_report')
        .setEmoji('📊')
    ]);
  
  return new ActionRowBuilder().addComponents(selectMenu);
}

// ===============================
// FUNÇÕES DE ESTATÍSTICAS AVANÇADAS
// ===============================

// Calcula tendência de warns
function calculateTrend(currentPeriod, previousPeriod) {
  if (previousPeriod === 0) return { trend: '📈', percentage: 100, direction: 'up' };
  const percentage = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  
  if (percentage > 10) return { trend: '📈', percentage: percentage.toFixed(1), direction: 'up' };
  if (percentage < -10) return { trend: '📉', percentage: Math.abs(percentage).toFixed(1), direction: 'down' };
  return { trend: '➡️', percentage: percentage.toFixed(1), direction: 'stable' };
}

// Calcula horário de pico
function calculatePeakHour(warnsByHour) {
  if (!warnsByHour || warnsByHour.length === 0) return null;
  
  let maxCount = 0;
  let peakHour = 0;
  
  warnsByHour.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = hour;
    }
  });
  
  return { hour: peakHour, count: maxCount };
}

// Calcula dia da semana com mais warns
function calculatePeakDay(warnsByWeekday) {
  if (!warnsByWeekday || warnsByWeekday.length === 0) return null;
  
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  let maxCount = 0;
  let peakDay = 0;
  
  warnsByWeekday.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count;
      peakDay = day;
    }
  });
  
  return { day: days[peakDay], count: maxCount };
}

// Calcula média de warns por moderador
function calculateAveragePerModerator(moderatorStats) {
  if (!moderatorStats || moderatorStats.length === 0) return 0;
  const total = moderatorStats.reduce((sum, mod) => sum + mod.count, 0);
  return (total / moderatorStats.length).toFixed(1);
}

// ===============================
// FUNÇÕES DE FORMATAÇÃO AVANÇADA
// ===============================

// Formata número com emoji
function formatNumberWithEmoji(number) {
  if (number === 0) return '0️⃣';
  if (number === 1) return '1️⃣';
  if (number === 2) return '2️⃣';
  if (number === 3) return '3️⃣';
  if (number === 4) return '4️⃣';
  if (number === 5) return '5️⃣';
  if (number === 6) return '6️⃣';
  if (number === 7) return '7️⃣';
  if (number === 8) return '8️⃣';
  if (number === 9) return '9️⃣';
  if (number === 10) return '🔟';
  return `**${number}**`;
}

// Formata porcentagem com emoji
function formatPercentage(percentage) {
  if (percentage > 20) return `🔴 ${percentage}%`;
  if (percentage > 10) return `🟠 ${percentage}%`;
  if (percentage > 0) return `🟡 ${percentage}%`;
  if (percentage === 0) return `⚪ 0%`;
  return `🟢 ${Math.abs(percentage)}%`;
}

// Formata barra de progresso
function createProgressBar(current, max, length = 10) {
  const percentage = current / max;
  const filledLength = Math.round(percentage * length);
  const emptyLength = length - filledLength;
  
  const filledBar = '█'.repeat(filledLength);
  const emptyBar = '░'.repeat(emptyLength);
  
  return `${filledBar}${emptyBar} ${(percentage * 100).toFixed(0)}%`;
}

// ===============================
// EXPORTAÇÃO DO MÓDULO (PARTE 2/3)
// ===============================
module.exports = {
  // Funções de validação
  validateReason,
  validateUserForWarn,
  validateWarnId,
  validateDuration,
  
  // Funções de processamento de resultados
  processAddResult,
  processRemoveResult,
  processClearResult,
  
  // Funções de notificação
  sendWarnNotification,
  sendWarnRemovedNotification,
  sendWarnsClearedNotification,
  
  // Funções de log
  logWarnAdd,
  logWarnRemove,
  logWarnsCleared,
  
  // Funções de botões interativos
  createWarnPaginationButtons,
  createWarnActionButtons,
  createWarnBulkActionMenu,
  
  // Funções de estatísticas avançadas
  calculateTrend,
  calculatePeakHour,
  calculatePeakDay,
  calculateAveragePerModerator,
  
  // Funções de formatação
  formatNumberWithEmoji,
  formatPercentage,
  createProgressBar
};
// ===============================
// allWarncmd.js - PARTE 3/3
// EXECUTORES DOS COMANDOS E INTEGRAÇÃO COM WARNSYSTEM.JS
// ===============================

// ===============================
// EXECUTOR DO SUBCOMANDO ADD
// ===============================
async function executeWarnAdd(interaction, warnSystem, updateWarnRoles, stats) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason');
  const duration = interaction.options.getInteger('duration') || 0;
  
  // Validar motivo
  const reasonValidation = validateReason(reason);
  if (!reasonValidation.valid) {
    return interaction.editReply({ content: reasonValidation.error, flags: 64 });
  }
  
  // Buscar membro
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  
  // Validar usuário
  const userValidation = validateUserForWarn(member, interaction.user);
  if (!userValidation.valid) {
    return interaction.editReply({ content: userValidation.error, flags: 64 });
  }
  
  // Validar duração
  const durationValidation = validateDuration(duration);
  if (!durationValidation.valid) {
    return interaction.editReply({ content: durationValidation.error, flags: 64 });
  }
  
  // Adicionar warn usando warnSystem
  let result;
  if (warnSystem && warnSystem.addWarn) {
    result = warnSystem.addWarn(
      interaction.guild.id,
      user.id,
      reason,
      interaction.user.id,
      { duration: duration > 0 ? duration : null }
    );
  } else {
    // Fallback para sistema local
    const localResult = addWarnLocal(
      interaction.guild.id,
      user.id,
      reason,
      interaction.user.id,
      duration
    );
    result = localResult;
  }
  
  // Processar resultado
  const processed = processAddResult(result, user, interaction.user, reason, duration);
  
  if (!processed.success) {
    return interaction.editReply({ content: processed.message, flags: 64 });
  }
  
  // Atualizar cargos de warn
  if (updateWarnRoles) {
    await updateWarnRoles(interaction.guild, user.id, result.warnCount);
  }
  
  // Atualizar estatísticas
  if (stats) stats.warnsGiven++;
  
  // Enviar notificação DM
  const riskLevel = getRiskLevel(result.warnCount);
  await sendWarnNotification(user, interaction.guild, reason, result.warnCount, riskLevel, result.warnId, duration);
  
  // Log de auditoria
  logWarnAdd(interaction.guild, user, interaction.user, reason, result.warnCount, result.warnId);
  
  // Responder com embed
  await interaction.editReply({ embeds: [processed.embed], flags: 64 });
  
  return { success: true, warnCount: result.warnCount, warnId: result.warnId };
}

// ===============================
// EXECUTOR DO SUBCOMANDO REMOVE
// ===============================
async function executeWarnRemove(interaction, warnSystem, updateWarnRoles) {
  const user = interaction.options.getUser('user');
  const warnId = interaction.options.getString('warnid');
  const reason = interaction.options.getString('reason');
  
  // Validar ID do warn
  const idValidation = validateWarnId(warnId);
  if (!idValidation.valid) {
    return interaction.editReply({ content: idValidation.error, flags: 64 });
  }
  
  // Remover warn usando warnSystem
  let result;
  if (warnSystem && warnSystem.removeWarn) {
    result = warnSystem.removeWarn(
      interaction.guild.id,
      user.id,
      warnId,
      interaction.user.id,
      reason
    );
  } else {
    // Fallback para sistema local
    result = removeWarnLocal(interaction.guild.id, user.id, warnId, interaction.user.id, reason);
  }
  
  // Processar resultado
  const processed = processRemoveResult(result, user, warnId, reason, interaction.user);
  
  if (!processed.success) {
    return interaction.editReply({ content: processed.message, flags: 64 });
  }
  
  // Atualizar cargos de warn
  if (updateWarnRoles) {
    let currentWarns = null;
    if (warnSystem && warnSystem.getUserWarns) {
      currentWarns = warnSystem.getUserWarns(interaction.guild.id, user.id);
    } else {
      currentWarns = getUserWarnsLocal(interaction.guild.id, user.id);
    }
    await updateWarnRoles(interaction.guild, user.id, currentWarns?.activeCount || 0);
  }
  
  // Enviar notificação DM (opcional)
  const notify = interaction.options.getBoolean('notify') ?? true;
  if (notify) {
    await sendWarnRemovedNotification(user, interaction.guild, warnId, reason, interaction.user);
  }
  
  // Log de auditoria
  logWarnRemove(interaction.guild, user, interaction.user, warnId, reason);
  
  // Responder com embed
  await interaction.editReply({ embeds: [processed.embed], flags: 64 });
  
  return { success: true };
}

// ===============================
// EXECUTOR DO SUBCOMANDO CLEAR
// ===============================
async function executeWarnClear(interaction, warnSystem, updateWarnRoles) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason');
  
  // Validar motivo
  const reasonValidation = validateReason(reason);
  if (!reasonValidation.valid) {
    return interaction.editReply({ content: reasonValidation.error, flags: 64 });
  }
  
  // Limpar warns usando warnSystem
  let result;
  if (warnSystem && warnSystem.clearUserWarns) {
    result = warnSystem.clearUserWarns(
      interaction.guild.id,
      user.id,
      interaction.user.id,
      reason
    );
  } else {
    // Fallback para sistema local
    result = clearUserWarnsLocal(interaction.guild.id, user.id, interaction.user.id, reason);
  }
  
  // Processar resultado
  const processed = processClearResult(result, user, reason, interaction.user);
  
  if (!processed.success) {
    return interaction.editReply({ content: processed.message, flags: 64 });
  }
  
  // Atualizar cargos de warn
  if (updateWarnRoles) {
    await updateWarnRoles(interaction.guild, user.id, 0);
  }
  
  // Enviar notificação DM (opcional)
  const notify = interaction.options.getBoolean('notify') ?? true;
  if (notify) {
    await sendWarnsClearedNotification(user, interaction.guild, processed.clearedCount, reason, interaction.user);
  }
  
  // Log de auditoria
  logWarnsCleared(interaction.guild, user, interaction.user, processed.clearedCount, reason);
  
  // Responder com embed
  await interaction.editReply({ embeds: [processed.embed], flags: 64 });
  
  return { success: true, clearedCount: processed.clearedCount };
}

// ===============================
// EXECUTOR DO SUBCOMANDO CHECK
// ===============================
async function executeWarnCheck(interaction, warnSystem) {
  const user = interaction.options.getUser('user');
  const detailed = interaction.options.getBoolean('detailed') || false;
  
  // Buscar warns do usuário
  let userWarns;
  if (warnSystem && warnSystem.getUserWarns) {
    userWarns = warnSystem.getUserWarns(interaction.guild.id, user.id);
  } else {
    userWarns = getUserWarnsLocal(interaction.guild.id, user.id);
  }
  
  // Criar embed
  const embed = createWarnCheckEmbed(user, userWarns);
  
  // Adicionar botões de paginação se houver muitos warns
  let components = [];
  if (userWarns && userWarns.history && userWarns.history.length > 10) {
    const totalPages = Math.ceil(userWarns.history.length / 5);
    components = [createWarnPaginationButtons(user.id, 1, totalPages)];
  }
  
  // Responder
  await interaction.editReply({ 
    embeds: [embed], 
    components: components,
    flags: 64 
  });
  
  return { success: true };
}

// ===============================
// EXECUTOR DO SUBCOMANDO STATS
// ===============================
async function executeWarnStats(interaction, warnSystem) {
  const user = interaction.options.getUser('user');
  
  if (user) {
    // Estatísticas do usuário
    let userStats;
    if (warnSystem && warnSystem.getUserStats) {
      userStats = warnSystem.getUserStats(interaction.guild.id, user.id);
    } else {
      userStats = getUserStatsLocal(interaction.guild.id, user.id);
    }
    
    const embed = createUserStatsEmbed(user, userStats);
    await interaction.editReply({ embeds: [embed], flags: 64 });
    
  } else {
    // Estatísticas do servidor
    let serverStats;
    if (warnSystem && warnSystem.getServerStats) {
      serverStats = warnSystem.getServerStats(interaction.guild.id);
    } else {
      serverStats = getServerStatsLocal(interaction.guild.id);
    }
    
    // Adicionar análise avançada
    const peakHour = calculatePeakHour(serverStats.warnsByHour);
    const peakDay = calculatePeakDay(serverStats.warnsByWeekday);
    const avgPerMod = calculateAveragePerModerator(serverStats.topModerators);
    
    const embed = createServerStatsEmbed(interaction.guild, serverStats);
    
    // Adicionar campos extras de análise
    if (peakHour) {
      embed.addFields({
        name: '⏰ **HORÁRIO DE PICO**',
        value: `\`\`\`yaml\n${peakHour.hour}:00 - ${peakHour.count} warns\`\`\``,
        inline: true
      });
    }
    
    if (peakDay) {
      embed.addFields({
        name: '📅 **DIA DE PICO**',
        value: `\`\`\`yaml\n${peakDay.day} - ${peakDay.count} warns\`\`\``,
        inline: true
      });
    }
    
    embed.addFields({
      name: '📊 **MÉDIA POR MODERADOR**',
      value: `\`\`\`yaml\n${avgPerMod} warns/moderador\`\`\``,
      inline: true
    });
    
    // Adicionar menu de ações
    const actionMenu = createWarnBulkActionMenu(interaction.user.id);
    
    await interaction.editReply({ 
      embeds: [embed], 
      components: [actionMenu],
      flags: 64 
    });
  }
  
  return { success: true };
}

// ===============================
// EXECUTOR DO ATALHO /WARNINGS
// ===============================
async function executeWarnings(interaction, warnSystem) {
  const user = interaction.options.getUser('user');
  const code = interaction.options.getString('code');
  
  if (code !== global.CONFIG?.ACCESS_CODE) {
    return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
  }
  
  await interaction.deferReply({ flags: 64 });
  
  let userWarns;
  if (warnSystem && warnSystem.getUserWarns) {
    userWarns = warnSystem.getUserWarns(interaction.guild.id, user.id);
  } else {
    userWarns = getUserWarnsLocal(interaction.guild.id, user.id);
  }
  
  const embed = createWarnCheckEmbed(user, userWarns);
  await interaction.editReply({ embeds: [embed], flags: 64 });
  
  return { success: true };
}

// ===============================
// EXECUTOR DO ATALHO /CLEARWARNS
// ===============================
async function executeClearWarns(interaction, warnSystem, updateWarnRoles) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'Limpeza via comando de atalho';
  const code = interaction.options.getString('code');
  
  if (code !== global.CONFIG?.ACCESS_CODE) {
    return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
  }
  
  await interaction.deferReply({ flags: 64 });
  
  // Limpar warns
  let result;
  if (warnSystem && warnSystem.clearUserWarns) {
    result = warnSystem.clearUserWarns(
      interaction.guild.id,
      user.id,
      interaction.user.id,
      reason
    );
  } else {
    result = clearUserWarnsLocal(interaction.guild.id, user.id, interaction.user.id, reason);
  }
  
  const processed = processClearResult(result, user, reason, interaction.user);
  
  if (!processed.success) {
    return interaction.editReply({ content: processed.message, flags: 64 });
  }
  
  // Atualizar cargos
  if (updateWarnRoles) {
    await updateWarnRoles(interaction.guild, user.id, 0);
  }
  
  // Log
  logWarnsCleared(interaction.guild, user, interaction.user, processed.clearedCount, reason);
  
  await interaction.editReply({ embeds: [processed.embed], flags: 64 });
  
  return { success: true };
}

// ===============================
// EXECUTOR DO ATALHO /WARNSTATS
// ===============================
async function executeWarnStatsShortcut(interaction, warnSystem) {
  const user = interaction.options.getUser('user');
  const code = interaction.options.getString('code');
  
  if (code !== global.CONFIG?.ACCESS_CODE) {
    return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
  }
  
  await interaction.deferReply({ flags: 64 });
  
  if (user) {
    let userStats;
    if (warnSystem && warnSystem.getUserStats) {
      userStats = warnSystem.getUserStats(interaction.guild.id, user.id);
    } else {
      userStats = getUserStatsLocal(interaction.guild.id, user.id);
    }
    const embed = createUserStatsEmbed(user, userStats);
    await interaction.editReply({ embeds: [embed], flags: 64 });
  } else {
    let serverStats;
    if (warnSystem && warnSystem.getServerStats) {
      serverStats = warnSystem.getServerStats(interaction.guild.id);
    } else {
      serverStats = getServerStatsLocal(interaction.guild.id);
    }
    const embed = createServerStatsEmbed(interaction.guild, serverStats);
    await interaction.editReply({ embeds: [embed], flags: 64 });
  }
  
  return { success: true };
}

// ===============================
// EXECUTOR DO ATALHO /MYWARNS
// ===============================
async function executeMyWarns(interaction, warnSystem) {
  const code = interaction.options.getString('code');
  
  if (code !== global.CONFIG?.ACCESS_CODE) {
    return interaction.reply({ content: '❌ Código de acesso incorreto!', flags: 64 });
  }
  
  await interaction.deferReply({ flags: 64 });
  
  const user = interaction.user;
  
  let userWarns;
  if (warnSystem && warnSystem.getUserWarns) {
    userWarns = warnSystem.getUserWarns(interaction.guild.id, user.id);
  } else {
    userWarns = getUserWarnsLocal(interaction.guild.id, user.id);
  }
  
  const embed = createWarnCheckEmbed(user, userWarns);
  
  // Adicionar aviso se não tiver warns
  if (!userWarns || userWarns.history.length === 0) {
    embed.setFooter({ 
      text: '✅ Você não possui warns. Continue com bom comportamento!',
      iconURL: user.displayAvatarURL()
    });
  } else {
    embed.setFooter({ 
      text: `⚠️ Você possui ${userWarns.activeCount} warns ativos. Mantenha o bom comportamento!`,
      iconURL: user.displayAvatarURL()
    });
  }
  
  await interaction.editReply({ embeds: [embed], flags: 64 });
  
  return { success: true };
}

// ===============================
// SISTEMA LOCAL FALLBACK (CASO WARNSYSTEM NÃO ESTEJA DISPONÍVEL)
// ===============================
const localWarnsData = new Map();

function addWarnLocal(guildId, userId, reason, moderatorId, duration) {
  const key = `${guildId}-${userId}`;
  if (!localWarnsData.has(key)) {
    localWarnsData.set(key, { history: [], activeCount: 0, count: 0 });
  }
  
  const userWarns = localWarnsData.get(key);
  const warnId = `WRN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const expiresAt = duration > 0 ? Date.now() + (duration * 24 * 60 * 60 * 1000) : null;
  
  const warn = {
    id: warnId,
    reason,
    moderatorId,
    timestamp: Date.now(),
    expiresAt,
    active: true
  };
  
  userWarns.history.push(warn);
  userWarns.count = userWarns.history.length;
  userWarns.activeCount = userWarns.history.filter(w => w.active && (!w.expiresAt || w.expiresAt > Date.now())).length;
  
  localWarnsData.set(key, userWarns);
  
  return {
    success: true,
    warnId,
    warnCount: userWarns.activeCount
  };
}

function removeWarnLocal(guildId, userId, warnId, moderatorId, reason) {
  const key = `${guildId}-${userId}`;
  if (!localWarnsData.has(key)) return { success: false, error: 'Usuário não encontrado' };
  
  const userWarns = localWarnsData.get(key);
  const warn = userWarns.history.find(w => w.id === warnId);
  
  if (!warn) return { success: false, error: 'Warn não encontrado' };
  if (!warn.active) return { success: false, error: 'Warn já foi removido' };
  
  warn.active = false;
  warn.removedBy = moderatorId;
  warn.removedReason = reason;
  warn.removedAt = Date.now();
  
  userWarns.activeCount = userWarns.history.filter(w => w.active && (!w.expiresAt || w.expiresAt > Date.now())).length;
  localWarnsData.set(key, userWarns);
  
  return { success: true };
}

function clearUserWarnsLocal(guildId, userId, moderatorId, reason) {
  const key = `${guildId}-${userId}`;
  if (!localWarnsData.has(key)) return { success: false, error: 'Usuário não encontrado' };
  
  const userWarns = localWarnsData.get(key);
  const clearedCount = userWarns.history.filter(w => w.active).length;
  
  userWarns.history.forEach(warn => {
    if (warn.active) {
      warn.active = false;
      warn.removedBy = moderatorId;
      warn.removedReason = reason;
      warn.removedAt = Date.now();
    }
  });
  
  userWarns.activeCount = 0;
  localWarnsData.set(key, userWarns);
  
  return { success: true, clearedCount };
}

function getUserWarnsLocal(guildId, userId) {
  const key = `${guildId}-${userId}`;
  if (!localWarnsData.has(key)) return null;
  
  const userWarns = localWarnsData.get(key);
  const activeWarns = userWarns.history.filter(w => w.active && (!w.expiresAt || w.expiresAt > Date.now()));
  
  return {
    count: userWarns.count,
    activeCount: activeWarns.length,
    history: userWarns.history,
    firstWarn: userWarns.history[0]?.timestamp,
    lastWarn: userWarns.history[userWarns.history.length - 1]?.timestamp
  };
}

function getUserStatsLocal(guildId, userId) {
  const userWarns = getUserWarnsLocal(guildId, userId);
  if (!userWarns) {
    return { totalWarns: 0, activeWarns: 0, firstWarn: null, lastWarn: null, averageInterval: 0 };
  }
  
  let intervals = [];
  let prevDate = null;
  userWarns.history.forEach(warn => {
    if (prevDate) {
      intervals.push((warn.timestamp - prevDate) / (24 * 60 * 60 * 1000));
    }
    prevDate = warn.timestamp;
  });
  
  const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  
  return {
    totalWarns: userWarns.count,
    activeWarns: userWarns.activeCount,
    firstWarn: userWarns.firstWarn,
    lastWarn: userWarns.lastWarn,
    averageInterval: avgInterval.toFixed(2)
  };
}

function getServerStatsLocal(guildId) {
  let totalWarns = 0;
  let activeWarns = 0;
  let warnedUsers = 0;
  const reasons = {};
  const moderators = {};
  const warnsByHour = Array(24).fill(0);
  const warnsByWeekday = Array(7).fill(0);
  
  for (const [key, userWarns] of localWarnsData) {
    if (key.startsWith(`${guildId}-`)) {
      warnedUsers++;
      totalWarns += userWarns.count;
      activeWarns += userWarns.activeCount;
      
      userWarns.history.forEach(warn => {
        reasons[warn.reason] = (reasons[warn.reason] || 0) + 1;
        moderators[warn.moderatorId] = (moderators[warn.moderatorId] || 0) + 1;
        
        const hour = new Date(warn.timestamp).getHours();
        warnsByHour[hour]++;
        
        const weekday = new Date(warn.timestamp).getDay();
        warnsByWeekday[weekday]++;
      });
    }
  }
  
  return {
    totalWarns,
    activeWarns,
    warnedUsers,
    averageWarnsPerUser: warnedUsers > 0 ? (totalWarns / warnedUsers).toFixed(2) : 0,
    topReasons: Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([r, c]) => ({ reason: r, count: c })),
    topModerators: Object.entries(moderators).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([m, c]) => ({ id: m, count: c })),
    warnsByHour,
    warnsByWeekday
  };
}

// ===============================
// EXPORTAÇÃO DO MÓDULO (PARTE 3/3)
// ===============================
module.exports = {
  // Executores principais
  executeWarnAdd,
  executeWarnRemove,
  executeWarnClear,
  executeWarnCheck,
  executeWarnStats,
  
  // Executores de atalho
  executeWarnings,
  executeClearWarns,
  executeWarnStatsShortcut,
  executeMyWarns,
  
  // Sistema local fallback
  addWarnLocal,
  removeWarnLocal,
  clearUserWarnsLocal,
  getUserWarnsLocal,
  getUserStatsLocal,
  getServerStatsLocal,
  localWarnsData
};
