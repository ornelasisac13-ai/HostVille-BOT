import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField
} from "discord.js";

import chalk from "chalk";
import os from "os";
import process from "process";

//////////////////////////////////////////////////////////////////
// ===================== CONFIG ================================ //
//////////////////////////////////////////////////////////////////

const TOKEN = process.env.TOKEN;
const ACCESS_CODE = process.env.ACCESS_CODE;

const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";

if (!TOKEN) {
    console.error("TOKEN não definido.");
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.error("ACCESS_CODE não definido.");
    process.exit(1);
}

//////////////////////////////////////////////////////////////////
// ===================== CONSOLE STYLE ========================= //
//////////////////////////////////////////////////////////////////

const C = chalk.cyanBright;

function log(type, message) {
    const time = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo"
    });

    console.log(C(`[${time}] [${type}] ${message}`));
}

//////////////////////////////////////////////////////////////////
// ===================== STATS ================================ //
//////////////////////////////////////////////////////////////////

const stats = {
    startTime: Date.now(),
    totalCommands: 0,
    joins: 0,
    leaves: 0,
    deletes: 0,
    panelUses: 0,
    restartCount: 0,
    errors: 0
};

//////////////////////////////////////////////////////////////////
// ===================== HISTÓRICO ============================ //
//////////////////////////////////////////////////////////////////

const activityHistory = [];

function getUptime() {
    const ms = Date.now() - stats.startTime;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
}

function getMemory() {
    return (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
}

//////////////////////////////////////////////////////////////////
// ===================== RELATÓRIO 24H ========================= //
//////////////////////////////////////////////////////////////////

function report24h() {
    const now = Date.now();
    const limit = 24 * 60 * 60 * 1000;

    const recent = activityHistory.filter(a => now - a.timestamp <= limit);

    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    log("RELATÓRIO", "══════════════════════════════════════");

    if (joins.length === 0) {
        log("RELATÓRIO", "Não entrou ninguém nas últimas 24h.");
    } else {
        log("RELATÓRIO", `Entraram (${joins.length}) nas últimas 24h: ${joins.map(j => j.tag).join(", ")}`);
    }

    if (leaves.length === 0) {
        log("RELATÓRIO", "Não saiu ninguém nas últimas 24h.");
    } else {
        log("RELATÓRIO", `Saíram (${leaves.length}) nas últimas 24h: ${leaves.map(l => l.tag).join(", ")}`);
    }

    log("RELATÓRIO", "══════════════════════════════════════");
}

//////////////////////////////////////////////////////////////////
// ===================== CLIENT =============================== //
//////////////////////////////////////////////////////////////////

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

//////////////////////////////////////////////////////////////////
// ===================== READY (SEM WARNING) =================== //
//////////////////////////////////////////////////////////////////

client.once("clientReady", (client) => {

    console.clear();

    console.log(C("══════════════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${getMemory()} MB`));
    console.log(C(`Uptime: ${getUptime()}`));
    console.log(C("══════════════════════════════════════════════"));

    log("STATUS", "Bot iniciado corretamente.");
    report24h();

    setInterval(report24h, 60 * 60 * 1000);
});

//////////////////////////////////////////////////////////////////
// ===================== ENTRADA =============================== //
//////////////////////////////////////////////////////////////////

client.on("guildMemberAdd", member => {
    stats.joins++;

    activityHistory.push({
        type: "join",
        tag: member.user.tag,
        timestamp: Date.now()
    });

    log("JOIN", `${member.user.tag} entrou no servidor.`);
});

//////////////////////////////////////////////////////////////////
// ===================== SAÍDA =============================== //
//////////////////////////////////////////////////////////////////

client.on("guildMemberRemove", member => {
    stats.leaves++;

    activityHistory.push({
        type: "leave",
        tag: member.user.tag,
        timestamp: Date.now()
    });

    log("LEAVE", `${member.user.tag} saiu do servidor.`);
});

//////////////////////////////////////////////////////////////////
// ===================== MENSAGEM APAGADA ===================== //
//////////////////////////////////////////////////////////////////

client.on("messageDelete", message => {
    if (!message.author) return;

    stats.deletes++;

    log("DELETE", `❗️(${message.author.tag}) apagou: ${message.content || "Mensagem sem texto"}`);
});
//////////////////////////////////////////////////////////////////
// ===================== COMANDOS ============================= //
//////////////////////////////////////////////////////////////////

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
        .setDescription("Exibe as regras do servidor")
        .addStringOption(opt =>
            opt.setName("code")
                .setDescription("Código de acesso")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Reinicia o bot")
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

].map(cmd => cmd.toJSON());

//////////////////////////////////////////////////////////////////
// ===================== REGISTRO ============================= //
//////////////////////////////////////////////////////////////////

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        log("SLASH", "Comandos registrados com sucesso.");
    } catch (error) {
        stats.errors++;
        console.error(error);
    }
})();

