import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} from "discord.js";

import chalk from "chalk";
import os from "os";
import process from "process";

/* =====================================================
   CONFIGURAÇÃO
===================================================== */

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.error("TOKEN não definido.");
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.error("ACCESS_CODE não definido.");
    process.exit(1);
}

/* =====================================================
   ESTATÍSTICAS GLOBAIS
===================================================== */

const stats = {
    startTime: Date.now(),
    totalCommands: 0,
    errors: 0,
    joins: 0,
    leaves: 0,
    deletedMessages: 0,
    panelAccess: 0
};

/* =====================================================
   HISTÓRICO 24H
===================================================== */

const activityHistory = [];

/* =====================================================
   LOGGER EMPRESARIAL
===================================================== */

const C = chalk.cyanBright;
const G = chalk.greenBright;
const R = chalk.redBright;
const Y = chalk.yellowBright;
const M = chalk.magentaBright;
const W = chalk.white;

function line() {
    console.log(C("════════════════════════════════════════════════════════════"));
}

function logInfo(message) {
    console.log(C("ℹ️  INFO  ") + W(message));
}

function logSuccess(message) {
    console.log(G("✅ SUCCESS ") + W(message));
}

function logError(message) {
    stats.errors++;
    console.log(R("❌ ERROR  ") + W(message));
}

function logWarn(message) {
    console.log(Y("⚠️  WARN   ") + W(message));
}

function logCommand(user, command) {
    console.log(M("📝 COMMAND ") + W(`${user} executou /${command}`));
}

function logJoin(user) {
    console.log(G("➕ JOIN    ") + W(user));
}

function logLeave(user) {
    console.log(R("➖ LEAVE   ") + W(user));
}

function logDelete(user, content) {
    console.log(Y("🗑 DELETE  ") + W(`${user} apagou: ${content}`));
}

/* =====================================================
   MONITORAMENTO
===================================================== */

const Monitor = {
    memory() {
        const m = process.memoryUsage();
        return (m.rss / 1024 / 1024).toFixed(2);
    },

    uptime() {
        const ms = Date.now() - stats.startTime;
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
    },

    cpu() {
        const cpus = os.cpus();
        return cpus.length;
    }
};

/* =====================================================
   HORÁRIO BRASÍLIA
===================================================== */

function brasiliaNow() {
    return new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo"
    });
}

/* =====================================================
   RELATÓRIO 24H
===================================================== */

function reportLast24Hours() {
    const now = Date.now();
    const limit = 24 * 60 * 60 * 1000;

    const recent = activityHistory.filter(a => now - a.timestamp <= limit);

    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    line();
    console.log(C("🕒 Horário Brasília: ") + W(brasiliaNow()));

    if (joins.length === 0) {
        console.log(C("Não entrou ninguém nas últimas 24 horas."));
    } else {
        console.log(
            C(`Entraram (${joins.length}) nas últimas 24h: `) +
            W(joins.map(j => j.tag).join(", "))
        );
    }

    if (leaves.length === 0) {
        console.log(C("Não saiu ninguém nas últimas 24 horas."));
    } else {
        console.log(
            C(`Saíram (${leaves.length}) nas últimas 24h: `) +
            W(leaves.map(l => l.tag).join(", "))
        );
    }

    line();
}

/* =====================================================
   CLIENT DISCORD
===================================================== */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

/* =====================================================
   EVENTO READY
===================================================== */

client.once("ready", () => {
    console.clear();
    line();
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C("Logado como: ") + W(client.user.tag));
    console.log(C("Ping: ") + W(client.ws.ping + "ms"));
    console.log(C("RAM: ") + W(Monitor.memory() + " MB"));
    console.log(C("CPU Cores: ") + W(Monitor.cpu()));
    line();

    reportLast24Hours();

    setInterval(() => {
        reportLast24Hours();
    }, 60 * 60 * 1000);
});

/* =====================================================
   EVENTOS DE SERVIDOR
===================================================== */

