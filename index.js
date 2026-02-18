import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } from 'discord.js';

// ⚠️ Token
const TKD = process.env.TKD || "<SEU_TOKEN_AQUI>";

const GUILD_ID = "928614664840052757";
const BOT_ID = "1473705296101900420";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// COMANDOS
const commands = [
  { name: "rule", description: "Mostra as regras do servidor" },
  { name: "info", description: "Mostra informações do bot" }
];

// Registrar comandos
const rest = new REST({ version: "10" }).setToken(TKD);
(async () => {
  try {
    console.log("Registrando comandos...");
    await rest.put(Routes.applicationGuildCommands(BOT_ID, GUILD_ID), { body: commands });
    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.error(err);
  }
})();

// READY
client.once("clientReady", () => {
  console.log(`🚀 Bot online: ${client.user.tag}`);
});

// INTERAÇÕES
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  // ========= RULE COMMAND =========
  if (interaction.commandName === "rule") {
    // mensagem privada de confirmação
    await interaction.reply({ content: "✅ O comando foi executado com sucesso!", ephemeral: true });

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

    await interaction.followUp({ embeds: [embed], ephemeral: false });
  }

  // ========= INFO COMMAND =========
  if (interaction.commandName === "info") {
    const uptime = Math.floor(client.uptime / 1000 / 60); // minutos
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

    // apenas para quem executou
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// LOGIN
if (!TKD) {
  console.error("❌ Variável TKD não encontrada! Adicione seu token.");
  process.exit();
} else {
  console.log("✅ Variável TKD encontrada! Testando login...");
  client.login(TKD);
}
