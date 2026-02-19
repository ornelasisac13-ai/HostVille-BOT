import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder 
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
    return new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo"
    });
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
        GatewayIntentBits.GuildMembers
    ]
});

// ================= READY =================
client.once("ready", async () => {
    console.clear();
    console.log(C("════════════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${Monitor.getMemory().rss} MB`));
    console.log(C("════════════════════════════════════════════"));

    logLast24HoursActivity();

    setInterval(() => {
        logLast24HoursActivity();
    }, 60 * 60 * 1000);
});

// ================= ENTRADA =================
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

// ================= SAÍDA =================
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

// ================= COMANDOS =================
const commands = [
    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações do bot"),

    new SlashCommandBuilder()
        .setName("rule")
        .setDescription("Mostrar regras"),

    new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Reiniciar bot")
        .addStringOption(opt =>
            opt.setName("code")
                .setDescription("Código de acesso")
                .setRequired(true)
        )
].map(c => c.toJSON());

// Registrar comandos
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

// ================= INTERAÇÕES =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    stats.totalCommands++;

    if (interaction.commandName === "info") {
        const embed = new EmbedBuilder()
            .setTitle("HostVille Bot")
            .setColor("#00FFFF")
            .setDescription("Bot oficial do servidor.")
            .addFields(
                { name: "Uptime", value: Monitor.getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "rule") {
        await interaction.reply("Respeite todos os membros e siga as regras do servidor.");
    }

    if (interaction.commandName === "restart") {
        const code = interaction.options.getString("code");

        if (code !== ACCESS_CODE) {
            return interaction.reply({ content: "Código inválido.", ephemeral: true });
        }

        await interaction.reply("Reiniciando...");
        process.exit(0);
    }
});

// ================= LOGIN =================
client.login(TOKEN);
