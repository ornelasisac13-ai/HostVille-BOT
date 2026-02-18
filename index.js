client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  // ========= RULE COMMAND =========
  if (interaction.commandName === "rule") {
    // envia mensagem privada só pra quem executou (sem tracinho)
    await interaction.followUp({ content: "✅ O comando foi executado com sucesso!", ephemeral: true });

    // embed público
    const embed = new EmbedBuilder()
      .setTitle("📜 Regras e Diretrizes - HostVille Greenville RP")
      .setColor("#D3AF37")
      .setDescription(`
As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.
➤ Ao participar de HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso, respeitando os demais jogadores, a staff e as diretrizes do servidor.

🤖 AutoMod
Sistema AutoMod ativo 24h prevenindo spam, flood, palavras proibidas, links suspeitos e comportamentos que fogem das regras.

⚠️ Blacklist
Proibição total de participação no servidor em caso de tentativas de burlar regras, uso de exploits, contas alternativas ou atitudes prejudiciais à comunidade.

🔒 Segurança e Integridade
Não será tolerado burlar regras do Discord ou do servidor. Exploits, bugs, contas alternativas e automações ilegais são proibidos.

✅ Regras Oficiais
Advertência | Kick | Banimento

🚦 Regras de Trânsito
• Máx. 85 MPH
• Respeite sinalizações
• Use setas ao virar
• Pare em STOP e sinais vermelhos

⚖️ Leis Gerais
• ❌ Vandalismo, roubo ou armas sem permissão
• 🚫 Não cause caos em público sem combinar

🎭 Roleplay (RP)
• ✅ Siga a história do personagem
• ⚠️ Crie nome, profissão e personalidade
• ❌ Trollar, Power-Gaming, Fail-RP
• 🕒 NLR: aguarde 3 min após morte/prisão

💼 Trabalho e Economia
• 👷‍♂️ 1 trabalho por sessão
• 💰 Salários pelo sistema oficial
• 🚫 Dinheiro fora de eventos proibido

🗣️ Comunicação
• 🤝 Fale com respeito, sem spam ou ofensas
• 🎙️ Voz apenas em emergências
• 📱 Use telefone do jogo
• 💬 Fora do RP, use // antes da frase

📎 Links oficiais:
[Política de Privacidade](https://nativo-00.gitbook.io/hostville-bot-privacy-policy/)
[Termos de Uso](https://nativo-00.gitbook.io/hostville-bot-terms/)
      `)
      .setImage("https://image2url.com/r2/default/images/1771434058556-31be1385-d620-4c2d-a19d-54ce3c9acd6f.jpg")
      .setFooter({ text: "Powered by Y2k_Nat" });

    await interaction.channel.send({ embeds: [embed] });
  }

  // ========= INFO COMMAND =========
  if (interaction.commandName === "info") {
    const uptime = Math.floor(client.uptime / 1000 / 60);
    const embed = new EmbedBuilder()
      .setTitle("ℹ️ Info - HostVille Bot")
      .setColor("#D3AF37")
      .setDescription(`
**Powered by:** Y2k_Nat
**Tempo online:** ${uptime} min
**Quantidade de servidores:** ${client.guilds.cache.size}
**Quantidade de membros totais:** ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}
      `)
      .setFooter({ text: "Powered by Y2k_Nat" });

    await interaction.followUp({ embeds: [embed], ephemeral: true });
  }
});
