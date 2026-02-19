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

// ==================== CORES ANSI ====================
const C = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

// ==================== ESTATÍSTICAS ====================
const stats = { totalCommands: 0, commandsUsed: {}, errors: 0, restarts: 0 };

// ==================== LOGGER BONITO ====================
const Logger = {
    log: (type, msg, color = C.white) => {
        const time = new Date().toLocaleTimeString('pt-BR');
        console.log(`${C.cyan}[${time}]${C.reset} ${color}${type}:${C.reset} ${msg}`);
    },
    info: (msg) => Logger.log('INFO', msg, C.blue),
    success: (msg) => Logger.log('OK', msg, C.green),
    warn: (msg) => Logger.log('AVISO', msg, C.yellow),
    error: (msg) => Logger.log('ERRO', msg, C.red),
    cmd: (cmd, user, guild) => {
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
        const guildText = guild ? ` em ${guild}` : '';
        Logger.log('CMD', `/${cmd} usado por ${user}${guildText}`, C.magenta);
    },
    ascii: (text) => console.log(`\n${C.cyan}╔════════════════════════════════════╗\n║  ${C.white}${text}${C.cyan}\n╚════════════════════════════════════╝${C.reset}\n`),
    line: () => console.log(C.gray + '─────────────────────────────────────' + C.reset)
};

// ==================== MONITORAMENTO ====================
const Monitor = {
    getMemory: () => {
        const m = process.memoryUsage();
        return {
            rss: (m.rss / 1024 / 1024).toFixed(2),
            heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2),
            heapTotal: (m.heapTotal / 1024 / 1024).toFixed(2)
        };
    },
    getPing: () => client.ws.ping,
    getUptime: () => {
        const ms = Date.now() - client.uptime;
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
    },
    status: () => {
        const mem = Monitor.getMemory();
        Logger.info(`💾 RAM: ${mem.rss}MB | ⚡ Ping: ${Monitor.getPing()}ms | ⏱️ Uptime: ${Monitor.getUptime()}`);
    }
};

// ==================== CLIENTE ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    presence: { status: 'online', activities: [{ name: '/rule | /info', type: 0 }] }
});

// ==================== COMANDOS SLASH ====================
const commands = [
    new SlashCommandBuilder().setName('rule').setDescription('Exibe as regras').addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true)),
    new SlashCommandBuilder().setName('info').setDescription('Info do bot e membros online/offline'),
    new SlashCommandBuilder().setName('stats').setDescription('Estatísticas do bot').setDefaultMemberPermissions(0),
    new SlashCommandBuilder().setName('ping').setDescription('Testa a latência'),
    new SlashCommandBuilder().setName('server').setDescription('Informações do servidor'),
    new SlashCommandBuilder().setName('restart').setDescription('Reinicia o bot').setDefaultMemberPermissions(8)
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
async function registerCommands() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        Logger.success(`Comandos registrados: ${commands.map(c => c.name).join(', ')}`);
    } catch (err) {
        Logger.error(`Erro ao registrar comandos: ${err}`);
    }
}

// ==================== EVENTOS ====================
client.once('clientReady', () => {
    Logger.ascii('HOSTVILLE BOT ONLINE');
    Logger.success(`Tag: ${client.user.tag} | ID: ${client.user.id}`);
    Logger.line();
    registerCommands();

    // Monitor inicial + a cada 6h
    Monitor.status();
    setInterval(Monitor.status, 6 * 60 * 60 * 1000);
});

// ==================== INTERACTIONS ====================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;

    Logger.cmd(commandName, user.tag, guild?.name);

    try {
        if (commandName === 'rule') {
            const code = interaction.options.getString('code');
            if (code !== ACCESS_CODE) return interaction.reply({ content: "❌ Código inválido!", flags: 64 });
            await interaction.deferReply({ flags: 64 });
            const embed = new EmbedBuilder().setColor(0x89CFF0).setTitle("📜 Regras").setDescription("Regras completas aqui...");
            await interaction.channel.send({ embeds: [embed] });
            await interaction.deleteReply();
        }

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
                    { name: "Uptime", value: Monitor.getUptime(), inline: true },
                    { name: "Online/Offline", value: `${online} / ${offline}`, inline: true }
                )
                .setFooter({ text: "HostVille Greenville RP" })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (commandName === 'restart') {
            await interaction.reply({ content: "🔄 Reiniciando...", flags: 64 });
            stats.restarts++;
            client.destroy();
            setTimeout(() => client.login(TOKEN), 3000);
        }

        if (commandName === 'stats') {
            const top = Object.entries(stats.commandsUsed).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([c,n])=>`/${c}: ${n}`).join('\n') || 'Nenhum comando usado';
            const embed = new EmbedBuilder().setColor(0x89CFF0).setTitle("📊 Estatísticas").addFields(
                { name: "Total", value: `${stats.totalCommands}`, inline:true },
                { name: "Erros", value: `${stats.errors}`, inline:true },
                { name: "Reinícios", value: `${stats.restarts}`, inline:true },
                { name: "Top Comandos", value: top }
            ).setTimestamp();
            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (commandName === 'ping') {
            const msg = await interaction.reply({ content:"🏓 Pong!", flags:64, fetchReply:true });
            const ping = msg.createdTimestamp - interaction.createdTimestamp;
            await interaction.editReply(`🏓 Pong! | Latência: ${ping}ms | API: ${client.ws.ping}ms`);
        }

        if (commandName === 'server') {
            const g = guild;
            const embed = new EmbedBuilder().setColor(0x89CFF0).setTitle(`📌 ${g.name}`)
                .addFields(
                    { name:"ID", value:g.id, inline:true },
                    { name:"Membros", value:`${g.memberCount}`, inline:true },
                    { name:"Canais", value:`${g.channels.cache.size}`, inline:true },
                    { name:"Roles", value:`${g.roles.cache.size}`, inline:true },
                    { name:"Criado em", value:g.createdAt.toLocaleDateString('pt-BR'), inline:true }
                )
                .setThumbnail(g.iconURL())
                .setTimestamp();
            await interaction.reply({ embeds:[embed], flags:64 });
        }

    } catch(err){
        stats.errors++;
        Logger.error(`Erro /${commandName}: ${err}`);
        if(interaction.replied || interaction.deferred) await interaction.followUp({ content:"⚠️ Ocorreu um erro.", flags:64 });
        else await interaction.reply({ content:"⚠️ Ocorreu um erro.", flags:64 });
    }
});

// ==================== LOG DE EVENTOS ====================
client.on('guildMemberAdd', member => Logger.success(`👋 Novo membro: ${member.user.tag}`));
client.on('guildMemberRemove', member => Logger.warn(`❌ Saiu: ${member.user.tag}`));

client.on('messageDelete', message => {
    if(message.partial) return;
    Logger.warn(`🗑️ Mensagem deletada de ${message.author.tag} no #${message.channel.name}: ${message.content}`);
});

client.on('messageUpdate', (oldMsg,newMsg)=>{
    if(oldMsg.partial) return;
    Logger.info(`✏️ ${oldMsg.author.tag} editou no #${oldMsg.channel.name}: "${oldMsg.content}" → "${newMsg.content}"`);
});

// ==================== START ====================
client.login(TOKEN).catch(err => Logger.error(err));
process.on('unhandledRejection', err=>Logger.error(`Promise rejeitada: ${err}`));
process.on('uncaughtException', err=>Logger.error(`Exceção não capturada: ${err}`));
