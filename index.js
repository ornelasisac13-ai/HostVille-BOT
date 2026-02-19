import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    InteractionResponseFlags 
} from "discord.js";
import chalk from "chalk";
import os from "os";
import process from "process";

// ==================== SUPRIMINDO WARNINGS GLOBAIS ====================
process.removeAllListeners('warning'); 
process.on('warning', () => {});

// ==================== CONFIGURAÇÃO ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.error("❌ TOKEN não definido!");
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.error("❌ ACCESS_CODE não definido!");
    process.exit(1);
}

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

// ==================== HISTÓRICO EM MEMÓRIA ====================
const activityHistory = [];

// ==================== COR CYAN FIXA ====================
const C = chalk.cyanBright;

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
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                totalTick += cpu.times[type];
            }
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
        console.log(C('\n  ╔═══════════════════════════════════════════════════╗'));
        console.log(C('  ║ ') + C.bold('💾 MONITORAMENTO DO SISTEMA') + C(' '.repeat(28) + '║'));
        console.log(C('  ╠═══════════════════════════════════════════════════╣'));
        console.log(C('  ║ ') + C.bold('RAM Usage:    ') + C.white(`${mem.rss} MB`) + C(' '.repeat(28) + '║'));
        console.log(C('  ║ ') + C.bold('Heap Used:   ') + C.white(`${mem.heapUsed} MB`) + C(' '.repeat(28) + '║'));
        console.log(C('  ║ ') + C.bold('CPU Usage:   ') + C.white(`${cpu.usage}%`) + C(` (${cpu.cores} cores)`.padStart(26) + '║'));
        console.log(C('  ║ ') + C.bold('Uptime:      ') + C.white(Monitor.getUptime()) + C(' '.repeat(26) + '║'));
        console.log(C('  ╚═══════════════════════════════════════════════════╝'));
    }
};

// ==================== HORÁRIO BRASÍLIA ====================
function getBrasiliaTime() {
    return new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo"
    });
}

// ==================== RELATÓRIO 24H ====================
function logLast24HoursActivity() {
    const now = Date.now();
    const last24h = 24 * 60 * 60 * 1000;

    const recent = activityHistory.filter(a => now - a.timestamp <= last24h);

    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    console.log(C("════════════════════════════════════════════"));
    console.log(C(`🕒 Horário Brasília: ${getBrasiliaTime()}`));

    if (joins.length === 0) {
        console.log(C("Não entrou ninguém no servidor nas últimas 24 horas"));
    } else {
        console.log(
            C(`Entraram (${joins.length}) no servidor nas últimas 24 horas, sendo elas: ${joins.map(j => j.tag).join(", ")}`)
        );
    }

    if (leaves.length === 0) {
        console.log(C("Não saiu ninguém do servidor nas últimas 24 horas"));
    } else {
        console.log(
            C(`Saíram (${leaves.length}) do servidor nas últimas 24 horas, sendo elas: ${leaves.map(l => l.tag).join(", ")}`)
        );
    }

    console.log(C("════════════════════════════════════════════"));
}

