// ====================== IMPORTS ======================
import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from "discord.js";
import chalk from "chalk";
import os from "os";
import process from "process";

// ====================== CONFIG ======================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.error(chalk.red("❌ TOKEN não definido!"));
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.error(chalk.red("❌ ACCESS_CODE não definido!"));
    process.exit(1);
}

// ====================== ESTATÍSTICAS ======================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    restarts: 0,
    errors: 0,
    joins: 0,
    leaves: 0
};

// ====================== HISTÓRICO 24H ======================
const activityHistory = [];

// ====================== ESTILOS ======================
const Styles = {
    cyan: chalk.hex("#00FFFF"),
    cyanBright: chalk.hex("#00FFFF").bold,
    green: chalk.greenBright,
    red: chalk.redBright,
    yellow: chalk.yellowBright,
    white: chalk.white,
    gray: chalk.gray
};

// ====================== MONITORAMENTO ======================
const Monitor = {
    getMemory() {
        const m = process.memoryUsage();
        return {
            rss: (m.rss / 1024 / 1024).toFixed(2),
            heapUsed: (m.heapUsed / 1024 / 1024).toFixed(2),
            heapTotal: (m.heapTotal / 1024 / 1024).toFixed(2)
        };
    },

    getCPU() {
        const cpus = os.cpus();
        let totalIdle = 0, totalTick = 0;
        cpus.forEach(cpu => {
            for (let type in cpu.times) totalTick += cpu.times[type];
            totalIdle += cpu.times.idle;
        });
        const usage = Math.round(100 - (totalIdle / totalTick * 100));
        return { usage, cores: cpus.length };
    },

    getUptime() {
        const ms = Date.now() - stats.startTime;
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
    },

    status() {
        const mem = Monitor.getMemory();
        const cpu = Monitor.getCPU();
        console.log(Styles.cyanBright("════════════════════════════════════════════"));
        console.log(Styles.cyan(`RAM Usage: ${mem.rss} MB | Heap: ${mem.heapUsed}/${mem.heapTotal} MB`));
        console.log(Styles.cyan(`CPU Usage: ${cpu.usage}% | Cores: ${cpu.cores}`));
        console.log(Styles.cyan(`Uptime: ${Monitor.getUptime()}`));
        console.log(Styles.cyanBright("════════════════════════════════════════════\n"));
    }
};

