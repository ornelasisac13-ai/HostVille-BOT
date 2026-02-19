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