// ==================== LOGGER ESTRUTURADO ====================
const Logger = {
    logJoin(member) {
        stats.joins++;
        activityHistory.push({
            type: "join",
            tag: member.user.tag,
            id: member.user.id,
            timestamp: Date.now()
        });
        console.log(C(`➕ ${member.user.tag} entrou no servidor.`));
    },

    logLeave(member) {
        stats.leaves++;
        activityHistory.push({
            type: "leave",
            tag: member.user.tag,
            id: member.user.id,
            timestamp: Date.now()
        });
        console.log(C(`➖ ${member.user.tag} saiu do servidor.`));
    },

    logMessageDelete(message) {
        if (!message.author) return;
        console.log(C(`❌ Mensagem deletada por ${message.author.tag}: "${message.content}"`));
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
client.once("clientReady", async () => {
    console.clear();
    console.log(C("════════════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${Monitor.getMemory().rss} MB`));
    console.log(C("════════════════════════════════════════════"));

    // Mostra atividade das últimas 24h ao iniciar
    logLast24HoursActivity();

    // Atualiza atividade a cada hora
    setInterval(() => logLast24HoursActivity(), 60 * 60 * 1000);
});

// ==================== EVENTOS DE MEMBROS ====================
client.on("guildMemberAdd", member => {
    Logger.logJoin(member);
});

client.on("guildMemberRemove", member => {
    Logger.logLeave(member);
});

// ==================== EVENTO MENSAGEM DELETADA ====================
client.on("messageDelete", message => {
    Logger.logMessageDelete(message);
});

// ==================== CONFIGURAÇÃO DE COMANDOS ====================
const commands = [
    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações do bot")
        .addStringOption(opt => 
            opt.setName("code")
               .setDescription("Código de acesso")
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("rule")
        .setDescription("Mostrar regras do servidor")
        .addStringOption(opt =>
            opt.setName("code")
               .setDescription("Código de acesso")
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Reiniciar bot")
        .addStringOption(opt =>
            opt.setName("code")
               .setDescription("Código de acesso")
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("adm")
        .setDescription("Painel administrativo")
        .addStringOption(opt =>
            opt.setName("code")
               .setDescription("Código de acesso")
               .setRequired(true)
        )
].map(c => c.toJSON());

// ==================== REGISTRO DE COMANDOS ====================
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log(C("✅ Comandos registrados com sucesso"));
    } catch (err) {
        console.error("❌ Erro ao registrar comandos:", err);
    }
})();

// ==================== INTERAÇÕES ====================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const code = interaction.options.getString("code");
    stats.totalCommands++;

    if (code !== ACCESS_CODE) {
        return interaction.reply({
            content: "❌ Código de acesso inválido.",
            flags: InteractionResponseFlags.Ephemeral
        });
    }

    // Log de comando
    stats.commandsUsed[interaction.commandName] = 
        (stats.commandsUsed[interaction.commandName] || 0) + 1;
    console.log(C(`📝 Comando /${interaction.commandName} usado por ${interaction.user.tag}`));

    // ==================== /INFO ====================
    if (interaction.commandName === "info") {
        const embed = new EmbedBuilder()
            .setTitle("HostVille Bot")
            .setColor("#00FFFF")
            .setDescription("Bot oficial do servidor HostVille Greenville RP.")
            .addFields(
                { name: "Uptime", value: Monitor.getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                { name: "Comandos usados", value: `${stats.totalCommands}`, inline: true }
            );
        await interaction.reply({ embeds: [embed], flags: InteractionResponseFlags.Ephemeral });
    }

    // ==================== /RULE ====================
    if (interaction.commandName === "rule") {
        const embed = new EmbedBuilder()
            .setTitle("📜 Regras - HostVille Greenville RP")
            .setColor("#00FFFF")
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
`);
        await interaction.reply({ embeds: [embed], flags: InteractionResponseFlags.Ephemeral });
        await interaction.followUp({
            content: "✅ Comando executado com sucesso.",
            flags: InteractionResponseFlags.Ephemeral
        });
    }

    // ==================== /RESTART ====================
    if (interaction.commandName === "restart") {
        await interaction.reply({ content: "♻️ Reiniciando bot...", flags: InteractionResponseFlags.Ephemeral });
        process.exit(0);
    }

    // ==================== /ADM ====================
    if (interaction.commandName === "adm") {
        console.log(C(`🔐 Painel administrativo acessado por ${interaction.user.tag}`));

        // Mensagem apenas para quem acessou
        await interaction.reply({
            content: "🔐 Painel administrativo aberto.\nBotões disponíveis:\n1️⃣ Estatísticas\n2️⃣ Enviar relatórios para console",
            flags: InteractionResponseFlags.Ephemeral
        });
    }
});
};
// ==================== MONITORAMENTO AVANÇADO ====================
function showSystemStatus() {
    const mem = Monitor.getMemory();
    console.log(C("════════════════════════════════════════════"));
    console.log(C(`💾 RAM: ${mem.rss} MB | ⏱ Uptime: ${Monitor.getUptime()} | Ping: ${client.ws.ping}ms`));
    console.log(C("════════════════════════════════════════════"));
}

// ==================== LOG DE ENTRADAS E SAÍDAS ====================
function logMemberActivity() {
    const now = Date.now();
    const last24h = 24 * 60 * 60 * 1000;

    const recent = activityHistory.filter(a => now - a.timestamp <= last24h);
    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    console.log(C("\n════════════════ Atividade últimas 24h ════════════════"));

    if (joins.length === 0) {
        console.log(C("Não entrou ninguém no servidor nas últimas 24 horas"));
    } else {
        console.log(C(`Entraram (${joins.length}) no servidor nas últimas 24h: ${joins.map(j => j.tag).join(", ")}`));
    }

    if (leaves.length === 0) {
        console.log(C("Não saiu ninguém do servidor nas últimas 24 horas"));
    } else {
        console.log(C(`Saíram (${leaves.length}) do servidor nas últimas 24h: ${leaves.map(l => l.tag).join(", ")}`));
    }

    console.log(C("════════════════════════════════════════════\n"));
}

// ==================== LOG DE COMANDOS DE OUTROS BOTS ====================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Ignora comandos protegidos
    if (!interaction.options.getString("code") || interaction.options.getString("code") !== ACCESS_CODE) return;

    // Verifica se é de outro bot
    if (interaction.user.bot && interaction.user.id !== client.user.id) {
        console.log(C(`🤖 Comando de outro bot detectado: /${interaction.commandName} de ${interaction.user.tag}`));
    }
});

// ==================== INTERVALOS ====================
// Atualiza logs de atividade a cada 60 minutos
setInterval(() => {
    logMemberActivity();
}, 60 * 60 * 1000);

// Mostra status do sistema a cada 30 minutos
setInterval(() => {
    showSystemStatus();
}, 30 * 60 * 1000);

// ==================== LOGIN ====================
client.login(TOKEN)
    .then(() => console.log(C("✅ Bot logado com sucesso")))
    .catch(err => console.error("❌ Falha ao logar:", err));

// ==================== LOGGER COMPLETO ====================
const Logger = {
    logJoin(member) {
        stats.joins++;
        activityHistory.push({
            type: "join",
            tag: member.user.tag,
            id: member.user.id,
            timestamp: Date.now()
        });
        console.log(C(`➕ ${member.user.tag} entrou no servidor.`));
    },

    logLeave(member) {
        stats.leaves++;
        activityHistory.push({
            type: "leave",
            tag: member.user.tag,
            id: member.user.id,
            timestamp: Date.now()
        });
        console.log(C(`➖ ${member.user.tag} saiu do servidor.`));
    },

    logMessageDelete(message) {
        console.log(C(`🗑️ Mensagem deletada de ${message.author?.tag || "desconhecido"}: ${message.content}`));
    }
};