// ====================== HORÁRIO BRASÍLIA ======================
function getBrasiliaTime() {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// ====================== HISTÓRICO 24H LOG ======================
function logLast24HoursActivity() {
    const now = Date.now();
    const last24h = 24 * 60 * 60 * 1000;
    const recent = activityHistory.filter(a => now - a.timestamp <= last24h);

    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    console.log(Styles.cyanBright("════════════════════════════════════════════"));
    console.log(Styles.cyan(`🕒 Horário Brasília: ${getBrasiliaTime()}`));

    if (joins.length === 0)
        console.log(Styles.yellow("Não entrou ninguém no servidor nas últimas 24 horas"));
    else
        console.log(Styles.green(`Entraram (${joins.length}) no servidor nas últimas 24 horas: ${joins.map(j => j.tag).join(", ")}`));

    if (leaves.length === 0)
        console.log(Styles.yellow("Não saiu ninguém do servidor nas últimas 24 horas"));
    else
        console.log(Styles.red(`Saíram (${leaves.length}) do servidor nas últimas 24 horas: ${leaves.map(l => l.tag).join(", ")}`));

    console.log(Styles.cyanBright("════════════════════════════════════════════\n"));
}

// ====================== BOAS-VINDAS ======================
function welcomeConsole(user) {
    console.clear();
    console.log(Styles.cyanBright("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(Styles.cyan(`Usuário: ${user}`));
    console.log(Styles.cyan(`Data: ${new Date().toLocaleDateString("pt-BR")}`));
    console.log(Styles.cyan(`Hora: ${new Date().toLocaleTimeString("pt-BR")}`));
    console.log(Styles.cyanBright("════════════════════════════════════════════"));
    Monitor.status();
}
// ==================== INTERAÇÕES E COMANDOS ====================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    // ================= COMANDOS DE TEXTO =================
    if (interaction.isChatInputCommand()) {
        const cmdName = interaction.commandName;
        stats.totalCommands++;
        stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;

        // ========= /info =========
        if (cmdName === "info") {
            const code = interaction.options.getString("code");
            if (code !== ACCESS_CODE) {
                return interaction.reply({ content: "❌ Código inválido.", flags: 64 });
            }

            const uptime = Monitor.getUptime();
            const embed = new EmbedBuilder()
                .setTitle("🤖 HostVille Bot - Informações")
                .setColor(0x00FFFF)
                .addFields(
                    { name: "Uptime", value: uptime, inline: true },
                    { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                    { name: "Memória (RAM)", value: `${Monitor.getMemory().rss} MB`, inline: true },
                    { name: "Comandos executados", value: `${stats.totalCommands}`, inline: true }
                )
                .setFooter({ text: "Painel seguro via ACCESS_CODE" });

            await interaction.reply({ embeds: [embed], flags: 64 });
            Logger.cmd(cmdName, interaction.user.tag, interaction.guild?.name);
        }

        // ========= /rule =========
        if (cmdName === "rule") {
            const code = interaction.options.getString("code");
            if (code !== ACCESS_CODE) {
                return interaction.reply({ content: "❌ Código inválido.", flags: 64 });
            }

            // Mensagem privada para quem executou
            await interaction.reply({ content: "✅ Comando executado com sucesso.", flags: 64 });

            // Embed público com as regras
            const embedRules = new EmbedBuilder()
                .setColor(0x00FFFF)
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

            await interaction.channel.send({ embeds: [embedRules] });
            Logger.cmd(cmdName, interaction.user.tag, interaction.guild?.name);
        }

        // ========= /restart =========
        if (cmdName === "restart") {
            const code = interaction.options.getString("code");
            if (code !== ACCESS_CODE) {
                return interaction.reply({ content: "❌ Código inválido.", flags: 64 });
            }

            await interaction.reply({ content: "♻️ Reiniciando o bot...", flags: 64 });
            Logger.system(`${interaction.user.tag} reiniciou o bot via /restart`);
            process.exit(0);
        }

        // ========= /adm =========
        if (cmdName === "adm") {
            const code = interaction.options.getString("code");
            if (code !== ACCESS_CODE) {
                return interaction.reply({ content: "❌ Código inválido.", flags: 64 });
            }

            // Painel de botões
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("stats")
                        .setLabel("📊 Estatísticas")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("report")
                        .setLabel("📥 Enviar relatórios para console")
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ content: "🔒 Painel acessado com sucesso.", components: [row], flags: 64 });
            Logger.system(`${interaction.user.tag} acessou o painel administrativo`);
        }
    }

    // ================= INTERAÇÕES COM BOTÕES =================
    if (interaction.isButton()) {
        if (interaction.customId === "stats") {
            Logger.system(`${interaction.user.tag} clicou em Estatísticas`);
            const embed = new EmbedBuilder()
                .setTitle("📊 Estatísticas do Bot")
                .setColor(0x00FFFF)
                .setDescription(`Total de comandos executados: ${stats.totalCommands}\nErros: ${stats.errors}\nEntradas: ${stats.joins}\nSaídas: ${stats.leaves}`);

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (interaction.customId === "report") {
            Logger.system(`${interaction.user.tag} clicou em Enviar relatórios`);
            logLast24HoursActivity();
            await interaction.reply({ content: "📥 Relatórios enviados para console.", flags: 64 });
        }
    }
});

// ================= REGISTRO DE COMANDOS =================
(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        Logger.success("Comandos registrados com sucesso.");
    } catch (err) {
        Logger.error("Erro ao registrar comandos", err);
    }
})();
// ==================== REGISTRO DE COMANDOS DE OUTROS BOTS ====================
client.on("messageCreate", message => {
    if (message.author.bot) {
        const cmd = message.content.split(" ")[0] || "mensagem";
        stats.totalCommands++;
        stats.commandsUsed[cmd] = (stats.commandsUsed[cmd] || 0) + 1;

        Logger.cmd(cmd, message.author.tag, message.guild?.name);
    }
});

// ==================== READY ====================
client.on("clientReady", () => {
    console.clear();
    console.log(C("════════════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como: ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${Monitor.getMemory().rss} MB`));
    console.log(C("════════════════════════════════════════════"));
    logLast24HoursActivity();

    setInterval(() => {
        logLast24HoursActivity();
    }, 60 * 60 * 1000); // Atualiza relatório a cada hora
});

// ==================== SUPRESSÃO DE WARNINGS ====================
process.on('warning', e => {
    // Ignora apenas deprecations relacionados ao interaction ephemeral e clientReady
    if (e.name === 'DeprecationWarning' && e.message.includes('ephemeral')) return;
    if (e.name === 'DeprecationWarning' && e.message.includes('ready event has been renamed')) return;

    console.warn(e.name, e.message);
});

// ==================== LOGIN ====================
client.login(TOKEN);
