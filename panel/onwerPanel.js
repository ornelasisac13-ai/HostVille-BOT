// ===============================
// panels/ownerPanel.js - FUNÇÕES DO PAINEL DO DONO
// ===============================
const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Colors,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const { logInfo, logError } = require('../utils/logger');
const { setServerMonitoring } = require('../utils/monitoring');

async function handleOwnerPanel(message, client, CONFIG, stats, serverMonitoring) {
  // Verificar se é o dono
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (message.author.id !== ownerId) {
    // Não é o dono - mensagem de acesso negado
    const deniedMsg = await message.reply('❌ **Acesso negado!** Apenas o dono do bot pode usar este comando.');
    
    setTimeout(async () => {
      try {
        await message.delete();
        await deniedMsg.delete();
      } catch (e) {}
    }, 5000);
    return;
  }

  // É o dono - criar embed do painel
  const uptimeMs = client.uptime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  // Formatar uptime
  let uptimeString = '';
  if (hours > 0) uptimeString += `${hours}h `;
  if (minutes > 0) uptimeString += `${minutes}m `;
  uptimeString += `${seconds}s`;

  // Calcular total de comandos usados hoje
  const totalCommandsToday = Object.values(stats.commandsUsed).reduce((a, b) => a + b, 0);

  // Obter estatísticas globais de warns
  const warnSystem = require('../modules/warnSystem.js');
  const globalWarnStats = warnSystem.getGlobalStats ? warnSystem.getGlobalStats() : { totalWarns: 0, totalUsers: 0 };

  // Criar embed
  const embed = new EmbedBuilder()
    .setTitle('👋 Welcome, Owner!')
    .setDescription('**Painel de Controle do Bot**')
    .setColor('#89CFF0')
    .addFields(
      { 
        name: '🤖 **Informações do Bot**', 
        value: `• **Tag:** ${client.user.tag}\n• **ID:** ${client.user.id}\n• **Servidores:** ${client.guilds.cache.size}\n• **Usuários:** ${client.users.cache.size}`,
        inline: false 
      },
      { 
        name: '📊 **Status**', 
        value: `• **Ping:** ${client.ws.ping}ms\n• **Uptime:** ${uptimeString}\n• **Memória:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
        inline: true 
      },
      { 
        name: '📅 **Informações**', 
        value: `• **Iniciado em:** ${stats.startDate.toLocaleString('pt-BR')}\n• **Comandos hoje:** ${totalCommandsToday}\n• **Warns totais:** ${globalWarnStats.totalWarns || 0}`,
        inline: true 
      },
      { 
        name: '📋 **Comandos Disponíveis**', 
        value: '`/ping` - Verificar latência\n`/help` - Lista de comandos\n`/adm` - Painel admin\n`/private` - Mensagem staff\n`/report` - Gerar relatório\n`/warn` - Adicionar warn\n`/warnings` - Ver warns\n`/clearwarns` - Limpar warns\n`/warnstats` - Estatísticas\n\n**Comandos DM:**\n`!clear` - Limpar DM\n`!clearAll` - Limpar todas DMs\n`Hello` - Abrir este painel',
        inline: false 
      }
    )
    .setFooter({ 
      text: `Hostville-bot@5.0.1`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTimestamp();

  // Criar botões
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('owner_turnoff')
        .setLabel('Turn Off')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔴'),
      new ButtonBuilder()
        .setCustomId('owner_moderation')
        .setLabel('Moderation')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛡️'),
      new ButtonBuilder()
        .setCustomId('owner_warnstats')
        .setLabel('Warn Stats')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊')
    );

  // Enviar mensagem com embed e botões
  const panelMsg = await message.reply({
    content: '✅ **Owner Panel**',
    embeds: [embed],
    components: [row]
  });

  logInfo(`🔐 Painel do dono aberto por ${message.author.tag}`);
  
  return panelMsg;
}

async function handleOwnerPanelButtons(interaction, client, CONFIG, serverMonitoring) {
  // Verificar se é o dono
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ 
      content: '❌ Apenas o dono do bot pode usar estes botões!', 
      flags: 64 
    });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 5000);
    return;
  }

  if (interaction.customId === 'owner_turnoff') {
    // Botão Turn Off
    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_shutdown')
          .setLabel('✅ Confirmar Desligamento')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_shutdown')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      content: '⚠️ **Tem certeza que deseja desligar o bot?**',
      components: [confirmRow],
      flags: 64
    });

    // Criar coletor para os botões de confirmação
    const filter = (i) => i.user.id === ownerId;
    const collector = interaction.channel.createMessageComponentCollector({ 
      filter, 
      time: 30000,
      max: 1
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'confirm_shutdown') {
        await i.update({ 
          content: '🔴 **Desligando o bot...**', 
          components: [] 
        });
        
        logInfo(`🔴 Bot desligado por ${interaction.user.tag}`);
        
        // Aguardar 2 segundos e desligar
        setTimeout(() => {
          process.exit(0);
        }, 2000);
        
      } else if (i.customId === 'cancel_shutdown') {
        await i.update({ 
          content: '✅ **Desligamento cancelado.**', 
          components: [] 
        });
        
        setTimeout(async () => {
          try {
            await i.deleteReply();
          } catch (e) {}
        }, 3000);
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        try {
          await interaction.editReply({ 
            content: '⏰ **Tempo esgotado. Desligamento cancelado.**', 
            components: [] 
          });
          
          setTimeout(async () => {
            try {
              await interaction.deleteReply();
            } catch (e) {}
          }, 3000);
        } catch (e) {}
      }
    });

  } else if (interaction.customId === 'owner_moderation') {
    // Botão Moderation - similar ao !MonitorOn/Off
    await interaction.deferReply({ flags: 64 });

    try {
      // Criar lista de servidores com status
      const options = [];
      let count = 0;
      
      for (const [guildId, guild] of client.guilds.cache) {
        if (count >= 25) break; // Limite do Discord
        
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

      // Menu para selecionar servidor
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('owner_monitor_select')
        .setPlaceholder('Selecione um servidor para alterar')
        .addOptions(options);

      if (client.guilds.cache.size > 25) {
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('📌 Mais servidores...')
            .setDescription('Use /adm para ver mais opções')
            .setValue('more')
            .setEmoji('📌')
        );
      }

      const row = new ActionRowBuilder().addComponents(selectMenu);

      // Botões para ação em massa
      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('owner_monitor_all_on')
            .setLabel('Ativar Todos')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId('owner_monitor_all_off')
            .setLabel('Desativar Todos')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

      await interaction.editReply({
        content: '🛡️ **Painel de Moderação**\nSelecione um servidor para alterar o status do monitoramento:',
        components: [row, actionRow]
      });

    } catch (error) {
      logError(`Erro no painel de moderação: ${error.message}`);
      await interaction.editReply({ 
        content: '❌ Erro ao carregar servidores.' 
      });
    }
  } else if (interaction.customId === 'owner_warnstats') {
    // Botão Warn Stats
    await interaction.deferReply({ flags: 64 });

    try {
      const warnSystem = require('../modules/warnSystem.js');
      const globalStats = warnSystem.getGlobalStats ? warnSystem.getGlobalStats() : { 
        totalServers: 0, 
        totalUsers: 0, 
        totalWarns: 0,
        totalActiveWarns: 0
      };

      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas Globais de Warns')
        .setColor(Colors.Blue)
        .addFields(
          { name: '🌐 Servidores', value: globalStats.totalServers?.toString() || '0', inline: true },
          { name: '👥 Usuários Warnados', value: globalStats.totalUsers?.toString() || '0', inline: true },
          { name: '⚠️ Total de Warns', value: globalStats.totalWarns?.toString() || '0', inline: true },
          { name: '🟢 Warns Ativos', value: globalStats.totalActiveWarns?.toString() || '0', inline: true },
          { name: '📊 Média por Usuário', value: globalStats.averageWarnsPerUser?.toString() || '0', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logError(`Erro no painel de warns: ${error.message}`);
      await interaction.editReply({ 
        content: '❌ Erro ao carregar estatísticas de warns.' 
      });
    }
  }
}

async function handleOwnerServerSelection(interaction, client, CONFIG, serverMonitoring) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ 
      content: '❌ Acesso negado!', 
      flags: 64 
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    const selectedValue = interaction.values[0];
    
    if (selectedValue === 'more') {
      await interaction.editReply({ 
        content: '📌 **Use o comando `Hello` novamente para ver mais servidores.**',
        components: [] 
      });
      
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (e) {}
      }, 5000);
      return;
    }

    const guild = client.guilds.cache.get(selectedValue);
    if (!guild) {
      await interaction.editReply({ 
        content: '❌ Servidor não encontrado.',
        components: [] 
      });
      return;
    }

    const currentStatus = serverMonitoring.get(guild.id) !== false;
    
    // Criar botões para ativar/desativar
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`monitor_guild_${guild.id}_on`)
          .setLabel('🟢 Ativar')
          .setStyle(ButtonStyle.Success)
          .setDisabled(currentStatus),
        new ButtonBuilder()
          .setCustomId(`monitor_guild_${guild.id}_off`)
          .setLabel('🔴 Desativar')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!currentStatus)
      );

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Servidor: ${guild.name}`)
      .setColor(currentStatus ? Colors.Green : Colors.Red)
      .addFields(
        { name: '📊 Status Atual', value: currentStatus ? '🟢 **ATIVO**' : '🔴 **INATIVO**', inline: true },
        { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
        { name: '📅 Criado em', value: guild.createdAt.toLocaleDateString('pt-BR'), inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: `**${guild.name}** - Escolha a ação:`,
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    logError(`Erro no handleOwnerServerSelection: ${error.message}`);
  }
}

async function handleGuildMonitorButton(interaction, client, CONFIG, serverMonitoring) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ 
      content: '❌ Acesso negado!', 
      flags: 64 
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    const parts = interaction.customId.split('_');
    const guildId = parts[2];
    const action = parts[3];
    
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      await interaction.editReply({ 
        content: '❌ Servidor não encontrado.',
        components: [] 
      });
      return;
    }

    const isOn = action === 'on';
    setServerMonitoring(serverMonitoring, client, guildId, isOn, interaction.user);

    const embed = new EmbedBuilder()
      .setTitle(`✅ Monitoramento ${isOn ? 'Ativado' : 'Desativado'}`)
      .setColor(isOn ? Colors.Green : Colors.Red)
      .addFields(
        { name: '🏛️ Servidor', value: guild.name, inline: true },
        { name: '🛡️ Status', value: isOn ? '🟢 **ATIVO**' : '🔴 **INATIVO**', inline: true },
        { name: '👤 Staff', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: `✅ **Monitoramento ${isOn ? 'ativado' : 'desativado'} em ${guild.name}!**`,
      embeds: [embed],
      components: []
    });

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 10000);

  } catch (error) {
    logError(`Erro no handleGuildMonitorButton: ${error.message}`);
  }
}

