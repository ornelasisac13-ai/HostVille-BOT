// index.js
import dotenv from 'dotenv';
dotenv.config();

import { 
  Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, 
  ActionRowBuilder, ButtonBuilder, ButtonStyle 
} from 'discord.js';

import fs from 'fs';
import os from 'os';
import { stringify } from 'csv-stringify/sync';
import chalk from 'chalk';

// Declaração das funções de log
const logComando = (msg) => console.log(chalk.cyan('[COMANDO] ') + msg);
const logMensagemCriada = (msg) => console.log(chalk.green('[MSG CRIADA] ') + msg);
const logMensagemDeletada = (msg) => console.log(chalk.gray('[MSG DELETADA] ') + msg);
const logJoin = (msg) => console.log(chalk.magenta('[JOIN] ') + msg);
const logLeave = (msg) => console.log(chalk.magenta('[LEAVE] ') + msg);
const logCliqueBotao = (msg) => console.log(chalk.yellow('[CLIQUE BOTÃO] ') + msg);
const logExportJson = (msg) => console.log(chalk.blue('[EXPORT JSON] ') + msg);
const logExportCsv = (msg) => console.log(chalk.blue('[EXPORT CSV] ') + msg);
const logRelatorioPainel = (msg) => console.log(chalk.green('[RELATÓRIO PAINEL] ') + msg);
const logEstatisticasGerais = (msg) => console.log(chalk.green('[ESTATÍSTICAS] ') + msg);
const logErro = (msg) => console.log(chalk.red('[ERRO] ') + msg);
const logInfo = (msg) => console.log(chalk.white('[INFO] ') + msg);

// Funções auxiliares
async function getCpuUsage() {
  return (os.loadavg()[0] * 100).toFixed(2);
}

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  return `${day}d ${hour % 24}h ${min % 60}m ${sec % 60}s`;
}

// Checagem do TOKEN
const TOKEN = process.env.TOKEN || 'SEU_TOKEN_AQUI';
if (!TOKEN || TOKEN === 'SEU_TOKEN_AQUI') {
  console.error(chalk.red('⚠️ TOKEN do bot não definido!'));
  process.exit(1);
}

const ACCESS_CODE = process.env.ACCESS_CODE || 'senha';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

// Variáveis globais
const stats = {
  totalInputs: 0,
  totalOutputs: 0,
  errors: 0,
  messagesDeleted: 0,
  panelAccesses: 0,
  startTime: Date.now(),
  totalCommands: 0,
  messagesHistory: new Map(),
  joinLeaveHistory: [],
  activity24h: [],
};

// Carregar atividade anterior
async function loadActivity() {
  if (fs.existsSync('activity24h.json')) {
    const data = fs.readFileSync('activity24h.json');
    stats.activity24h = JSON.parse(data);
  }
}
loadActivity();

function saveActivity() {
  fs.writeFileSync('activity24h.json', JSON.stringify(stats.activity24h, null, 2));
}

function addActivityLog(entry) {
  if (!stats.activity24h.some(e => e.id === entry.id && e.type === entry.type)) {
    stats.activity24h.push(entry);
    saveActivity();
  }
}

// =======================
// Limpar comandos atuais e atualizar
// =======================

async function clearAndRegisterCommands() {
  // Deleta todos comandos globais existentes
  const commands = await client.application.commands.fetch();
  for (const command of commands.values()) {
    await client.application.commands.delete(command.id);
    logInfo(`Comando deletado: /${command.name}`);
  }

  // Define os comandos atualizados
  const commandsData = [
    {
      name: 'rules',
      description: 'Mostra as regras do servidor',
      options: [
        { name: 'code', type: 3, description: 'Código de acesso', required: true }
      ],
    },
    {
      name: 'adm',
      description: 'Painel administrativo',
      options: [
        { name: 'code', type: 3, description: 'Código de acesso', required: true }
      ],
    },
    {
      name: 'serverinfo',
      description: 'Mostra informações do servidor',
      options: [
        { name: 'code', type: 3, description: 'Código de acesso', required: true }
      ],
    },
  ];

  // Registra os novos comandos
  await client.application.commands.set(commandsData);
  logInfo('Comandos atualizados!');
}

// =======================
// Quando o bot estiver pronto
// =======================
client.once('ready', async () => {
  console.log(chalk.green('✅ Bot ligado!'));
  logInfo('Bot iniciado com sucesso e pronto para uso.');

  // Limpa e registra comandos
  await clearAndRegisterCommands();
});

// Eventos de mensagens
client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  const msgLog = {
    id: message.id,
    type: 'message',
    content: message.content,
    author: message.author.tag,
    timestamp: message.createdTimestamp,
    channel: message.channel.name,
  };
  addActivityLog(msgLog);
  logMensagemCriada(`Mensagem de ${message.author.tag} no canal ${message.channel.name}: ${message.content}`);
  if (!stats.messagesHistory.has(message.author.id)) {
    stats.messagesHistory.set(message.author.id, []);
  }
  stats.messagesHistory.get(message.author.id).push(msgLog);
});

