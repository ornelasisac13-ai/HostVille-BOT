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

// ================= CONFIG =================
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

// ================= HISTÓRICO DE MEMBROS =================
const activityHistory = [];

// ================= COR CYAN FIXA =================
const C = chalk.cyanBright;

// ================= MONITORAMENTO =================
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

// ================= CLIENT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= FUNÇÃO DE CHECAGEM DE CÓDIGO =================
function checkAccess(interaction) {
    const code = interaction.options.getString("code");
    if (!code || code !== ACCESS_CODE) {
        interaction.reply({ content: "❌ Código inválido", flags: 64 }); // efêmero
        return false;
    }
    return true;
}

// ================= READY =================
client.once("clientReady", () => {
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

// ================= ENTRADA DE MEMBRO =================
client.on("guildMemberAdd", member => {
    stats.joins++;
    activityHistory.push({ type: "join", tag: member.user.tag, id: member.user.id, timestamp: Date.now() });
    console.log(C(`➕ ${member.user.tag} entrou no servidor.`));
});

// ================= SAÍDA DE MEMBRO =================
client.on("guildMemberRemove", member => {
    stats.leaves++;
    activityHistory.push({ type: "leave", tag: member.user.tag, id: member.user.id, timestamp: Date.now() });
    console.log(C(`➖ ${member.user.tag} saiu do servidor.`));
});

// ================= COMANDOS =================
const commands = [
    new SlashCommandBuilder()
        .setName("rules")
        .setDescription("Mostrar regras")
        .addStringOption(opt => opt.setName("code").setDescription("Código de acesso").setRequired(true)),

    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações do bot")
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

// ================= REGISTRO DE COMANDOS =================
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
})();

// ================= INTERAÇÕES =================
client.on("interactionCreate", async interaction => {
    // ---------------- BOTÕES DO PAINEL ----------------
    if (interaction.isButton()) {
        if (interaction.customId === "adm_stats") {
            console.log(C(`📊 Painel acessado por: ${interaction.user.tag}`));
            await interaction.reply({ content: `📊 Estatísticas:\nComandos: ${stats.totalCommands}\nEntradas: ${stats.joins}\nSaídas: ${stats.leaves}`, flags: 64 });
        }
        if (interaction.customId === "adm_report") {
            console.log(C(`📄 Relatório enviado para console por: ${interaction.user.tag}`));
            console.log(stats);
            logLast24HoursActivity();
            await interaction.reply({ content: "✅ Relatório enviado para o console", flags: 64 });
        }
        return;
    }

    // ---------------- COMANDOS ----------------
    if (!interaction.isChatInputCommand()) return;

    // Bloqueia se código inválido
    if (!checkAccess(interaction)) return;

    const cmdName = interaction.commandName;
    stats.totalCommands++;
    stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;

    console.log(C(`📝 Comando usado: ${cmdName} | Usuário: ${interaction.user.tag} | Servidor: ${interaction.guild?.name || "DM"}`));

    // ---------------- /rules ----------------
    if (cmdName === "rules") {
        const embed = new EmbedBuilder()
            .setTitle("Regras do HostVille Greenville RP")
            .setColor("#00FFFF")
            .setDescription(`As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.\n\n➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.\n\n━━━━━━━━━━━━━━━━━━━━\n\n📘 Para mais informações: [Regras](https://docs.google.com/document/d/1ZU-oLyI88HEB2RMDunr4NNF1nkGQ3BWmcyYagY0T3dk/edit?usp=drivesdk)\n\n━━━━━━━━━━━━━━━━━━━━\n\n🔗 Documentos Oficiais\n📄 [Política de Privacidade](https://docs.google.com/document/d/1hoL-0AcJhrTXZAPIschLxoeF3kzAi7knTVPDXdT20nE/edit?usp=drivesdk)\n📜 [Termos de Uso](https://docs.google.com/document/d/1ZrScgrEAb7NnBGZW1XLQvBRaGIDrzatq8XBjlVyYP_k/edit?usp=drivesdk)\n\n━━━━━━━━━━━━━━━━━━━━\n✨ Powered by Y2k_Nat`)
            .setThumbnail("https://image2url.com/r2/default/images/1771466090995-ea6150ee-52be-4f03-953e-f6a41480320e.png");

        // Mensagem confirmando execução só para quem executou
        await interaction.reply({ content: "✅ Comando executado com sucesso", flags: 64 });
        // Embed enviado para todos no canal
        await interaction.followUp({ embeds: [embed] });
    }

    // ---------------- /info ----------------
    if (cmdName === "info") {
        const embed = new EmbedBuilder()
            .setTitle("HostVille Bot")
            .setColor("#00FFFF")
            .setDescription("Bot oficial do servidor.")
            .addFields(
                { name: "Uptime", value: Monitor.getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
            );

        await interaction.reply({ embeds: [embed], flags: 64 });
    }

    // ---------------- /adm ----------------
    if (cmdName === "adm") {
        console.log(C(`🔒 Painel administrativo acessado por: ${interaction.user.tag}`));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("adm_stats").setLabel("Estatísticas").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("adm_report").setLabel("Enviar relatórios para console").setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: "🔐 Painel acessado", components: [row], flags: 64 });
    }

    // ---------------- /restart ----------------
    if (cmdName === "restart") {
        process.exit(0);
    }
});

// ==================== REGISTRO DE TODOS COMANDOS ====================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Registrar todos os comandos usados, inclusive de outros bots
    stats.totalCommands++;
    const cmdName = interaction.commandName;
    stats.commandsUsed[cmdName] = (stats.commandsUsed[cmdName] || 0) + 1;

    console.log(
        C(`📝 Comando usado: ${cmdName} | Usuário: ${interaction.user.tag} | Servidor: ${interaction.guild?.name || "DM"}`)
    );
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

// ==================== SUPRESSÃO DE WARNINGS ====================
process.removeAllListeners("warning"); // Remove warnings de depreciação no console