async function handleOwnerBulkAction(interaction, client, CONFIG, serverMonitoring) {
  const ownerId = CONFIG.OWNER_ID ? CONFIG.OWNER_ID.replace(/[<@>]/g, '') : null;
  
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ 
      content: '❌ Acesso negado!', 
      flags: 64 
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    const isOn = interaction.customId.includes('on');
    let count = 0;
    
    for (const [guildId, guild] of client.guilds.cache) {
      setServerMonitoring(serverMonitoring, client, guildId, isOn, interaction.user);
      count++;
    }

    const embed = new EmbedBuilder()
      .setTitle(`✅ Ação em Massa Concluída`)
      .setColor(isOn ? Colors.Green : Colors.Red)
      .addFields(
        { name: '🛡️ Ação', value: isOn ? 'Ativar Todos' : 'Desativar Todos', inline: true },
        { name: '📊 Servidores', value: `${count} servidores`, inline: true },
        { name: '👤 Staff', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: `✅ **Monitoramento ${isOn ? 'ativado' : 'desativado'} em ${count} servidores!**`,
      embeds: [embed],
      components: []
    });

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 10000);

  } catch (error) {
    logError(`Erro no handleOwnerBulkAction: ${error.message}`);
  }
}

module.exports = {
  handleOwnerPanel,
  handleOwnerPanelButtons,
  handleOwnerServerSelection,
  handleGuildMonitorButton,
  handleOwnerBulkAction
};
