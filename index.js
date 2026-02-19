const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

// ==================== CORES PARA CONSOLE ====================
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

// ==================== LOGGER CUSTOMIZADO ====================
const logger = {
    time: () => new Date().toLocaleString('pt-BR'),

    info: (msg) => {
        console.log(`${colors.cyan}[${logger.time()}]${colors.reset} ${colors.blue}ℹ️ INFO:${colors.reset} ${msg}`);
    },

    success: (msg) => {
        console.log(`${colors.cyan}[${logger.time()}]${colors.reset} ${colors.green}✅ SUCESSO:${colors.reset} ${msg}`);
    },

    warn: (msg) => {
        console.log(`${colors.cyan}[${logger.time()}]${colors.reset} ${colors.yellow}⚠️ AVISO:${colors.reset} ${msg}`);
    },

    error: (msg, error = null) => {
        console.log(`${colors.cyan}[${logger.time()}]${colors.reset} ${colors.red}❌ ERRO:${colors.reset} ${msg}`);
        if (error) {
            console.log(`${colors.gray}└─── Detalhes: ${error.message || error}${colors.reset}`);
        }
    },

    debug: (msg) => {
        if (process.env.DEBUG === 'true') {
            console.log(`${colors.cyan}[${logger.time()}]${colors.reset} ${colors.gray}🔍 DEBUG:${colors.reset} ${msg}`);
        }
    },

    command: (cmd, user) => {
        console.log(`${colors.cyan}[${logger.time()}]${colors.reset} ${colors.magenta}📝 COMANDO:${colors.reset} ${colors.white}${cmd}${colors.reset} ${colors.gray}por${colors.reset} ${colors.yellow}${user}${colors.reset}`);
    },

    line: (char = '═', length = 50) => {
        console.log(colors.gray + char.repeat(length) + colors.reset);
    }
};

// ==================== VALIDAÇÃO DE VARIÁVEIS ====================
function validateEnv() {
    logger.line();
    logger.info('Validando variáveis de ambiente...');
    
    const missing = [];
    
    if (!TOKEN) missing.push('TOKEN');
    if (!ACCESS_CODE) missing.push('ACCESS_CODE');
    
    if (missing.length > 0) {
        logger.error(`Variáveis ausentes: ${missing.join(', ')}`);
        logger.line();
        process.exit(1);
    }
    
    logger.success('Todas as variáveis estão configuradas!');
    logger.line();
}

// ==================== CLIENTE DO BOT ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    presence: {
        status: 'online',
        activities: [{
            name: '/rule | /info',
            type: 0
        }]
    }
});

// ==================== COMANDOS ====================
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Digite o código de acesso')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Mostra informações do bot')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// ==================== REGISTRO DE COMANDOS ====================
async function registerCommands() {
    try {
        logger.info('Registrando comandos no servidor...');
        
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        
        logger.success(`Comandos registrados: ${commands.map(c => `/${c.name}`).join(', ')}`);
        
    } catch (error) {
        logger.error('Falha ao registrar comandos', error);
        logger.warn('O bot continuará funcionando, mas os comandos podem não estar disponíveis.');
    }
}

// ==================== EVENTOS ====================

// Evento: Bot pronto
client.once('ready', () => {
    logger.line('═');
    logger.success('🤖 BOT ONLINE');
    logger.info(`👤 Tag: ${client.user.tag}`);
    logger.info(`🆔 ID: ${client.user.id}`);
    logger.info(`📊 Servidores: ${client.guilds.cache.size}`);
    logger.line('═');
    
    registerCommands();
});

// Evento: Erros não tratados
process.on('uncaughtException', (error) => {
    logger.error('Erro não capturado!', error);
    logger.warn('Tentando reconectar em 5 segundos...');
    
    setTimeout(() => {
        logger.info('Reiniciando bot...');
        process.exit(1);
    }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promessa rejeitada não tratada', reason);
});

// Evento: Interação
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user } = interaction;
    logger.command(`/${commandName}`, user.tag);

    // ========= /RULE =========
    if (commandName === 'rule') {
        const codigoDigitado = interaction.options.getString('code');

        if (codigoDigitado !== ACCESS_CODE) {
            logger.warn(`Código incorreto usado por ${user.tag}`);
            
            return interaction.reply({
                content: "❌ **Código de acesso inválido.**\nTente novamente com o código correto.",
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

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

        await interaction.channel.send({ embeds: [embed] });
        await interaction.deleteReply();
        
        logger.success(`Regras enviadas para ${user.tag} no canal ${interaction.channel.name}`);
    }

    // ========= /INFO =========
    if (commandName === 'info') {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle("🤖 Informações do Bot")
            .addFields(
                { name: "Nome", value: client.user.tag, inline: true },
                { name: "ID", value: client.user.id, inline: true },
                { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
                { name: "Uptime", value: `${hours}h ${minutes}m ${seconds}s`, inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
            )
            .setFooter({ 
                text: "HostVille Greenville RP",
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
        
        logger.success(`Info enviada para ${user.tag}`);
    }
});

// ==================== INICIAR BOT ====================
validateEnv();

client.login(TOKEN)
    .then(() => {
        logger.success('Conectado ao Discord!');
    })
    .catch((error) => {
        logger.error('Falha ao conectar ao Discord', error);
        process.exit(1);
    });
