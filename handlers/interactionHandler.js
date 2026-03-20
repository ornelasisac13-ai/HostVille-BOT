// ===============================
// handlers/interactionHandler.js - EVENTO DE INTERAÇÃO
// ===============================
const { Colors, EmbedBuilder } = require('discord.js');
const ownerPanel = require('../panels/ownerPanel');
const adminPanel = require('../panels/adminPanel');
const warnHandlers = require('./warnHandlers');

async function handleInteraction(
  interaction,
  client,
  CONFIG,
  stats,
  serverMonitoring,
  pendingActions,
  staffIds,
  setServerMonitoring,
  createStatusEmbed,
  logger,
  warnSystem,
  isAdmin,
  isStaff
) {
  try {
    // ===== COMANDOS SLASH =====
    if (interaction.isChatInputCommand()) {
      const cmdName = interaction.commandName;
      stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;
      
      // Importar comandos
      const pingCommand = require('../commands/ping');
      const helpCommand = require('../commands/help');
      const privateCommand = require('../commands/private');
      const reportCommand = require('../commands/report');
      const admCommand = require('../commands/adm');
      const warnCommand = require('../commands/warn');
      const warningsCommand = require('../commands/warnings');
      const clearwarnsCommand = require('../commands/clearwarns');
      const warnstatsCommand = require('../commands/warnstats');
      
      // Roteamento de comandos
      switch (interaction.commandName) {
        case 'ping':
          await pingCommand.execute(interaction, client, stats, logger);
          break;
        case 'help':
          await helpCommand.execute(interaction, logger, stats);
          break;
        case 'private':
          await privateCommand.execute(interaction, CONFIG, logger, stats);
          break;
        case 'report':
          await reportCommand.execute(interaction, CONFIG, client, stats, logger, warnSystem);
          break;
        case 'adm':
          await admCommand.execute(interaction, CONFIG, logger, stats);
          break;
        case 'warn':
          await warnCommand.execute(interaction, CONFIG, client, stats, logger, warnSystem, isStaff, isAdmin, staffIds);
          break;
        case 'warnings':
          await warningsCommand.execute(interaction, CONFIG, client, logger, stats, warnSystem);
          break;
        case 'clearwarns':
          await clearwarnsCommand.execute(interaction, CONFIG, logger, stats, warnSystem);
          break;
        case 'warnstats':
          await warnstatsCommand.execute(interaction, CONFIG, logger, stats, warnSystem);
          break;
        default:
          await interaction.reply({ content: '❌ Comando não encontrado!', flags: 64 });
      }
      return;
    }

    // ===== BOTÕES =====
    if (interaction.isButton()) {
      // Botões de confirmação de desligamento
      if (interaction.customId === 'confirm_shutdown' || interaction.customId === 'cancel_shutdown') {
        return;
      }
      
      // Botões do painel do dono
      if (interaction.customId === 'owner_turnoff' || interaction.customId === 'owner_moderation' || interaction.customId === 'owner_warnstats') {
        await ownerPanel.handleOwnerPanelButtons(interaction, client, CONFIG, serverMonitoring);
        return;
      }
      
      // Botões de monitoramento de servidor (painel do dono)
      if (interaction.customId.startsWith('monitor_guild_')) {
        await ownerPanel.handleGuildMonitorButton(interaction, client, CONFIG, serverMonitoring);
        return;
      }
      
      // Botões de ação em massa (painel do dono)
      if (interaction.customId === 'owner_monitor_all_on' || interaction.customId === 'owner_monitor_all_off') {
        await ownerPanel.handleOwnerBulkAction(interaction, client, CONFIG, serverMonitoring);
        return;
      }
      
      // Botões do painel administrativo
      if (interaction.customId === 'stats' || interaction.customId === 'console' || interaction.customId === 'help') {
        await adminPanel.handleButtonInteraction(interaction, client, logger);
        return;
      }
      
      // Botões de confirmação do !clear
      if (interaction.customId === 'confirm_clear' || interaction.customId === 'cancel_clear') {
        return;
      }
      
      // Botões de monitoramento padrão
      if (interaction.customId.startsWith('monitor_')) {
        await handleMonitorButtons(interaction, client, serverMonitoring, pendingActions, setServerMonitoring, createStatusEmbed, logger);
        return;
      }
      
      // Botões de warns
      if (interaction.customId.startsWith('warns_') || interaction.customId.startsWith('warn_')) {
        await warnHandlers.handleWarnButtons(interaction, client, warnSystem, logger);
        return;
      }
      
      await interaction.reply({ content: '❌ Botão desconhecido!', flags: 64 });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
    }
    
    // ===== MODAIS =====
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('remove_warn_modal_')) {
        await warnHandlers.handleWarnModals(interaction, warnSystem, logger);
        return;
      }
    }
    
    // ===== MENUS DE SELEÇÃO =====
    if (interaction.isStringSelectMenu()) {
      // Menu de seleção do painel do dono
      if (interaction.customId === 'owner_monitor_select') {
        await ownerPanel.handleOwnerServerSelection(interaction, client, CONFIG, serverMonitoring);
        return;
      }
      
      // Menu de seleção padrão
      if (interaction.customId.startsWith('select_server_')) {
        await handleServerSelection(interaction, client, serverMonitoring, pendingActions, setServerMonitoring, createStatusEmbed, logger);
        return;
      }
    }
  } catch (error) {
    logger.logError(`Erro geral no interactionCreate: ${error.message}`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Erro ao processar interação.', flags: 64 }).catch(() => {});
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
    }
  }
}

