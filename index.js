import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.TKD) {
  console.error("❌ Variável TKD não encontrada no .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`🚀 Bot online: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  // Comando /rule
  if (interaction.commandName === "rule") {
    // Mensagem apenas pra pessoa que executou
    await interaction.followUp({
      content: "✅ Comando executado!",
      ephemeral: true,
    });

    // Embed com regras, sem tracinho
    const embedRules = new EmbedBuilder()
      .setTitle("📜 Regras do HostVille")
      .setColor("#D3AF37")
      .setDescription(
        "1. Respeite todos.\n" +
        "2. Nada de spam.\n" +
        "3. Comandos só no canal certo.\n" +
        "4. Aproveite o servidor!"
      );

    // Envia para o canal onde foi executado
    await interaction.channel.send({ embeds: [embedRules] });
  }

  // Comando /info
  if (interaction.commandName === "info") {
    const uptimeMinutes = Math.floor(client.uptime / 1000 / 60);
    const embedInfo = new EmbedBuilder()
      .setTitle("ℹ️ Info do Bot")
      .setColor("#D3AF37")
      .setDescription(`Uptime: ${uptimeMinutes} minutos`);
    
    await interaction.followUp({ embeds: [embedInfo], ephemeral: true });
  }
});

client.login(process.env.TKD);
