// ===============================
// handlers/.js - HANDLERS ESPECÍFICOS DE WARNS
// ===============================
const { EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

async function handleWarnButtons(interaction, client, warnSystem, logger) {
  const customId = interaction.customId;

  // Paginação de warns
  if (customId.startsWith('warns_prev_') || customId.startsWith('warns_next_')) {
    const parts = customId.split('_');
    const action = parts[1];
    const userId = parts[2];
    const currentPage = parseInt(parts[3]);

    const user = await client.users.fetch(userId);
    const userWarns = warnSystem.getUserWarns(interaction.guild.id, userId);
    
    if (!userWarns) {
      return interaction.reply({ content: '❌ Warns não encontrados.', flags: 64 });
    }

    const newPage = action === 'next' ? currentPage + 1 : currentPage - 1;
    const embed = warnSystem.createUserWarnsEmbed ? 
      warnSystem.createUserWarnsEmbed(user, userWarns, interaction.guild, newPage) :
      new EmbedBuilder()
        .setTitle(`Warns de ${user.tag}`)
        .setColor(Colors.Orange)
        .setDescription(`Página ${newPage}`)
        .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`warns_prev_${userId}_${newPage}`)
          .setLabel('◀ Anterior')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(newPage === 1),
        new ButtonBuilder()
          .setCustomId(`warns_next_${userId}_${newPage}`)
          .setLabel('Próximo ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(newPage * 5 >= userWarns.history.length)
      );

    await interaction.update({ embeds: [embed], components: [row] });
  }

  // Ver detalhes do warn
  if (customId.startsWith('warn_details_')) {
    const warnId = customId.replace('warn_details_', '');
    
    // Buscar o warn
    const guildWarns = warnSystem.warns?.get(interaction.guild.id);
    if (guildWarns) {
      for (const [uid, userWarns] of guildWarns) {
        const warn = userWarns.history.find(w => w.id === warnId);
        if (warn) {
          const user = await client.users.fetch(uid);
          const moderator = await client.users.fetch(warn.moderatorId).catch(() => null);
          
          const embed = new EmbedBuilder()
            .setTitle(`📋 Detalhes do Warn #${warnId}`)
            .setColor(warnSystem.getWarnColor ? warnSystem.getWarnColor(userWarns.activeCount) : Colors.Orange)
            .addFields(
              { name: '👤 Usuário', value: `${user.tag} (${uid})`, inline: true },
              { name: '🛡️ Moderador', value: moderator ? moderator.tag : warn.moderatorId, inline: true },
              { name: '📅 Data', value: warnSystem.formatDate ? warnSystem.formatDate(warn.timestamp) : new Date(warn.timestamp).toLocaleString('pt-BR'), inline: true },
              { name: '📋 Motivo', value: warn.reason, inline: false },
              { name: '🟢 Status', value: warn.active ? 'Ativo' : 'Inativo', inline: true }
            )
            .setTimestamp();

          if (warn.expiresAt) {
            embed.addFields({
              name: '⏰ Expira em',
              value: warnSystem.formatDate ? warnSystem.formatDate(warn.expiresAt) : new Date(warn.expiresAt).toLocaleString('pt-BR'),
              inline: true
            });
          }

          return interaction.reply({ embeds: [embed], flags: 64 });
        }
      }
    }

    await interaction.reply({ content: '❌ Warn não encontrado.', flags: 64 });
  }

  // Remover warn
  if (customId.startsWith('warn_remove_')) {
    const parts = customId.replace('warn_remove_', '').split('_');
    const warnId = parts[0];
    const userId = parts[1];

    const modal = new ModalBuilder()
      .setCustomId(`remove_warn_modal_${warnId}_${userId}`)
      .setTitle('Remover Warn');

    const reasonInput = new TextInputBuilder()
      .setCustomId('remove_reason')
      .setLabel('Motivo da remoção')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Por que este warn está sendo removido?')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }
}

async function handleWarnModals(interaction, warnSystem, logger) {
  if (interaction.customId.startsWith('remove_warn_modal_')) {
    const parts = interaction.customId.replace('remove_warn_modal_', '').split('_');
    const warnId = parts[0];
    const userId = parts[1];
    const reason = interaction.fields.getTextInputValue('remove_reason');

    await interaction.deferReply({ flags: 64 });

    const result = warnSystem.removeWarn(
      interaction.guild.id,
      userId,
      warnId,
      interaction.user.id,
      reason
    );

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Warn Removido')
        .setColor(Colors.Green)
        .setDescription(`Warn #${warnId} foi removido com sucesso.`)
        .addFields(
          { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
          { name: '📋 Motivo', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ ${result.error}` });
    }
  }
}

module.exports = {
  handleWarnButtons,
  handleWarnModals
};