// HANDLER PARA BOTÕES DE MONITORAMENTO
async function handleMonitorButtons(interaction, client, serverMonitoring, pendingActions, setServerMonitoring, createStatusEmbed, logger) {
  await interaction.deferReply({ flags: 64 });
  
  try {
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const state = parts[2];
    const isOn = state === 'on';
    const actionText = isOn ? 'ATIVAR' : 'DESATIVAR';
    
    if (action === 'all') {
      let count = 0;
      for (const [guildId, guild] of client.guilds.cache) {
        setServerMonitoring(serverMonitoring, client, guildId, isOn, interaction.user);
        count++;
      }
      
      const embed = createStatusEmbed(null, state, interaction.user);
      embed.setDescription(`✅ Monitoramento ${isOn ? 'ativado' : 'desativado'} em **${count} servidores**!`);
      
      await interaction.editReply({
        content: `✅ Operação concluída!`,
        embeds: [embed]
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 10000);
      
    } else if (action === 'select') {
      const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
      const options = [];
      
      let count = 0;
      for (const [guildId, guild] of client.guilds.cache) {
        if (count >= 25) break;
        
        const status = serverMonitoring.get(guildId) ? '🟢 ATIVO' : '🔴 INATIVO';
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(guild.name.substring(0, 100))
            .setDescription(`${guild.memberCount} membros - ${status}`)
            .setValue(guildId)
            .setEmoji('🏛️')
        );
        count++;
      }
      
      if (client.guilds.cache.size > 25) {
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel('📌 Mais servidores...')
            .setDescription('Use o comando novamente para ver outros servidores')
            .setValue('more')
            .setEmoji('📌')
        );
      }
      
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select_server_${state}`)
        .setPlaceholder('Selecione um servidor')
        .addOptions(options);
      
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      pendingActions.set(interaction.user.id, { 
        action: state,
        messageId: interaction.id 
      });
      
      await interaction.editReply({
        content: `🔍 **Selecione o servidor para ${actionText} o monitoramento:**`,
        components: [row]
      });
    }
  } catch (error) {
    logger.logError(`Erro no handleMonitorButtons: ${error.message}`);
    await interaction.editReply({ 
      content: '❌ Erro ao processar comando. Tente novamente.'
    });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 5000);
  }
}

// HANDLER PARA SELEÇÃO DE SERVIDOR
async function handleServerSelection(interaction, client, serverMonitoring, pendingActions, setServerMonitoring, createStatusEmbed, logger) {
  await interaction.deferUpdate();
  
  try {
    const selectedValue = interaction.values[0];
    const customId = interaction.customId;
    const state = customId.split('_')[2];
    
    const pending = pendingActions.get(interaction.user.id);
    
    if (!pending) {
      await interaction.editReply({ 
        content: '❌ Esta seleção expirou. Use o comando novamente.',
        components: [] 
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      
      return;
    }
    
    const isOn = state === 'on';
    const actionText = isOn ? 'ATIVADO' : 'DESATIVADO';
    
    if (selectedValue === 'more') {
      await interaction.editReply({ 
        content: '📌 **Use o comando novamente para ver mais servidores.**\nDigite `!MonitorOn` ou `!MonitorOff` novamente.',
        components: [] 
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      
      pendingActions.delete(interaction.user.id);
      return;
    }
    
    const guild = client.guilds.cache.get(selectedValue);
    if (!guild) {
      await interaction.editReply({ 
        content: '❌ Servidor não encontrado.',
        components: [] 
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      
      pendingActions.delete(interaction.user.id);
      return;
    }
    
    setServerMonitoring(serverMonitoring, client, selectedValue, isOn, interaction.user);
    
    const embed = createStatusEmbed(guild, state, interaction.user);
    
    await interaction.editReply({ 
      content: `✅ **Monitoramento ${actionText} em ${guild.name}!**`,
      embeds: [embed],
      components: [] 
    });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 10000);
    
    pendingActions.delete(interaction.user.id);
    
  } catch (error) {
    logger.logError(`Erro no handleServerSelection: ${error.message}`);
    await interaction.editReply({ 
      content: '❌ Erro ao processar seleção.',
      components: [] 
    });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 5000);
  }
}

module.exports = { handleInteraction };
