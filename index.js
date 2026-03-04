const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMessageReactions
] });

client.once('clientReady', () => {
  console.log('--- Bot iniciado com sucesso! ---');
  console.log(`ID do Bot: ${client.user.id}`);
  console.log(`Servidores: ${client.guilds.cache.size}`);
  console.log('Olá! O bot está online e pronto para uso.');
});

// Evento para mensagem apagada
client.on('messageDelete', (message) => {
  if (message.author.bot) return; // Ignorar mensagens de bots
  console.log(`Mensagem apagada por: ${message.author.tag}`);
  console.log(`Conteúdo da mensagem: ${message.content}`);
});

// Login do bot
client.login('SEU_TOKEN_AQUI');
