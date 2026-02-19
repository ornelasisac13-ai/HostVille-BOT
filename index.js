// ================= IMPORTS =================
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import chalk from "chalk";
import os from "os";
import process from "process";

// ================= CONFIGURAÇÃO =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

// ================= ESTATÍSTICAS =================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    restarts: 0,
    errors: 0,
    joins: 0,
    leaves: 0
};

// ================= HISTÓRICO EM MEMÓRIA =================
const activityHistory = [];

// ================= COR CYAN FIXA =================
const C = chalk.cyanBright;

// ================= MONITOR =================
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
    }
};

// ================= HORÁRIO BRASÍLIA =================
function getBrasiliaTime() {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// ================= RELATÓRIO 24H =================
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

// ================= LOGS E LOGGER =================
const Logger = {
    logCommand(userTag, cmd, guildName) {
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;
        const guildText = guildName ? ` em ${guildName}` : "";
        console.log(C(`[COMANDO] ${userTag} executou /${cmd}${guildText}`));
    },
    logEvent(msg) {
        console.log(C(`[EVENTO] ${msg}`));
    },
    logError(msg, err = null) {
        stats.errors++;
        console.error(chalk.red(`[ERRO] ${msg}`));
        if (err) console.error(chalk.red(err));
    }
};
// ================= CLIENTE =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= READY =================
client.once("clientReady", async () => {
    console.clear();
    console.log(C("════════════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${Monitor.getMemory().rss} MB`));
    console.log(C("════════════════════════════════════════════"));

    logLast24HoursActivity();
    setInterval(() => logLast24HoursActivity(), 60 * 60 * 1000);
});

// ================= ENTRADA DE MEMBROS =================
client.on("guildMemberAdd", member => {
    stats.joins++;
    activityHistory.push({ type: "join", tag: member.user.tag, id: member.user.id, timestamp: Date.now() });
    Logger.logEvent(`➕ ${member.user.tag} entrou no servidor.`);
});

// ================= SAÍDA DE MEMBROS =================
client.on("guildMemberRemove", member => {
    stats.leaves++;
    activityHistory.push({ type: "leave", tag: member.user.tag, id: member.user.id, timestamp: Date.now() });
    Logger.logEvent(`➖ ${member.user.tag} saiu do servidor.`);
});

// ================= MENSAGENS DELETADAS =================
client.on("messageDelete", message => {
    if (!message.author) return;
    Logger.logEvent(`❗️(${message.author.tag}) apagou uma mensagem: (${message.content || "Mensagem vazia"})`);
});

// ================= PAINEL ADMINISTRATIVO =================
async function openAdminPanel(userTag, interaction) {
    if (!interaction) return;
    Logger.logEvent(`Painel acessado por ${userTag}`);
    const embed = new EmbedBuilder().setTitle("Painel Administrativo").setDescription("Escolha uma opção:").setColor("#00FFFF");
    const buttons = ["📊 Estatísticas", "📤 Enviar relatórios para console"];
    await interaction.reply({
        embeds: [embed],
        content: `Botão 1: ${buttons[0]}\nBotão 2: ${buttons[1]}`,
        ephemeral: true
    });
}

// ================= BOAS-VINDAS NO CONSOLE =================
function welcomeConsole(user) {
    console.clear();
    console.log(C("════════════════════════════════════════════"));
    console.log(C(`Bem-vindo, ${user}!`));
    console.log(C(`Horário Brasília: ${getBrasiliaTime()}`));
    console.log(C("════════════════════════════════════════════"));
}
// ================= COMANDOS =================
const commands = [
    new SlashCommandBuilder().setName("info").setDescription("Informações do bot").addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true)),
    new SlashCommandBuilder().setName("rule").setDescription("Mostrar regras").addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true)),
    new SlashCommandBuilder().setName("restart").setDescription("Reiniciar bot").addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true)),
    new SlashCommandBuilder().setName("adm").setDescription("Abrir painel administrativo").addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true))
].map(c => c.toJSON());

// ================= REGISTRO DE COMANDOS =================
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
    try { await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands }); Logger.logEvent("Comandos registrados com sucesso."); } 
    catch (err) { Logger.logError("Erro ao registrar comandos", err); }
})();

// ================= INTERAÇÕES =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const code = interaction.options.getString("code");
    if (code !== ACCESS_CODE) return interaction.reply({ content: "Código inválido.", flags: 64 });

    Logger.logCommand(interaction.user.tag, interaction.commandName, interaction.guild?.name);

    if (interaction.commandName === "info") {
        const embed = new EmbedBuilder().setTitle("HostVille Bot").setColor("#00FFFF").setDescription("Bot oficial do servidor.").addFields(
            { name: "Uptime", value: Monitor.getUptime(), inline: true },
            { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
        );
        await interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (interaction.commandName === "rule") {
        await interaction.reply({ content: "✅ Comando executado com sucesso.", flags: 64 });
        await interaction.followUp({
            content: `
📜 **Regras do HostVille Greenville RP**

As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.

📚 [Regras completas](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)
📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)
📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)
            `,
            flags: 64
        });
    }

    if (interaction.commandName === "restart") { await interaction.reply({ content: "♻️ Reiniciando bot...", flags: 64 }); process.exit(0); }
    if (interaction.commandName === "adm") { await openAdminPanel(interaction.user.tag, interaction); }
});

// ================= LOGIN =================
client.login(TOKEN);