// Evento mensagem deletada
client.on('messageDelete', (message) => {
  if (message.author && message.author.bot) return;
  if (!message.content && !message.embeds?.length && !message.attachments?.size) return;
  logMensagemDeletada(`Mensagem deletada de ${message.author ? message.author.tag : 'Desconhecido'} no canal ${message.channel.name}: ${message.content}`);
  stats.messagesDeleted++;
});

// Evento mensagem editada
client.on('messageUpdate', (oldMessage, newMessage) => {
  if (oldMessage.author && oldMessage.author.bot) return;
  if (oldMessage.content !== newMessage.content) {
    logInfo(`Mensagem editada de ${oldMessage.author.tag} no canal ${oldMessage.channel.name}:
De: ${oldMessage.content}
Para: ${newMessage.content}`);
  }
});

// Evento join
client.on('guildMemberAdd', (member) => {
  const joinLog = {
    id: member.id,
    type: 'join',
    username: member.user.tag,
    timestamp: Date.now(),
  };
  addActivityLog(joinLog);
  stats.joinLeaveHistory.push(joinLog);
  logJoin(`${member.user.tag} entrou no servidor`);
});

// Evento leave
client.on('guildMemberRemove', (member) => {
  const leaveLog = {
    id: member.id,
    type: 'leave',
    username: member.user.tag,
    timestamp: Date.now(),
  };
  addActivityLog(leaveLog);
  stats.joinLeaveHistory.push(leaveLog);
  logLeave(`${member.user.tag} saiu do servidor`);
});

// Eventos de interação
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    stats.totalInputs++;
    stats.totalCommands++;
    logComando(`${interaction.user.tag} usou comando /${interaction.commandName}`);
    const cmd = client.commands.get(interaction.commandName);
    if (cmd) {
      try {
        await cmd.execute(interaction);
      } catch (err) {
        stats.errors++;
        logErro(`Erro ao executar comando /${interaction.commandName}: ${err}`);
      }
    }
  } else if (interaction.isButton()) {
    stats.totalOutputs++;
    logCliqueBotao(`Botão ${interaction.customId} clicado por ${interaction.user.tag}`);
    switch (interaction.customId) {
      case 'stats':
        const duration = formatDuration(Date.now() - stats.startTime);
        const cpuUsage = await getCpuUsage();
        const statsEmbed = new EmbedBuilder()
          .setColor('#89CFF0')
          .setTitle('Estatísticas Gerais')
          .addFields(
            { name: 'Comandos', value: `${stats.totalCommands}`, inline: true },
            { name: 'Entradas', value: `${stats.totalInputs}`, inline: true },
            { name: 'Saídas', value: `${stats.totalOutputs}`, inline: true },
            { name: 'Mensagens Deletadas', value: `${stats.messagesDeleted}`, inline: true },
            { name: 'Erros', value: `${stats.errors}`, inline: true },
            { name: 'Acessos Painel', value: `${stats.panelAccesses}`, inline: true },
            { name: 'Tempo Online', value: `${duration}`, inline: true },
            { name: 'Uso CPU', value: `${cpuUsage}%`, inline: true }
          );
        const btnExportJson = new ButtonBuilder().setCustomId('export_json').setLabel('Exportar JSON').setStyle(ButtonStyle.Success);
        const btnExportCsv = new ButtonBuilder().setCustomId('export_csv').setLabel('Exportar CSV').setStyle(ButtonStyle.Secondary);
        const rowExport = new ActionRowBuilder().addComponents(btnExportJson, btnExportCsv);
        await interaction.reply({ embeds: [statsEmbed], components: [rowExport], ephemeral: true });
        break;
      case 'report':
        await interaction.reply({ content: 'Relatório enviado ao console.', ephemeral: true });
        logRelatorioPainel(`Relatório solicitado por ${interaction.user.tag}`);
        break;
      case 'cleanConsole':
        console.clear();
        await interaction.reply({ content: 'Console limpo!', ephemeral: true });
        break;
      case 'export_json':
        const dataJson = JSON.stringify({ stats, activity24h: stats.activity24h }, null, 2);
        fs.writeFileSync('export.json', dataJson);
        logExportJson('Arquivo JSON exportado: export.json');
        await interaction.reply({ content: 'Arquivo JSON exportado como export.json', ephemeral: true });
        break;
      case 'export_csv':
        const csvData = [
          ['ID', 'Tipo', 'Conteúdo', 'Autor', 'Timestamp', 'Canal'],
        ];
        for (const log of stats.activity24h) {
          csvData.push([
            log.id,
            log.type,
            log.content || '',
            log.author || log.username,
            new Date(log.timestamp).toLocaleString(),
            log.channel || ''
          ]);
        }
        const csvString = stringify(csvData);
        fs.writeFileSync('export.csv', csvString);
        logExportCsv('Arquivo CSV exportado: export.csv');
        await interaction.reply({ content: 'Arquivo CSV exportado como export.csv', ephemeral: true });
        break;
    }
  }
});

// Login
client.login(TOKEN)
  .then(() => {
    console.log(chalk.green('✅ Bot ligado!'));
    logInfo('Bot iniciado com sucesso e pronto para uso.');
  })
  .catch((err) => {
    console.error(chalk.red('❌ Erro ao fazer login:'), err);
  });