//////////////////////////////////////////////////////////////////
// ===================== INTERAÇÕES ============================ //
//////////////////////////////////////////////////////////////////

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    stats.totalCommands++;

    const user = interaction.user.tag;
    const command = interaction.commandName;
    const code = interaction.options.getString("code");

    log("COMANDO", `${user} executou /${command}`);

    //////////////////////////////////////////////////////////////////
    // ===================== VALIDAÇÃO GLOBAL ===================== //
    //////////////////////////////////////////////////////////////////

    if (code !== ACCESS_CODE) {
        return interaction.reply({
            content: "❌ Código de acesso inválido.",
            flags: 64
        });
    }

    //////////////////////////////////////////////////////////////////
    // ===================== /INFO =============================== //
    //////////////////////////////////////////////////////////////////

    if (command === "info") {

        const embed = new EmbedBuilder()
            .setColor("#00FFFF")
            .setTitle("🤖 Informações do HostVille Bot")
            .addFields(
                { name: "Uptime", value: getUptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                { name: "Memória", value: `${getMemory()} MB`, inline: true },
                { name: "Entradas", value: `${stats.joins}`, inline: true },
                { name: "Saídas", value: `${stats.leaves}`, inline: true },
                { name: "Mensagens apagadas", value: `${stats.deletes}`, inline: true }
            )
            .setFooter({ text: "HostVille Greenville RP" });

        return interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }

    //////////////////////////////////////////////////////////////////
    // ===================== /RULE =============================== //
    //////////////////////////////////////////////////////////////////

    if (command === "rule") {

        const embed = new EmbedBuilder()
            .setColor("#00FFFF")
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

        return interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }

    //////////////////////////////////////////////////////////////////
    // ===================== /ADM =============================== //
    //////////////////////////////////////////////////////////////////

    if (command === "adm") {

        stats.panelUses++;

        log("PAINEL", `Painel acessado por ${user}`);

        const embed = new EmbedBuilder()
            .setColor("#00FFFF")
            .setTitle("🛡 Painel Administrativo")
            .setDescription("Sistema empresarial HostVille.")
            .addFields(
                { name: "Total comandos usados", value: `${stats.totalCommands}`, inline: true },
                { name: "Reinícios", value: `${stats.restartCount}`, inline: true },
                { name: "Erros", value: `${stats.errors}`, inline: true },
                { name: "Entradas", value: `${stats.joins}`, inline: true },
                { name: "Saídas", value: `${stats.leaves}`, inline: true }
            );

        return interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }

    //////////////////////////////////////////////////////////////////
    // ===================== /RESTART =========================== //
    //////////////////////////////////////////////////////////////////

    if (command === "restart") {

        stats.restartCount++;

        log("RESTART", `Bot reiniciado por ${user}`);

        await interaction.reply({
            content: "♻ Reiniciando bot...",
            flags: 64
        });

        setTimeout(() => {
            process.exit(0);
        }, 1500);
    }

});

//////////////////////////////////////////////////////////////////
// ===================== LOGIN ================================ //
//////////////////////////////////////////////////////////////////

client.login(TOKEN);
