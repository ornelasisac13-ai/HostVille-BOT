// ===============================
// handlers/messageHandler.js - EVENTO PRINCIPAL DE MENSAGENS
// ===============================
const { ChannelType, PermissionFlagsBits, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ownerPanel = require('../panels/ownerPanel');

async function handleMessage(
  message,
  client,
  CONFIG,
  stats,
  serverMonitoring,
  pendingActions,
  staffIds,
  offensiveWords,
  containsOffensiveWord,
  findOffensiveWord,
  isAdmin,
  isStaff,
  setServerMonitoring,
  createStatusEmbed,
  logger,
  warnSystem
) {
  if (message.author.bot) return;

  // ===== MENSAGENS NA DM =====
  if (message.channel.type === ChannelType.DM) {
    
    // === COMANDO Hello - Painel do Dono ===
    if (message.content.toLowerCase() === 'hello') {
      await ownerPanel.handleOwnerPanel(message, client, CONFIG, stats, serverMonitoring);
      return;
    }
    
    // === COMANDO !MonitorOn ===
    if (message.content.startsWith('!MonitorOn')) {
      const args = message.content.split(' ');
      const password = args[1];
      
      if (!password) {
        await message.reply('❌ Use: `!MonitorOn ACCESS_CODE`');
        setTimeout(async () => {
          try {
            const msgs = await message.channel.messages.fetch({ limit: 2 });
            for (const msg of msgs.values()) {
              if (msg.author.id === client.user.id) {
                await msg.delete();
              }
            }
          } catch (e) {}
        }, 5000);
        return;
      }
      
      if (password !== CONFIG.ACCESS_CODE) {
        await message.reply('❌ Código de acesso incorreto!');
        setTimeout(async () => {
          try {
            const msgs = await message.channel.messages.fetch({ limit: 2 });
            for (const msg of msgs.values()) {
              if (msg.author.id === client.user.id) {
                await msg.delete();
              }
            }
          } catch (e) {}
        }, 5000);
        return;
      }
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('monitor_all_on')
            .setLabel('Todos os Servidores ⚠️')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🌐'),
          new ButtonBuilder()
            .setCustomId('monitor_select_on')
            .setLabel('Selecionar um Servidor')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔍')
        );
      
      const reply = await message.reply({
        content: '🛡️ **Escolha uma opção para ATIVAR o monitoramento:**',
        components: [row]
      });
      
      setTimeout(async () => {
        try {
          await message.delete();
          await reply.delete();
        } catch (e) {}
      }, 120000);
      
      return;
    }
    
    // === COMANDO !MonitorOff ===
    if (message.content.startsWith('!MonitorOff')) {
      const args = message.content.split(' ');
      const password = args[1];
      
      if (!password) {
        await message.reply('❌ Use: `!MonitorOff ACCESS_CODE`');
        setTimeout(async () => {
          try {
            const msgs = await message.channel.messages.fetch({ limit: 2 });
            for (const msg of msgs.values()) {
              if (msg.author.id === client.user.id) {
                await msg.delete();
              }
            }
          } catch (e) {}
        }, 5000);
        return;
      }
      
      if (password !== CONFIG.ACCESS_CODE) {
        await message.reply('❌ Código de acesso incorreto!');
        setTimeout(async () => {
          try {
            const msgs = await message.channel.messages.fetch({ limit: 2 });
            for (const msg of msgs.values()) {
              if (msg.author.id === client.user.id) {
                await msg.delete();
              }
            }
          } catch (e) {}
        }, 5000);
        return;
      }
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('monitor_all_off')
            .setLabel('Todos os Servidores ⚠️')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🌐'),
          new ButtonBuilder()
            .setCustomId('monitor_select_off')
            .setLabel('Selecionar um Servidor')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔍')
        );
      
      const reply = await message.reply({
        content: '🛡️ **Escolha uma opção para DESATIVAR o monitoramento:**',
        components: [row]
      });
      
      setTimeout(async () => {
        try {
          await message.delete();
          await reply.delete();
        } catch (e) {}
      }, 120000);
      
      return;
    }
    
    // === COMANDO !clearAll ===
    if (message.content.startsWith('!clearAll')) {
      
      const args = message.content.split(' ');
      const password = args[1];
      
      if (!password) {
        const errorMsg = await message.reply('❌ Use: `!clearAll SUA_SENHA`');
        setTimeout(async () => {
          try {
            await message.delete();
            await errorMsg.delete();
          } catch (e) {}
        }, 5000);
        return;
      }
      
      if (password !== CONFIG.ACCESS_CODE) {
        const errorMsg = await message.reply('❌ Código de acesso incorreto!');
        setTimeout(async () => {
          try {
            await message.delete();
            await errorMsg.delete();
          } catch (e) {}
        }, 5000);
        return;
      }
      
      try {
        await message.delete();
      } catch (e) {}
      
      try {
        const processingMsg = await message.channel.send('🔄 Limpando mensagens de TODAS as DMs... Isso pode levar alguns minutos...');
        
        let totalDeleted = 0;
        let totalChannels = 0;
        
        // Coletar DMs
        const dmChannels = new Map();
        
        // Método 1: Buscar do cache de channels
        client.channels.cache.forEach(channel => {
          if (channel.type === ChannelType.DM) {
            dmChannels.set(channel.id, channel);
          }
        });
        
        // Método 2: Buscar de usuários que interagiram recentemente
        client.users.cache.forEach(user => {
          if (user.dmChannel && !dmChannels.has(user.dmChannel.id)) {
            dmChannels.set(user.dmChannel.id, user.dmChannel);
          }
        });
        
        totalChannels = dmChannels.size;
        
        if (totalChannels === 0) {
          await processingMsg.edit('❌ Nenhum canal de DM encontrado para limpar.');
          setTimeout(async () => {
            try {
              await processingMsg.delete();
            } catch (e) {}
          }, 5000);
          return;
        }
        
        // Processar canais
        for (const [channelId, channel] of dmChannels) {
          let channelCount = 0;
          
          try {
            let fetchedMessages;
            let hasMore = true;
            let retryCount = 0;
            
            while (hasMore && retryCount < 3) {
              try {
                fetchedMessages = await channel.messages.fetch({ limit: 100 });
                
                if (fetchedMessages.size === 0) {
                  hasMore = false;
                  break;
                }
                
                const deletableMessages = fetchedMessages.filter(msg => 
                  msg.author.id === client.user.id
                );
                
                if (deletableMessages.size === 0) {
                  hasMore = false;
                  break;
                }
                
                for (const [id, msg] of deletableMessages) {
                  try {
                    await msg.delete();
                    channelCount++;
                    totalDeleted++;
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                  } catch (err) {
                    if (err.code === 10008) {
                      continue;
                    }
                    logger.logError(`Erro ao deletar mensagem ${id}: ${err.message}`);
                  }
                }
                
                if (fetchedMessages.size < 100) {
                  hasMore = false;
                }
                
              } catch (err) {
                retryCount++;
                logger.logError(`Erro no lote do canal ${channelId}, tentativa ${retryCount}: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
            
            if (channelCount > 0) {
              const recipient = channel.recipient ? channel.recipient.tag : 'desconhecido';
              logger.logInfo(`Limpou ${channelCount} mensagens do bot na DM com ${recipient}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
          } catch (err) {
            logger.logError(`Erro ao processar DM ${channelId}: ${err.message}`);
          }
        }
        
        await processingMsg.edit(`✅ **${totalDeleted} mensagens** do bot foram limpas de **${totalChannels} DMs**!`);
        
        setTimeout(async () => {
          try {
            await processingMsg.delete();
          } catch (e) {}
        }, 10000);
        
        logger.logInfo(`${message.author.tag} limpou ${totalDeleted} mensagens de todas as DMs usando !clearAll`);
        
      } catch (error) {
        logger.logError(`Erro ao limpar todas as DMs: ${error.message}`);
        const errorMsg = await message.channel.send('❌ Erro ao limpar mensagens. Tente novamente.');
        setTimeout(async () => {
          try {
            await errorMsg.delete();
          } catch (e) {}
        }, 5000);
      }
      
      return;
    }
    
    // === COMANDO !clear ===
    if (message.content.startsWith('!clear')) {
      
      try {
        await message.delete();
      } catch (e) {}
      
      try {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('confirm_clear')
              .setLabel('✅ Sim, limpar mensagens')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('cancel_clear')
              .setLabel('❌ Não, ignorar')
              .setStyle(ButtonStyle.Secondary)
          );
        
        const confirmMsg = await message.channel.send({
          content: '⚠️ **Tem certeza que deseja limpar todas as mensagens desta DM?**',
          components: [row]
        });
        
        const filter = (interaction) => {
          return interaction.user.id === message.author.id;
        };
        
        const collector = confirmMsg.createMessageComponentCollector({ 
          filter, 
          time: 60000,
          max: 1
        });
        
        collector.on('collect', async (interaction) => {
          try {
            if (interaction.customId === 'confirm_clear') {
              await interaction.update({ content: '🔄 Limpando mensagens...', components: [] });
              
              let deletedCount = 0;
              let fetchedMessages;
              
              try {
                do {
                  fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
                  
                  if (fetchedMessages.size === 0) break;
                  
                  const deletableMessages = fetchedMessages.filter(msg => 
                    msg.id !== confirmMsg.id
                  );
                  
                  if (deletableMessages.size === 0) break;
                  
                  for (const [id, msg] of deletableMessages) {
                    try {
                      await msg.delete();
                      deletedCount++;
                      await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (err) {
                      logger.logError(`Erro ao deletar mensagem ${id}: ${err.message}`);
                    }
                  }
                  
                } while (fetchedMessages.size >= 100);
                
                console.log(`\n🧹 ${deletedCount} mensagens foram limpas do histórico da DM de ${message.author.tag}!`);
                
                await interaction.editReply({ 
                  content: '✅ **Mensagens limpas com sucesso!**',
                  components: [] 
                });
                
                setTimeout(async () => {
                  try {
                    await confirmMsg.delete();
                  } catch (e) {}
                }, 5000);
                
                logger.logInfo(`${message.author.tag} limpou ${deletedCount} mensagens na DM`);
                
              } catch (error) {
                logger.logError(`Erro ao limpar DM: ${error.message}`);
                await interaction.editReply({ 
                  content: '❌ Erro ao limpar mensagens. Tente novamente.',
                  components: [] 
                });
                
                setTimeout(async () => {
                  try {
                    await confirmMsg.delete();
                  } catch (e) {}
                }, 5000);
              }
              
            } else if (interaction.customId === 'cancel_clear') {
              await interaction.update({ content: '❌ Operação cancelada.', components: [] });
              
              setTimeout(async () => {
                try {
                  await confirmMsg.delete();
                } catch (e) {}
              }, 3000);
            }
          } catch (error) {
            logger.logError(`Erro no coletor do !clear: ${error.message}`);
          }
        });
        
        collector.on('end', async (collected) => {
          if (collected.size === 0) {
            try {
              await confirmMsg.edit({ 
                content: '⏰ Tempo esgotado. Operação cancelada.',
                components: [] 
              });
              
              setTimeout(async () => {
                try {
                  await confirmMsg.delete();
                } catch (e) {}
              }, 3000);
            } catch (error) {}
          }
        });
        
      } catch (error) {
        logger.logError(`Erro ao processar !clear: ${error.message}`);
      }
      
      return;
    }
    
    // RESPOSTA AUTOMÁTICA
    try {
      const reply = await message.reply({
        content: `❌ **Não é possível enviar esta mensagem.**\nCaso tenha algo para falar, entre em contato com <@${CONFIG.OWNER_ID}> `
      });
      
      setTimeout(async () => {
        try {
          await reply.delete();
        } catch (e) {}
      }, 10000);
      
      logger.logInfo(`Mensagem automática enviada para ${message.author.tag} na DM`);
    } catch (error) {
      logger.logError(`Erro ao responder DM: ${error.message}`);
    }
    return;
  }

  // ===== MODERAÇÃO EM CANAIS DE SERVIDOR =====
  const isMonitoringActive = serverMonitoring.get(message.guild.id) !== false;
  
  if (!isMonitoringActive) {
    return;
  }
   
  if (isStaff(message.author.id, staffIds)) {
    return;
  }
  
  if (isAdmin(message.member, CONFIG.adminRoles)) return;

  if (containsOffensiveWord(message.content, offensiveWords)) {
    const foundWord = findOffensiveWord(message.content, offensiveWords);
    
    try {
      const permissions = message.channel.permissionsFor(client.user);
      if (!permissions.has(PermissionFlagsBits.ManageMessages)) {
        logger.logWarn(`Bot não tem permissão para deletar mensagens em #${message.channel.name}`);
        return;
      }

      if (!message.deletable) {
        logger.logWarn(`Mensagem muito antiga para ser deletada em #${message.channel.name}`);
        return;
      }

      await message.delete();
      
      stats.messagesDeleted++;

      const warningMsg = await message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🚫 Mensagem Removida')
          .setDescription(`Sua mensagem foi removida por conter palavras ofensivas.`)
          .setColor(Colors.Red)
          .addFields(
            { name: '👤 Usuário', value: message.author.toString(), inline: false },
            { name: '🗓 Data', value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), inline: false },
            { name: '🚫 Palavra', value: `**${foundWord || "desconhecida"}**`, inline: false }
          )
          .setFooter({ text: 'Caso isso tenha sido um erro, contate a staff.' })
          .setTimestamp()
        ]
      });

      setTimeout(async () => {
        try {
          await warningMsg.delete();
        } catch (e) {}
      }, 10000);

      logger.logModeration("Palavras ofensivas detectadas", message.author, message.content, message.channel, foundWord || "desconhecida");

    } catch (err) {
      logger.logError(`Erro ao moderar mensagem: ${err.message}`);
    }
  }
}

module.exports = { handleMessage };
