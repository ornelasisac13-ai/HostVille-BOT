// index.js
const { Client, GatewayIntentBits, Partials, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const chalk = require('chalk');
const readline = require('readline');

dotenv.config();

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers,
],
partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// === VARIÁVEL GLOBAL PARA CONTROLAR O READLINE ===
let rl = null;
let isMenuActive = false;

// === FUNÇÕES DE LOG ===
function getTimestamp() {
return chalk.gray([${new Date().toLocaleString('pt-BR')}]);
}

function logInfo(message) {
console.log(${getTimestamp()} ${chalk.green('➜ INFO')}: ${chalk.cyan(message)});
}

function logError(message) {
console.log(${getTimestamp()} ${chalk.red('✖ ERRO')}: ${chalk.yellow(message)});
}

function logWarn(message) {
console.log(${getTimestamp()} ${chalk.yellow('⚠ AVISO')}: ${chalk.white(message)});
}

// === COMANDO /adm ===
const commands = [
{
data: {
name: 'adm',
description: 'Painel administrativo',
options: [{ name: 'code', type: 3, description: 'Senha de acesso', required: true }],
},
async execute(interaction) {
const code = interaction.options.getString('code');
if (code !== process.env.ACCESS_CODE) {
return interaction.reply({ content: 'Código incorreto!', ephemeral: true });
}

const row = new ActionRowBuilder().addComponents(  
    new ButtonBuilder().setCustomId('stats').setLabel('Estatísticas').setStyle(ButtonStyle.Primary),  
    new ButtonBuilder().setCustomId('console').setLabel('Ver no console').setStyle(ButtonStyle.Secondary)  
  );  

  await interaction.reply({ content: 'Painel Administrativo:', components: [row], ephemeral: true });  
  logInfo(`/adm usado por ${interaction.user.tag}`);  
},

},
];

// === EVENTO: BOT PRONTO ===
client.once('clientReady', async () => {
console.log('\n' + chalk.green.underline('═'.repeat(40)));
console.log(chalk.green('  🤖 BOT ESTÁ ONLINE!'));
console.log(chalk.green.underline('═'.repeat(40)));

console.log(chalk.cyan('\n  📊 ESTATÍSTICAS INICIAIS:'));
console.log(chalk.white(   • Tag: ${client.user.tag}));
console.log(chalk.white(   • ID: ${client.user.id}));
console.log(chalk.white(   • Servidores: ${client.guilds.cache.size}));

if (client.application?.commands) {
await client.application.commands.set(commands.map(c => c.data));
logInfo('Comando /adm registrado globalmente.');
}

console.log(chalk.green('\n  ✅ Tudo pronto! Bot conectado com sucesso.\n'));

// Inicia o menu interativo
initReadline();
showMenu();
});

// === INICIALIZAR READLINE ===
function initReadline() {
if (!rl) {
rl = readline.createInterface({
input: process.stdin,
output: process.stdout,
});

rl.on('close', () => {  
  isMenuActive = false;  
});

}
}

