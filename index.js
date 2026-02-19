// ==================== IMPORTS ====================
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import chalk from "chalk";
import os from "os";
import process from "process";

// ==================== CONFIG ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

// ==================== ESTATÍSTICAS ====================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    restarts: 0,
    errors: 0,
    joins: 0,
    leaves: 0
};

// ==================== HISTÓRICO ====================
const activityHistory = [];

// ==================== CORES ====================
const C = chalk.cyanBright;
const G = chalk.greenBright;
const Y = chalk.yellowBright;
const R = chalk.redBright;
const W = chalk.whiteBright;

// ==================== MONITORAMENTO ====================
const Monitor = {
    getMemory() {
        const m = process.memoryUsage();
        return {
            rss: (m.rss / 1024 / 1024).toFixed(2),
            heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2)
        };
    },
    getUptime() {
        const ms = Date.now() - stats.startTime;
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
    },
    getCPU() {
        const cpus = os.cpus();
        let totalIdle = 0, totalTick = 0;
        cpus.forEach(cpu => {
            for (let t in cpu.times) totalTick += cpu.times[t];
            totalIdle += cpu.times.idle;
        });
        return {
            usage: Math.round(100 - (totalIdle / totalTick * 100)),
            cores: cpus.length
        };
    },
    status() {
        const mem = Monitor.getMemory();
        const cpu = Monitor.getCPU();
        console.log(C(`\n╔════════════ MONITORAMENTO ════════════╗`));
        console.log(C(`║ RAM: ${mem.rss} MB | Heap: ${mem.heapUsed} MB ║`));
        console.log(C(`║ CPU: ${cpu.usage}% (${cpu.cores} cores)        ║`));
        console.log(C(`║ Uptime: ${Monitor.getUptime()}           ║`));
        console.log(C(`╚═══════════════════════════════════════╝`));
    }
};

// ==================== LOGGER ====================
const Logger = {
    cmd(cmd, user, guild) {
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
        const guildText = guild ? ` em ${guild}` : '';
        console.log(C(`[COMANDO] /${cmd} usado por ${user}${guildText}`));
    },
    info(msg) {
        console.log(C(`[INFO] ${msg}`));
    },
    success(msg) {
        console.log(G(`[SUCESSO] ${msg}`));
    },
    warn(msg) {
        console.log(Y(`[AVISO] ${msg}`));
    },
    error(msg, err) {
        stats.errors++;
        console.log(R(`[ERRO] ${msg}`));
        if(err) console.log(R(`Causa: ${err.message || err}`));
    },
    system(msg) {
        console.log(C(`[SISTEMA] ${msg}`));
    }
};

