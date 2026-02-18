import { Client, GatewayIntentBits } from "discord.js";

// Pega o token da variável de ambiente TKD
const token = process.env.TKD;

if (!token) {
  console.error("❌ A variável TKD não está definida!");
  process.exit(1); // Para o bot
}

console.log("✅ Variável TKD encontrada! Testando login...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`🚀 Bot online: ${client.user.tag}`);
});

client.login(token).catch(err => {
  console.error("❌ Erro ao logar:", err);
});