// === EVENTO: INTERAÇÃO (BOTÕES) ===
client.on('interactionCreate', async (interaction) => {
if (!interaction.isButton()) return;

switch (interaction.customId) {
case 'stats': {
const uptimeSeconds = Math.floor(client.uptime / 1000);
const embed = new EmbedBuilder()
.setTitle('📊 Estatísticas do Bot')
.setColor(Colors.Green)
.addFields(
{ name: '🏓 Ping', value: ${client.ws.ping}ms, inline: true },
{ name: '⏱️ Uptime', value: ${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m, inline: true },
{ name: '🏛️ Servidores', value: ${client.guilds.cache.size}, inline: true }
);
await interaction.reply({ embeds: [embed], ephemeral: true });
logInfo(${interaction.user.tag} abriu estatísticas);
break;
}

case 'console': {  
  console.log(chalk.yellow('\n═══ ESTATÍSTICAS DO BOT ═══'));  
  console.log(chalk.white(`Ping:    ${client.ws.ping}ms`));  
  console.log(chalk.white(`Uptime:  ${Math.floor(client.uptime / 3600000)}h`));  
  console.log(chalk.white(`Servers: ${client.guilds.cache.size}`));  
  console.log(chalk.yellow('═════════════════════════════\n'));  
  await interaction.reply({ content: '✅ Verifique o console!', ephemeral: true });  
  break;  
}

}
});

// === EVENTO: MENSAGEM DELETADA ===
client.on('messageDelete', async (message) => {
if (!message.guild || !message.author) return;

let deleter = 'Desconhecido';
try {
const auditLogs = await message.guild.fetchAuditLogs({ type: 72, limit: 1 });
const entry = auditLogs.entries.first();
if (entry && entry.target.id === message.author.id && entry.createdTimestamp > Date.now() - 5000) {
deleter = entry.executor.tag;
}
} catch (e) {
logWarn('Não foi possível buscar logs de auditoria');
}

console.log(chalk.red.bgBlack.bold('\n 🗑️ MENSAGEM DELETADA '));
console.log(chalk.red('────────────────────────────────'));
console.log(chalk.red(   Autor:     ${message.author.tag}));
console.log(chalk.red(   Conteúdo: ${message.content || '[sem texto]'}));
console.log(chalk.red(   Deletado:  ${deleter}));
console.log(chalk.red(   Canal:     #${message.channel.name}));
console.log(chalk.red('────────────────────────────────\n'));
});

// === EVENTO: MEMBRO ENTROU ===
client.on('guildMemberAdd', async (member) => {
console.log(chalk.green.bgBlack.bold('\n 👤 NOVO MEMBRO '));
console.log(chalk.green('────────────────────────────────'));
console.log(chalk.green(   Usuário: ${member.user.tag}));
console.log(chalk.green(   ID:      ${member.user.id}));
console.log(chalk.green(   Servidor:${member.guild.name}));
console.log(chalk.green('────────────────────────────────\n'));
logInfo(Novo membro: ${member.user.tag} (${member.guild.name}));
});

// === EVENTO: MEMBRO SAIU ===
client.on('guildMemberRemove', async (member) => {
console.log(chalk.red.bgBlack.bold('\n ❌ MEMBRO SAIU '));
console.log(chalk.red('────────────────────────────────'));
console.log(chalk.red(   Usuário: ${member.user.tag}));
console.log(chalk.red(   Servidor:${member.guild.name}));
console.log(chalk.red('────────────────────────────────\n'));
logInfo(Membro saiu: ${member.user.tag} (${member.guild.name}));
});

// === EVENTO: CANAL CRIADO ===
client.on('channelCreate', async (channel) => {
if (!channel.guild) return;
console.log(chalk.blue.bgBlack.bold('\n 📁 CANAL CRIADO '));
console.log(chalk.blue('────────────────────────────────'));
console.log(chalk.blue(   Nome:  #${channel.name}));
console.log(chalk.blue(   Tipo:  ${channel.type}));
console.log(chalk.blue(   Servidor: ${channel.guild.name}));
console.log(chalk.blue('────────────────────────────────\n'));
});

// === EVENTO: CANAL DELETADO ===
client.on('channelDelete', async (channel) => {
if (!channel.guild) return;
console.log(chalk.red.bgBlack.bold('\n 🗑️ CANAL DELETADO '));
console.log(chalk.red('────────────────────────────────'));
console.log(chalk.red(   Nome:  #${channel.name}));
console.log(chalk.red(   Servidor: ${channel.guild.name}));
console.log(chalk.red('────────────────────────────────\n'));
});

// === ERROS NÃO TRATADOS ===
process.on('unhandledRejection', (error) => {
logError(Erro não tratado: ${error.message});
console.error(error);
});

process.on('uncaughtException', (error) => {
logError(Exceção não tratada: ${error.message});
console.error(error);
process.exit(1);
});

// ==========================================
//        MENU INTERATIVO NO CONSOLE
// ==========================================

function showMenu() {
if (isMenuActive) return;
isMenuActive = true;

console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
console.log(chalk.cyan('║      🎮 MENU DO CONSOLE DO BOT       ║'));
console.log(chalk.cyan('╠══════════════════════════════════════╣'));
console.log(chalk.cyan('║  1. 📊 Ver estatísticas              ║'));
console.log(chalk.cyan('║  2. 🏛️ Listar servidores              ║'));
console.log(chalk.cyan('║  3. 👥 Ver membros de um servidor     ║'));
console.log(chalk.cyan('║  4. 📢 Enviar mensagem para canal     ║'));
console.log(chalk.cyan('║  5. 🔄 Atualizar dados               ║'));
console.log(chalk.cyan('║  0. ❌ Sair                           ║'));
console.log(chalk.cyan('╚══════════════════════════════════════╝'));

rl.question(chalk.yellow('\n👉 Escolha uma opção: '), (answer) => {
isMenuActive = false;
handleMenuOption(answer);
});
}

function handleMenuOption(option) {
if (!rl || rl.closed) {
initReadline();
}

switch (option) {
case '1':
showStats();
break;
case '2':
listServers();
break;
case '3':
listMembersInServer();
break;
case '4':
sendMessageToChannel();
break;
case '5':
console.log(chalk.green('🔄 Dados atualizados!'));
showMenu();
break;
case '0':
console.log(chalk.red('❌ Encerrando...'));
if (rl && !rl.closed) {
rl.close();
}
process.exit(0);
default:
console.log(chalk.red('❌ Opção inválida!'));
showMenu();
}
}

function showStats() {
const uptimeSeconds = Math.floor(client.uptime / 1000);
const hours = Math.floor(uptimeSeconds / 3600);
const minutes = Math.floor((uptimeSeconds % 3600) / 60);
const seconds = uptimeSeconds % 60;

console.log(chalk.yellow('\n═══ 📊 ESTATÍSTICAS DO BOT ═══'));
console.log(chalk.white(🤖 Tag:        ${client.user.tag}));
console.log(chalk.white(🏓 Ping:       ${client.ws.ping}ms));
console.log(chalk.white(⏱️  Uptime:     ${hours}h ${minutes}m ${seconds}s));
console.log(chalk.white(🏛️  Servidores: ${client.guilds.cache.size}));
console.log(chalk.white(👥 Usuários:   ${client.users.cache.size}));
console.log(chalk.yellow('═══════════════════════════════\n'));

showMenu();
}

function listServers() {
console.log(chalk.yellow('\n═══ 🏛️ SERVIDORES DO BOT ═══'));

if (client.guilds.cache.size === 0) {
console.log(chalk.gray('Nenhum servidor encontrado.'));
} else {
client.guilds.cache.forEach((guild, index) => {
console.log(chalk.white(${index + 1}. ${guild.name} (${guild.memberCount} membros) - ID: ${guild.id}));
});
}

console.log(chalk.yellow('══════════════════════════════\n'));
showMenu();
}

function listMembersInServer() {
const guilds = Array.from(client.guilds.cache.values());

if (guilds.length === 0) {
console.log(chalk.red('Nenhum servidor encontrado.'));
showMenu();
return;
}

console.log(chalk.yellow('\n═══ 👥 ESCOLHA UM SERVIDOR ═══'));
guilds.forEach((guild, index) => {
console.log(chalk.white(${index + 1}. ${guild.name}));
});

rl.question(chalk.yellow('\n👉 Digite o número do servidor: '), async (answer) => {
const index = parseInt(answer) - 1;

if (index >= 0 && index < guilds.length) {  
  const guild = guilds[index];  
  console.log(chalk.cyan(`\nCarregando membros de ${guild.name}...`));  
    
  try {  
    await guild.members.fetch();  
    const members = guild.members.cache;  
      
    console.log(chalk.yellow(`\n═══ MEMBROS DE ${guild.name.toUpperCase()} ═══`));  
    console.log(chalk.white(`Total: ${members.size} membros\n`));  
      
    let count = 0;  
    members.forEach((member) => {  
      if (count < 10) {  
        const status = member.user.bot ? chalk.blue('[BOT]') : chalk.green('[USER]');  
        const status2 = member.manageable ? chalk.yellow(' [MOD]') : '';  
        console.log(`  ${status}${status2} ${member.user.tag} - ${member.user.id}`);  
        count++;  
      }  
    });  
      
    if (members.size > 10) {  
      console.log(chalk.gray(`  ... e mais ${members.size - 10} membros`));  
    }  
      
    console.log(chalk.yellow('══════════════════════════════════════\n'));  
  } catch (error) {  
    logError(`Erro ao buscar membros: ${error.message}`);  
  }  
} else {  
  console.log(chalk.red('Servidor inválido!'));  
}  
  
showMenu();

});
}

function sendMessageToChannel() {
const guilds = Array.from(client.guilds.cache.values());

if (guilds.length === 0) {
console.log(chalk.red('Nenhum servidor encontrado.'));
showMenu();
return;
}

console.log(chalk.yellow('\n═══ 📢 ENVIAR MENSAGEM ═══'));
guilds.forEach((guild, index) => {
console.log(chalk.white(${index + 1}. ${guild.name}));
});

rl.question(chalk.yellow('\n👉 Escolha o servidor: '), (guildAnswer) => {
const guildIndex = parseInt(guildAnswer) - 1;

if (guildIndex >= 0 && guildIndex < guilds.length) {  
  const guild = guilds[guildIndex];  
  const channels = Array.from(guild.channels.cache.filter(c => c.type === 0).values());  
    
  if (channels.length === 0) {  
    console.log(chalk.red('Nenhum canal de texto encontrado.'));  
    showMenu();  
    return;  
  }  
    
  console.log(chalk.cyan('\n📁 Canais de texto:'));  
  channels.forEach((channel, index) => {  
    console.log(chalk.white(`${index + 1}. #${channel.name}`));  
  });  
    
  rl.question(chalk.yellow('\n👉 Escolha o canal: '), async (channelAnswer) => {  
    const channelIndex = parseInt(channelAnswer) - 1;  
      
    if (channelIndex >= 0 && channelIndex < channels.length) {  
      const channel = channels[channelIndex];  
        
      rl.question(chalk.yellow('\n📝 Digite a mensagem: '), async (message) => {  
        try {  
          await channel.send(message);  
          console.log(chalk.green(`\n✅ Mensagem enviada para #${channel.name}!`));  
        } catch (error) {  
          logError(`Erro ao enviar mensagem: ${error.message}`);  
        }  
        showMenu();  
      });  
    } else {  
      console.log(chalk.red('Canal inválido!'));  
      showMenu();  
    }  
  });  
} else {  
  console.log(chalk.red('Servidor inválido!'));  
  showMenu();  
}

});
}

// === LOGIN ===
client.login(process.env.TOKEN);