client.on("guildMemberAdd", member => {
    stats.joins++;

    activityHistory.push({
        type: "join",
        tag: member.user.tag,
        timestamp: Date.now()
    });

    logJoin(member.user.tag);
});

client.on("guildMemberRemove", member => {
    stats.leaves++;

    activityHistory.push({
        type: "leave",
        tag: member.user.tag,
        timestamp: Date.now()
    });

    logLeave(member.user.tag);
});

client.on("messageDelete", message => {
    if (!message.author) return;

    stats.deletedMessages++;

    logDelete(message.author.tag, message.content || "[Embed/Arquivo]");
});
/* =====================================================
   COMANDOS SLASH
===================================================== */

const commands = [

    new SlashCommandBuilder()
        .setName("rule")
        .setDescription("Exibir regras do servidor")
        .addStringOption(opt =>
            opt.setName("code")
                .setDescription("Código de acesso")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações completas do bot"),

    new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Reiniciar o bot")
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

/* =====================================================
   REGISTRO DOS COMANDOS
===================================================== */

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        logSuccess("Comandos registrados com sucesso.");
    } catch (err) {
        logError("Erro ao registrar comandos.");
    }
})();

/* =====================================================
   INTERAÇÕES
===================================================== */

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    stats.totalCommands++;
    logCommand(interaction.user.tag, interaction.commandName);

    /* ===================== RULE ===================== */

    if (interaction.commandName === "rule") {

        const code = interaction.options.getString("code");

        if (code !== ACCESS_CODE) {
            return interaction.reply({
                content: "❌ Código inválido.",
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor("#89CFF0")
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

        await interaction.reply({
            embeds: [embed]
        });

        logSuccess(`/rule usado por ${interaction.user.tag}`);
    }

    /* ===================== INFO ===================== */

    if (interaction.commandName === "info") {

        const embed = new EmbedBuilder()
            .setColor("#00FFFF")
            .setTitle("🤖 Informações do Bot")
            .addFields(
                { name: "Uptime", value: Monitor.uptime(), inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                { name: "RAM", value: `${Monitor.memory()} MB`, inline: true },
                { name: "Erros", value: `${stats.errors}`, inline: true },
                { name: "Entradas", value: `${stats.joins}`, inline: true },
                { name: "Saídas", value: `${stats.leaves}`, inline: true },
                { name: "Mensagens Apagadas", value: `${stats.deletedMessages}`, inline: true },
                { name: "Comandos Usados", value: `${stats.totalCommands}`, inline: true }
            )
            .setFooter({ text: "HostVille Greenville RP" });

        await interaction.reply({
            embeds: [embed]
        });
    }

    /* ===================== RESTART ===================== */

    if (interaction.commandName === "restart") {

        const code = interaction.options.getString("code");

        if (code !== ACCESS_CODE) {
            return interaction.reply({
                content: "❌ Código inválido.",
                flags: 64
            });
        }

        await interaction.reply("♻️ Reiniciando...");
        logWarn(`Bot reiniciado por ${interaction.user.tag}`);
        process.exit(0);
    }

    /* ===================== PAINEL ADM ===================== */

    if (interaction.commandName === "adm") {

        const code = interaction.options.getString("code");

        if (code !== ACCESS_CODE) {
            return interaction.reply({
                content: "❌ Código inválido.",
                flags: 64
            });
        }

        stats.panelAccess++;

        const embed = new EmbedBuilder()
            .setColor("#00FFFF")
            .setTitle("👑 Painel Administrativo")
            .setDescription("Acesso autorizado ao painel ADM.")
            .addFields(
                { name: "Acessos ao Painel", value: `${stats.panelAccess}`, inline: true },
                { name: "Erros do Sistema", value: `${stats.errors}`, inline: true },
                { name: "Horário Brasília", value: brasiliaNow(), inline: false }
            );

        await interaction.reply({
            embeds: [embed]
        });

        logInfo(`Painel ADM acessado por ${interaction.user.tag}`);
    }

});

/* =====================================================
   LOGIN
===================================================== */

client.login(TOKEN);
