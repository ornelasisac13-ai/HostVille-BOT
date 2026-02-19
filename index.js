import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
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

// ==================== HISTÓRICO EM MEMÓRIA ====================
const activityHistory = [];

// ==================== COR FIXA ====================
const C = chalk.cyanBright;

// ==================== MONITOR ====================
const Monitor = {
    getMemory() {
        const m = process.memoryUsage();
        return {
            rss: (m.rss / 1024 / 1024).toFixed(2),
            heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2),
            heapTotal: (m.heapTotal / 1024 / 1024).toFixed(2)
        };
    },
    getUptime() {
        const ms = Date.now() - stats.startTime;
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${d}d ${h}h ${m}m ${s}s`;
    },
    getCPU() {
        const cpus = os.cpus();
        let totalIdle = 0, totalTick = 0;
        cpus.forEach(cpu => {
            for (let type in cpu.times) totalTick += cpu.times[type];
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
        console.log(C(`\n╔════════════════════════════════════════════╗`));
        console.log(C(`║ 💾 MONITORAMENTO DO SISTEMA                  ║`));
        console.log(C(`╠════════════════════════════════════════════╣`));
        console.log(C(`║ RAM Usage: ${mem.rss} MB`));
        console.log(C(`║ Heap Used: ${mem.heapUsed} MB / ${mem.heapTotal} MB`));
        console.log(C(`║ CPU Usage: ${cpu.usage}% (${cpu.cores} cores)`));
        console.log(C(`║ Uptime: ${Monitor.getUptime()}`));
        console.log(C(`╚════════════════════════════════════════════╝`));
    }
};

// ==================== HORÁRIO BRASÍLIA ====================
function getBrasiliaTime() {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// ==================== LOG 24H ====================
function logLast24HoursActivity() {
    const now = Date.now();
    const last24h = 24 * 60 * 60 * 1000;
    const recent = activityHistory.filter(a => now - a.timestamp <= last24h);
    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    console.log(C("════════════════════════════════════════════"));
    console.log(C(`🕒 Horário Brasília: ${getBrasiliaTime()}`));

    if (joins.length === 0) console.log(C("Não entrou ninguém no servidor nas últimas 24 horas"));
    else console.log(C(`Entraram (${joins.length}) no servidor nas últimas 24 horas, sendo elas: ${joins.map(j => j.tag).join(", ")}`));

    if (leaves.length === 0) console.log(C("Não saiu ninguém do servidor nas últimas 24 horas"));
    else console.log(C(`Saíram (${leaves.length}) do servidor nas últimas 24 horas, sendo elas: ${leaves.map(l => l.tag).join(", ")}`));

    console.log(C("════════════════════════════════════════════"));
}

// ==================== CLIENT ====================
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
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

    logLast24HoursActivity();
    setInterval(logLast24HoursActivity, 60 * 60 * 1000);
});

// ==================== EVENTOS DE ENTRADA E SAÍDA ====================
client.on("guildMemberAdd", member => {
    stats.joins++;
    activityHistory.push({ type: "join", tag: member.user.tag, id: member.user.id, timestamp: Date.now() });
    console.log(C(`➕ ${member.user.tag} entrou no servidor.`));
});

client.on("guildMemberRemove", member => {
    stats.leaves++;
    activityHistory.push({ type: "leave", tag: member.user.tag, id: member.user.id, timestamp: Date.now() });
    console.log(C(`➖ ${member.user.tag} saiu do servidor.`));
});

// ==================== COMANDOS ====================
const commands = [
    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações do bot")
        .addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true)),

    new SlashCommandBuilder()
        .setName("rules")
        .setDescription("Exibir regras do servidor")
        .addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true)),

    new SlashCommandBuilder()
        .setName("adm")
        .setDescription("Painel administrativo")
        .addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true)),

    new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Reiniciar bot")
        .addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true))
].map(c => c.toJSON());

// Registrar comandos
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
})();

// ==================== INTERAÇÕES ====================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const cmdName = interaction.commandName;
    const code = interaction.options.getString("code");

    if (code !== ACCESS_CODE) {
        return interaction.reply({ content: "Código inválido.", ephemeral: true });
    }

    // Registrar comando usado
    stats.totalCommands++;
    stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;
    console.log(C(`📝 Comando usado: ${cmdName} | Usuário: ${interaction.user.tag} | Servidor: ${interaction.guild?.name || "DM"}`));

    // ==================== COMANDO /INFO ====================
    if (cmdName === "info") {
        const embed = new EmbedBuilder()
            .setTitle("HostVille Bot")
            .setDescription("Bot oficial do servidor")
            .setColor("#00FFFF")
            .addFields(
                { name: "Uptime", value: Monitor.getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                { name: "Memória", value: `${Monitor.getMemory().rss} MB`, inline: true }
            );
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ==================== COMANDO /RULES ====================
    if (cmdName === "rules") {
        const embed = new EmbedBuilder()
            .setTitle("📚 Regras do HostVille Greenville RP")
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
        await interaction.reply({ content: "✅ Comando executado com sucesso.", ephemeral: true });
        await interaction.followUp({ embeds: [embed], ephemeral: false });
    }

    // ==================== COMANDO /ADM ====================
    if (cmdName === "adm") {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("stats").setLabel("Estatísticas").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("report").setLabel("Enviar relatórios para console").setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: "🛠️ Painel acessado", components: [row], ephemeral: true });
        console.log(C(`⚙️ Painel administrativo acessado por ${interaction.user.tag}`));
    }
});

// ==================== ENTRADAS E SAÍDAS ====================
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

// ==================== RELATÓRIO DAS ÚLTIMAS 24H ====================
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
        console.log(C(`Entraram (${joins.length}) no servidor nas últimas 24 horas, sendo elas: ${joins.map(j => j.tag).join(", ")}`));
    }

    if (leaves.length === 0) {
        console.log(C("Não saiu ninguém do servidor nas últimas 24 horas"));
    } else {
        console.log(C(`Saíram (${leaves.length}) do servidor nas últimas 24 horas, sendo elas: ${leaves.map(l => l.tag).join(", ")}`));
    }

    console.log(C("════════════════════════════════════════════"));
}

// Atualiza relatório a cada hora
setInterval(() => {
    logLast24HoursActivity();
}, 60 * 60 * 1000);

// ==================== LOGIN ====================
client.login(TOKEN).catch(err => {
    console.log(C(`❌ Erro ao logar: ${err.message}`));
});

// ==================== LOG DE ERROS ====================
process.on("unhandledRejection", (reason, promise) => {
    console.log(C(`❌ Rejeição não tratada: ${reason}`));
});

process.on("uncaughtException", err => {
    console.log(C(`❌ Exceção não capturada: ${err.message}`));
});

// ==================== REGISTRO DE TODOS COMANDOS ====================
client.on("interactionCreate", async interaction => {
    if(!interaction.isChatInputCommand()) return;

    const cmdName = interaction.commandName;
    stats.totalCommands++;
    stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;

    console.log(C(`📝 Comando usado: ${cmdName} | Usuário: ${interaction.user.tag} | Servidor: ${interaction.guild?.name || "DM"}`));
});