// ==================== HORÁRIO BRASÍLIA ====================
function getBrasiliaTime() {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// ==================== RELATÓRIO 24H ====================
function logLast24HoursActivity() {
    const now = Date.now();
    const last24h = 24*60*60*1000;
    const recent = activityHistory.filter(a => now - a.timestamp <= last24h);

    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    console.log(C(`════════════════════════════════════════════`));
    console.log(C(`🕒 Horário Brasília: ${getBrasiliaTime()}`));

    if(joins.length === 0) console.log(C("Não entrou ninguém no servidor nas últimas 24 horas"));
    else console.log(C(`Entraram (${joins.length}): ${joins.map(j => j.tag).join(", ")}`));

    if(leaves.length === 0) console.log(C("Não saiu ninguém do servidor nas últimas 24 horas"));
    else console.log(C(`Saíram (${leaves.length}): ${leaves.map(l => l.tag).join(", ")}`));

    console.log(C(`════════════════════════════════════════════`));
}
// ==================== CLIENTE ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==================== READY ====================
client.once("clientReady", async () => { // corrigido para clientReady
    console.clear();
    console.log(C("════════════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${Monitor.getMemory().rss} MB`));
    console.log(C("════════════════════════════════════════════"));

    logLast24HoursActivity();

    setInterval(() => logLast24HoursActivity(), 60*60*1000);
});

// ==================== ENTRADA ====================
client.on("guildMemberAdd", member => {
    stats.joins++;
    activityHistory.push({
        type: "join",
        tag: member.user.tag,
        id: member.user.id,
        timestamp: Date.now()
    });
    console.log(C(`➕ ${member.user.tag} entrou no servidor.`));
});

// ==================== SAÍDA ====================
client.on("guildMemberRemove", member => {
    stats.leaves++;
    activityHistory.push({
        type: "leave",
        tag: member.user.tag,
        id: member.user.id,
        timestamp: Date.now()
    });
    console.log(C(`➖ ${member.user.tag} saiu do servidor.`));
});

// ==================== BOAS-VINDAS CONSOLE ====================
function welcomeConsole(user) {
    console.clear();
    console.log(C("════════════════════════════════════════════"));
    console.log(C(`Bem-vindo(a) ao HostVille, ${user}!`));
    console.log(C("════════════════════════════════════════════"));
    Monitor.status();
    console.log(C("════════════════════════════════════════════"));
}

// ==================== COMANDOS ====================
const commands = [
    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações do bot"),

    new SlashCommandBuilder()
        .setName("rules")
        .setDescription("Mostrar regras do servidor")
        .addStringOption(opt => opt
            .setName("code")
            .setDescription("Código de acesso")
            .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("adm")
        .setDescription("Acessar painel administrativo")
        .addStringOption(opt => opt
            .setName("code")
            .setDescription("Código de acesso")
            .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Reiniciar bot")
        .addStringOption(opt => opt
            .setName("code")
            .setDescription("Código de acesso")
            .setRequired(true)
        )
].map(c => c.toJSON());

// ==================== REGISTRAR COMANDOS ====================
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
})();

// ==================== INTERAÇÕES ====================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    stats.totalCommands++;
    const code = interaction.options.getString("code");

    // ==================== /info ====================
    if(interaction.commandName === "info") {
        Logger.cmd("info", interaction.user.tag, interaction.guild?.name);
        const embed = new EmbedBuilder()
            .setTitle("HostVille Bot")
            .setColor("#00FFFF")
            .setDescription("Bot oficial do servidor.")
            .addFields(
                { name: "Uptime", value: Monitor.getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
            );
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ==================== /rules ====================
    if(interaction.commandName === "rules") {
        if(code !== ACCESS_CODE) return interaction.reply({ content: "Código inválido.", ephemeral: true });
        Logger.cmd("rules", interaction.user.tag, interaction.guild?.name);

        await interaction.reply({ content: "Comando executado com sucesso ✅", ephemeral: true });

        const rulesEmbed = new EmbedBuilder()
            .setTitle("Regras do HostVille Greenville RP")
            .setColor("#00FFFF")
            .setDescription(
`As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.

━━━━━━━━━━━━━━━━━━━━

📘 **Para mais informações sobre as regras, acesse o documento abaixo:**

📚 [Regras](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━

🔗 **Documentos Oficiais**

📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)

📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)

━━━━━━━━━━━━━━━━━━━━
✨ Powered by Y2k_Nat`
            );
        await interaction.followUp({ embeds: [rulesEmbed], ephemeral: true });
    }
// ==================== /adm – PAINEL ADMINISTRATIVO ====================
if(interaction.commandName === "adm") {
    if(code !== ACCESS_CODE) return interaction.reply({ content: "Código inválido.", ephemeral: true });
    Logger.cmd("adm", interaction.user.tag, interaction.guild?.name);

    // Log do acesso
    console.log(C(`🛡️ Painel administrativo acessado por ${interaction.user.tag}`));

    // Criar botões do painel
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("panel_stats")
            .setLabel("Estatísticas")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("panel_report")
            .setLabel("Enviar relatórios para console")
            .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ content: "Painel administrativo:", components: [row], ephemeral: true });
}

// ==================== INTERAÇÕES DE BOTÕES ====================
client.on("interactionCreate", async interaction => {
    if(!interaction.isButton()) return;

    // ==================== ESTATÍSTICAS ====================
    if(interaction.customId === "panel_stats") {
        const mem = Monitor.getMemory();
        const uptime = Monitor.getUptime();
        const cpu = Monitor.getCPU?.()?.usage || "N/A";

        await interaction.reply({ 
            content: `📊 **Estatísticas do sistema**\n\nMemória RSS: ${mem.rss} MB\nHeap usado: ${mem.heapUsed} MB\nUptime: ${uptime}\nCPU: ${cpu}%`, 
            ephemeral: true 
        });
        console.log(C(`📊 Estatísticas enviadas para ${interaction.user.tag}`));
    }

    // ==================== RELATÓRIOS ====================
    if(interaction.customId === "panel_report") {
        logLast24HoursActivity();
        console.log(C(`📄 Relatório enviado para console por ${interaction.user.tag}`));
        await interaction.reply({ content: "Relatório enviado para o console.", ephemeral: true });
    }
});

// ==================== REGISTRO DE TODOS COMANDOS ====================
client.on("interactionCreate", async interaction => {
    if(!interaction.isChatInputCommand()) return;

    // Registrar todos os comandos usados, inclusive de outros bots
    stats.totalCommands++;
    const cmdName = interaction.commandName;
    stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;
    console.log(C(`📝 Comando usado: ${cmdName} | Usuário: ${interaction.user.tag} | Servidor: ${interaction.guild?.name || "DM"}`));
});

// ==================== LOGIN ====================
client.login(TOKEN).catch(err => {
    console.log(C(`❌ Erro ao logar: ${err.message}`));
});

// ==================== LOGGING DE ERROS ====================
process.on("unhandledRejection", (reason, promise) => {
    console.log(C(`❌ Rejeição não tratada: ${reason}`));
});

process.on("uncaughtException", err => {
    console.log(C(`❌ Exceção não capturada: ${err.message}`));
});

// ==================== FIM DO ARQUIVO ====================
