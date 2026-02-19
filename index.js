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

// ================= CONFIGURAÇÃO =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

// ================= ESTATÍSTICAS E LOGS =================
const stats = {
    commandsUsed: {},
    totalCommands: 0,
    startTime: Date.now(),
    restarts: 0,
    errors: 0,
    joins: 0,
    leaves: 0
};

const activityHistory = [];

// ================= ESTILOS =================
const C = chalk.cyanBright;
const G = chalk.greenBright;
const Y = chalk.yellowBright;
const R = chalk.redBright;
const W = chalk.whiteBright;

// ================= FUNÇÕES DE MONITORAMENTO =================
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
            for (let type in cpu.times) totalTick += cpu.times[type];
            totalIdle += cpu.times.idle;
        });
        return {
            usage: Math.round(100 - (totalIdle / totalTick * 100)),
            cores: cpus.length
        };
    }
};

// ================= HORÁRIO BRASÍLIA =================
function getBrasiliaTime() {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// ================= LOGS 24H =================
function logLast24HoursActivity() {
    const now = Date.now();
    const last24h = 24 * 60 * 60 * 1000;
    const recent = activityHistory.filter(a => now - a.timestamp <= last24h);

    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    console.log(C("══════════════════════════════════════════════════════════"));
    console.log(C(`🕒 Horário Brasília: ${getBrasiliaTime()}`));

    if (joins.length === 0) console.log(C("Não entrou ninguém no servidor nas últimas 24 horas"));
    else console.log(C(`Entraram (${joins.length}) no servidor nas últimas 24 horas, sendo elas: ${joins.map(j => j.tag).join(", ")}`));

    if (leaves.length === 0) console.log(C("Não saiu ninguém do servidor nas últimas 24 horas"));
    else console.log(C(`Saíram (${leaves.length}) do servidor nas últimas 24 horas, sendo elas: ${leaves.map(l => l.tag).join(", ")}`));

    console.log(C("══════════════════════════════════════════════════════════"));
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

// ================= READY =================
client.once("ready", async () => {
    console.clear();
    console.log(C("══════════════════════════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    const mem = Monitor.getMemory();
    console.log(C(`Memória: RSS ${mem.rss} MB | Heap ${mem.heapUsed}/${mem.heapTotal} MB`));
    console.log(C("══════════════════════════════════════════════════════════"));

    logLast24HoursActivity();

    setInterval(() => logLast24HoursActivity(), 60 * 60 * 1000);
});

// ================= EVENTOS DE MEMBROS =================
client.on("guildMemberAdd", member => {
    stats.joins++;
    activityHistory.push({ type: "join", tag: member.user.tag, id: member.user.id, timestamp: Date.now() });
    console.log(G(`➕ ${member.user.tag} entrou no servidor.`));
});

client.on("guildMemberRemove", member => {
    stats.leaves++;
    activityHistory.push({ type: "leave", tag: member.user.tag, id: member.user.id, timestamp: Date.now() });
    console.log(R(`➖ ${member.user.tag} saiu do servidor.`));
});

// ================= EVENTOS DE MENSAGEM =================
client.on("messageDelete", message => {
    if (!message.guild) return;
    const author = message.author ? message.author.tag : "Desconhecido";
    const content = message.content ? message.content : "(sem conteúdo)";
    console.log(Y(`❗️ ${author} apagou uma mensagem: ${content}`));
    activityHistory.push({ type: "messageDelete", tag: author, content, timestamp: Date.now() });
});
// ================= COMANDOS =================
const commands = [
    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Mostra informações do bot")
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

// ================= REGISTRAR COMANDOS =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log(C("✅ Comandos registrados com sucesso!"));
    } catch (err) {
        console.log(R("❌ Erro ao registrar comandos:"), err);
    }
})();

// ================= INTERAÇÕES =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const code = interaction.options.getString("code");

    // Verifica código de acesso
    if (code !== ACCESS_CODE) {
        return interaction.reply({ content: "❌ Código de acesso inválido.", ephemeral: true });
    }

    stats.totalCommands++;
    stats.commandsUsed[interaction.commandName] = (stats.commandsUsed[interaction.commandName] || 0) + 1;

    console.log(C(`📌 /${interaction.commandName} executado por ${interaction.user.tag}`));

    // ================= /INFO =================
    if (interaction.commandName === "info") {
        const mem = Monitor.getMemory();
        const cpu = Monitor.getCPU();
        const uptime = Monitor.getUptime();

        const embed = new EmbedBuilder()
            .setTitle("🤖 HostVille Bot")
            .setColor("#00FFFF")
            .setDescription("Bot oficial do servidor HostVille Greenville RP")
            .addFields(
                { name: "Uptime", value: uptime, inline: true },
                { name: "Memória", value: `${mem.heapUsed} MB / ${mem.heapTotal} MB`, inline: true },
                { name: "CPU Usage", value: `${cpu.usage}% (${cpu.cores} cores)`, inline: true },
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
            )
            .setFooter({ text: "HostVille • BOT" });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ================= /RULE =================
    if (interaction.commandName === "rule") {
        const embedRules = new EmbedBuilder()
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
`);

        await interaction.user.send("✅ Comando executado com sucesso!"); // Mensagem privada de confirmação
        await interaction.reply({ embeds: [embedRules], ephemeral: true }); // Regras apenas para quem executou
    }

    // ================= /RESTART =================
    if (interaction.commandName === "restart") {
        await interaction.reply({ content: "♻️ Reiniciando o bot...", ephemeral: true });
        stats.restarts++;
        process.exit(0);
    }

    // ================= /ADM =================
    if (interaction.commandName === "adm") {
        console.log(C(`🛠️ Painel administrativo acessado por ${interaction.user.tag}`));

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("stats")
                    .setLabel("Estatísticas")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("report")
                    .setLabel("Enviar Relatórios para console")
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ content: "🛠️ Painel administrativo:", components: [row], ephemeral: true });
    }
});

// ================= BOTÃO CLICK =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "stats") {
        const mem = Monitor.getMemory();
        const cpu = Monitor.getCPU();
        const uptime = Monitor.getUptime();

        await interaction.reply({ 
            content: `📊 Estatísticas:\nUptime: ${uptime}\nRAM: ${mem.heapUsed} MB / ${mem.heapTotal} MB\nCPU: ${cpu.usage}% (${cpu.cores} cores)`, 
            ephemeral: true 
        });
    }

    if (interaction.customId === "report") {
        console.log(C("════════ Relatório de Comandos Executados ════════"));
        Object.entries(stats.commandsUsed).forEach(([cmd, count]) => {
            console.log(C(`Comando: /${cmd} → ${count} execuções`));
        });
        console.log(C(`Total de comandos executados: ${stats.totalCommands}`));
        console.log(C(`Total de reinicializações: ${stats.restarts}`));
        console.log(C("═══════════════════════════════════════════════"));

        await interaction.reply({ content: "✅ Relatório enviado para o console.", ephemeral: true });
    }
});
// ================= MONITORAMENTO CONTÍNUO =================
setInterval(() => {
    const mem = Monitor.getMemory();
    const cpu = Monitor.getCPU();
    console.log(C("════════ Status do Sistema ════════"));
    console.log(C(`⏱️ Uptime: ${Monitor.getUptime()}`));
    console.log(C(`💾 Memória Heap: ${mem.heapUsed} MB / ${mem.heapTotal} MB`));
    console.log(C(`🔥 CPU Usage: ${cpu.usage}% (${cpu.cores} cores)`));
    console.log(C("═══════════════════════════════════"));
}, 60 * 60 * 1000); // A cada 1 hora

// ================= LOG DE ENTRADAS E SAÍDAS =================
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

// ================= LOG DE MENSAGENS DELETADAS =================
client.on("messageDelete", message => {
    if (!message.guild || !message.author) return;
    console.log(C(`🗑️ Mensagem deletada por ${message.author.tag}: "${message.content}"`));
});

// ================= LOG DE TODOS OS COMANDOS DOS OUTROS BOTS =================
client.on("interactionCreate", interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Ignora se o comando for do próprio bot
    if (interaction.user.bot) {
        console.log(C(`🤖 Outro bot executou: /${interaction.commandName} por ${interaction.user.tag}`));
        return;
    }

    console.log(C(`📝 Comando detectado: /${interaction.commandName} por ${interaction.user.tag}`));
    stats.totalCommands++;
    stats.commandsUsed[interaction.commandName] = (stats.commandsUsed[interaction.commandName] || 0) + 1;
});

// ================= LOG DE REDE =================
client.on("shardReady", (shardId) => {
    console.log(C(`🌐 Shard ${shardId} pronto!`));
});

// ================= LOG DE ERROS =================
client.on("error", err => {
    stats.errors++;
    console.log(R(`❌ Erro do client: ${err.message}`));
});

// ================= LOG DE AVISOS =================
process.on("warning", warning => {
    console.log(C(`⚠️ Aviso: ${warning.name} → ${warning.message}`));
});

// ================= ALERTA 24H DE ENTRADAS/SAÍDAS =================
setInterval(() => {
    const now = Date.now();
    const last24h = 24 * 60 * 60 * 1000;
    const recent = activityHistory.filter(a => now - a.timestamp <= last24h);

    const joins = recent.filter(a => a.type === "join");
    const leaves = recent.filter(a => a.type === "leave");

    console.log(C("════════ Atividade Últimas 24H ════════"));
    console.log(C(`🕒 Horário Brasília: ${getBrasiliaTime()}`));

    if (joins.length === 0) console.log(C("Não entrou ninguém no servidor nas últimas 24 horas"));
    else console.log(C(`Entraram (${joins.length}) no servidor nas últimas 24 horas: ${joins.map(j => j.tag).join(", ")}`));

    if (leaves.length === 0) console.log(C("Não saiu ninguém do servidor nas últimas 24 horas"));
    else console.log(C(`Saíram (${leaves.length}) do servidor nas últimas 24 horas: ${leaves.map(l => l.tag).join(", ")}`));

    console.log(C("════════════════════════════════════════"));
}, 60 * 60 * 1000); // Atualiza a cada 1 hora

// ================= LOGIN =================
client.login(TOKEN);
