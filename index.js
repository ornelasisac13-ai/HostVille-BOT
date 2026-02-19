const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder 
} = require('discord.js');
const os = require('os');

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN || !ACCESS_CODE) throw new Error("TOKEN ou ACCESS_CODE não definido!");

// ==================== CLIENTE ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    presence: {
        status: 'online',
        activities: [{ name: '/rule | /info | /help', type: 0 }]
    }
});

// ==================== ESTATÍSTICAS ====================
const stats = { totalCommands: 0, commandsUsed: {}, errors: 0, restarts: 0 };

// ==================== LOGGER ====================
function log(type, msg) {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${type}: ${msg}`);
}

// ==================== MONITORAMENTO ====================
function monitor() {
    const mem = process.memoryUsage();
    const rssMB = (mem.rss / 1024 / 1024).toFixed(2);
    const ping = client.ws.ping;
    const uptimeMs = Date.now() - client.uptime;
    const uptime = new Date(uptimeMs).toISOString().substr(11, 8);
    log('MONITOR', `RAM: ${rssMB} MB | Ping: ${ping}ms | Uptime: ${uptime}`);
}

// Atualiza a cada 6h
setInterval(monitor, 6 * 60 * 60 * 1000);

// ==================== COMANDOS SLASH ====================
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor')
        .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true)),
    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Informações do bot e membros online/offline'),
    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Estatísticas do bot')
        .setDefaultMemberPermissions(0),
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Testa a latência'),
    new SlashCommandBuilder()
        .setName('server')
        .setDescription('Informações do servidor'),
    new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Reinicia o bot')
        .setDefaultMemberPermissions(8) // admin apenas
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
async function registerCommands() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        log('INFO', `Comandos registrados: ${commands.map(c => c.name).join(', ')}`);
    } catch (err) {
        log('ERRO', `Erro ao registrar comandos: ${err}`);
    }
}

// ==================== EVENTOS ====================
client.once('ready', () => {
    log('INFO', `Bot online! Tag: ${client.user.tag}`);
    registerCommands();
    monitor();
});

// ==================== INTERACTIONS ====================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;

    // Contabiliza comandos
    stats.totalCommands++;
    stats.commandsUsed[commandName] = (stats.commandsUsed[commandName] || 0) + 1;
    log('CMD', `/${commandName} usado por ${user.tag} em ${guild?.name || 'DM'}`);

    try {
        // /rule
        if (commandName === 'rule') {
            const code = interaction.options.getString('code');
            if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido!", flags: 64 });
            await interaction.deferReply({ flags: 64 });

            const embed = new EmbedBuilder()
                .setColor(0x89CFF0)
                .setTitle("📜 Regras - HostVille Greenville RP")
                .setDescription(`As regras gerais têm como objetivo garantir a ordem, respeito e boa convivência...`)
                .setImage("https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png");

            await interaction.channel.send({ embeds: [embed] });
            await interaction.deleteReply();
        }

        // /info
        if (commandName === 'info') {
            const members = guild.members.cache;
            const online = members.filter(m => m.presence?.status === 'online').size;
            const offline = members.size - online;

            const embed = new EmbedBuilder()
                .setColor(0x89CFF0)
                .setTitle(`🤖 Info do Bot - ${client.user.tag}`)
                .addFields(
                    { name: "ID", value: client.user.id, inline: true },
                    { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
                    { name: "Canais", value: `${client.channels.cache.size}`, inline: true },
                    { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                    { name: "Uptime", value: new Date(client.uptime).toISOString().substr(11, 8), inline: true },
                    { name: "Membros Online/Offline", value: `${online} / ${offline}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: "HostVille Greenville RP" });

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        // /stats
        if (commandName === 'stats') {
            const top = Object.entries(stats.commandsUsed)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([c, n]) => `/${c}: ${n} usos`)
                .join('\n') || 'Nenhum comando usado';

            const embed = new EmbedBuilder()
                .setColor(0x89CFF0)
                .setTitle("📊 Estatísticas do Bot")
                .addFields(
                    { name: "Total de Comandos", value: `${stats.totalCommands}`, inline: true },
                    { name: "Erros", value: `${stats.errors}`, inline: true },
                    { name: "Reinícios", value: `${stats.restarts}`, inline: true },
                    { name: "Top Comandos", value: top }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        // /ping
        if (commandName === 'ping') {
            const msg = await interaction.reply({ content: "🏓 Pong!", flags: 64, fetchReply: true });
            const ping = msg.createdTimestamp - interaction.createdTimestamp;
            await interaction.editReply(`🏓 Pong! | Latência: ${ping}ms | API: ${client.ws.ping}ms`);
        }

        // /server
        if (commandName === 'server') {
            const g = guild;
            const embed = new EmbedBuilder()
                .setColor(0x89CFF0)
                .setTitle(`📌 ${g.name}`)
                .setThumbnail(g.iconURL())
                .addFields(
                    { name: "ID", value: g.id, inline: true },
                    { name: "Membros", value: `${g.memberCount}`, inline: true },
                    { name: "Criado em", value: g.createdAt.toLocaleDateString('pt-BR'), inline: true },
                    { name: "Canais", value: `${g.channels.cache.size}`, inline: true },
                    { name: "Roles", value: `${g.roles.cache.size}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        // /restart
        if (commandName === 'restart') {
            await interaction.reply({ content: "🔄 Reiniciando o bot...", flags: 64 });
            stats.restarts++;
            client.destroy();
            setTimeout(() => client.login(TOKEN), 3000);
        }

    } catch (err) {
        stats.errors++;
        log('ERRO', `Erro ao executar comando /${commandName}: ${err}`);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "⚠️ Ocorreu um erro.", flags: 64 });
        } else {
            await interaction.reply({ content: "⚠️ Ocorreu um erro.", flags: 64 });
        }
    }
});

// ==================== LOG DE EVENTOS ====================

// Membros
client.on('guildMemberAdd', member => log('MEMBRO', `Entrou: ${member.user.tag}`));
client.on('guildMemberRemove', member => log('MEMBRO', `Saiu: ${member.user.tag}`));

// Mensagens deletadas
client.on('messageDelete', message => {
    if (message.partial) return;
    log('MSG', `Mensagem deletada de ${message.author.tag} no #${message.channel.name}: ${message.content}`);
});

// Mensagens editadas
client.on('messageUpdate', (oldMsg, newMsg) => {
    if (oldMsg.partial) return;
    log('MSG', `Mensagem editada de ${oldMsg.author.tag} no #${oldMsg.channel.name}: "${oldMsg.content}" → "${newMsg.content}"`);
});

// ==================== START ====================
client.login(TOKEN).catch(err => log('ERRO', err));

// ==================== ERROS ====================
process.on('unhandledRejection', err => log('ERRO', `Promise rejeitada: ${err}`));
process.on('uncaughtException', err => log('ERRO', `Exceção não capturada: ${err}`));

// Monitor inicial
monitor();
