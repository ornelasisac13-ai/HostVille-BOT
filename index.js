import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, Events } from 'discord.js';
import chalk from 'chalk';
import process from 'process';

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

// ==================== ESTATÍSTICAS ====================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    errors: 0,
    restarts: 0,
    startTime: Date.now()
};

// ==================== LOGGER ====================
const Logger = {
    line: () => console.log(chalk.gray('────────────────────────────────────────')),
    log: (msg) => console.log(chalk.cyan('[LOG]'), msg),
    info: (msg) => console.log(chalk.blue('[INFO]'), msg),
    success: (msg) => console.log(chalk.green('[OK]'), msg),
    warn: (msg) => console.log(chalk.yellow('[AVISO]'), msg),
    error: (msg, err=null) => {
        stats.errors++;
        console.log(chalk.red('[ERRO]'), msg);
        if(err) console.log(chalk.gray('    └─'), err.message || err);
    },
    cmd: (cmd, user, guild) => {
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
        const guildText = guild ? ` em ${guild}` : '';
        console.log(chalk.magenta(`[CMD] /${cmd} usado por ${user}${guildText}`));
    }
};

// ==================== MONITORAMENTO ====================
const Monitor = {
    getMemory: () => {
        const m = process.memoryUsage();
        return { rss: (m.rss / 1024 / 1024).toFixed(2), heapUsed: (m.heapUsed/1024/1024).toFixed(2), heapTotal: (m.heapTotal/1024/1024).toFixed(2) };
    },
    getUptime: () => {
        const ms = Date.now() - stats.startTime;
        const d = Math.floor(ms/86400000), h = Math.floor((ms%86400000)/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000);
        return `${d}d ${h}h ${m}m ${s}s`;
    }
};

// ==================== BOAS-VINDAS ====================
function welcomeConsole() {
    console.clear();
    console.log(chalk.cyan(`
▒█░▒█ ▒█▀▀▀█ ▒█▀▀▀█ ▀▀█▀▀ ▒█░░▒█ ▀█▀ ▒█░░░ ▒█░░░ ▒█▀▀▀ 
▒█▀▀█ ▒█░░▒█ ░▀▀▀▄▄ ░▒█░░ ░▒█▒█░ ▒█░ ▒█░░░ ▒█░░░ ▒█▀▀▀ 
▒█░▒█ ▒█▄▄▄█ ▒█▄▄▄█ ░▒█░░ ░░▀▄▀░ ▄█▄ ▒█▄▄█ ▒█▄▄█ ▒█▄▄▄ 
`));
    console.log(chalk.cyanBright('Bem-vindo Isac!'));
    console.log(chalk.blueBright(`Seu bot está com ${stats.errors === 0 ? 'sem erros' : stats.errors + ' erros'}`));
    Logger.line();
}

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
        activities: [{ name: '/rule | /info | /restart', type: 0 }]
    }
});

// ==================== COMANDOS SLASH ====================
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor')
        .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true)),
    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Mostra informações do bot'),
    new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Reinicia o bot')
        .addStringOption(o => o.setName('code').setDescription('Código de acesso').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
async function registerCommands() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        Logger.success(`Comandos registrados: ${commands.map(c=>c.name).join(', ')}`);
    } catch(err) {
        Logger.error('Erro ao registrar comandos', err);
    }
}

// ==================== EVENTOS ====================
client.once(Events.ClientReady, async () => {
    welcomeConsole();
    Logger.success(`Bot online! Tag: ${client.user.tag} | ID: ${client.user.id}`);
    await registerCommands();

    // Atualiza RAM e ping a cada 6 horas
    setInterval(()=>{
        const mem = Monitor.getMemory();
        Logger.info(`RAM: ${mem.rss}MB | Heap: ${mem.heapUsed}/${mem.heapTotal}MB | Ping: ${client.ws.ping}ms`);
    }, 6*60*60*1000);
});

// ==================== INTERACTIONS ====================
client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;
    Logger.cmd(commandName, user.tag, guild?.name);

    // /RULE
    if(commandName==='rule'){
        const code = interaction.options.getString('code');
        if(code!==ACCESS_CODE) return interaction.reply({content:'❌ Código inválido!', flags:64});
        await interaction.deferReply({flags:64});
        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle("📜 Regras - HostVille Greenville RP")
            .setDescription(`
As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.

━━━━━━━━━━━━━━━━━━━━

📘 **Para mais informações sobre as regras, acesse o documento abaixo:**

📚 [Regras](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━

🔗 **Documentos Oficiais**

📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)

📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━
✨ Powered by Y2k_Nat
`)
            .setImage("https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png");
        await interaction.channel.send({embeds:[embed]});
        await interaction.deleteReply();
    }

    // /INFO
    if(commandName==='info'){
        const onlineCount = guild.members.cache.filter(m=>m.presence?.status==='online').size;
        const offlineCount = guild.memberCount - onlineCount;
        const uptime = Monitor.getUptime();
        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle('🤖 Informações do Bot')
            .addFields(
                {name:'Nome',value:client.user.tag,inline:true},
                {name:'ID',value:client.user.id,inline:true},
                {name:'Servidores',value:`${client.guilds.cache.size}`,inline:true},
                {name:'Membros Online',value:`${onlineCount}`,inline:true},
                {name:'Membros Offline',value:`${offlineCount}`,inline:true},
                {name:'Uptime',value:`${uptime}`,inline:true},
                {name:'Ping',value:`${client.ws.ping}ms`,inline:true}
            )
            .setFooter({text:'HostVille Greenville RP'});
        await interaction.reply({embeds:[embed],flags:64});
    }

    // /RESTART
    if(commandName==='restart'){
        const code = interaction.options.getString('code');
        if(code!==ACCESS_CODE) return interaction.reply({content:'❌ Código inválido!',flags:64});
        await interaction.reply({content:'🔄 Reiniciando...',flags:64});
        stats.restarts++;
        client.destroy();
        setTimeout(()=>client.login(TOKEN),3000);
    }
});

// ==================== LOG DE EVENTOS ====================
client.on(Events.GuildMemberAdd, member=>Logger.log(`👋 Novo membro entrou: ${member.user.tag}`));
client.on(Events.GuildMemberRemove, member=>Logger.log(`👋 Membro saiu: ${member.user.tag}`));
client.on(Events.MessageDelete, async message=>{
    if(message.partial) await message.fetch();
    if(message.author?.bot) return;
    Logger.warn(`❗️ ${message.author.tag} apagou uma mensagem: ${message.content}`);
});

// ==================== TRATAMENTO DE ERROS ====================
process.on('unhandledRejection', r=>Logger.error('Rejeição não tratada',r));
process.on('uncaughtException', e=>Logger.error('Exceção não capturada',e));

client.login(TOKEN);
