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

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.log(chalk.red("TOKEN não definido."));
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.log(chalk.red("ACCESS_CODE não definido."));
    process.exit(1);
}

// ================= ESTATÍSTICAS =================
const stats = {
    totalCommands: 0,
    errors: 0,
    joins: [],
    leaves: []
};

// ================= UTIL =================
const C = chalk.cyanBright;

function brTime() {
    return new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo"
    });
}

function logStructured(title, message) {
    console.log(C("════════════════════════════════════════════"));
    console.log(C(`📌 ${title}`));
    console.log(C(message));
    console.log(C(`🕒 ${brTime()}`));
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

// ================= READY =================
client.once("ready", () => {
    console.clear();
    console.log(C("════════════════════════════════════════════"));
    console.log(C("ＨｏｓｔＶｉｌｌｅ • ＢＯＴ"));
    console.log(C(`Logado como ${client.user.tag}`));
    console.log(C(`Ping: ${client.ws.ping}ms`));
    console.log(C(`Memória: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`));
    console.log(C("════════════════════════════════════════════"));

    setInterval(report24h, 60 * 60 * 1000);
});

// ================= HISTÓRICO 24H =================
function report24h() {
    const now = Date.now();
    const last24 = 24 * 60 * 60 * 1000;

    const joins = stats.joins.filter(j => now - j.time <= last24);
    const leaves = stats.leaves.filter(l => now - l.time <= last24);

    console.log(C("════════════════════════════════════════════"));
    console.log(C(`🕒 Relatório 24h (${brTime()})`));

    if (joins.length === 0) {
        console.log(C("Não entrou ninguém no servidor nas últimas 24 horas"));
    } else {
        console.log(C(`Entraram (${joins.length}) nas últimas 24h:`));
        joins.forEach(j => console.log(C(`+ ${j.tag}`)));
    }

    if (leaves.length === 0) {
        console.log(C("Não saiu ninguém do servidor nas últimas 24 horas"));
    } else {
        console.log(C(`Saíram (${leaves.length}) nas últimas 24h:`));
        leaves.forEach(l => console.log(C(`- ${l.tag}`)));
    }

    console.log(C("════════════════════════════════════════════"));
}

// ================= EVENTOS =================
client.on("guildMemberAdd", member => {
    stats.joins.push({ tag: member.user.tag, time: Date.now() });
    logStructured("ENTROU", `${member.user.tag} entrou no servidor.`);
});

client.on("guildMemberRemove", member => {
    stats.leaves.push({ tag: member.user.tag, time: Date.now() });
    logStructured("SAIU", `${member.user.tag} saiu do servidor.`);
});

// ================= COMANDOS =================
const commands = [
    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Informações do bot"),

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
        .setDescription("Reiniciar o bot")
        .addStringOption(opt =>
            opt.setName("code")
                .setDescription("Código de acesso")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("adm")
        .setDescription("Painel Administrativo")
        .addStringOption(opt =>
            opt.setName("code")
                .setDescription("Código de acesso")
                .setRequired(true)
        )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
);

// ================= INTERAÇÕES =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    stats.totalCommands++;
    logStructured("COMANDO", `/${interaction.commandName} usado por ${interaction.user.tag}`);

    // INFO
    if (interaction.commandName === "info") {
        const embed = new EmbedBuilder()
            .setTitle("🤖 Informações do Bot")
            .setColor("#89CFF0")
            .addFields(
                { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                { name: "Comandos usados", value: `${stats.totalCommands}`, inline: true }
            )
            .setFooter({ text: "HostVille Greenville RP" });

        await interaction.reply({ embeds: [embed], flags: 64 });
    }

    // RULE COMPLETO RESTAURADO
    if (interaction.commandName === "rule") {
        const code = interaction.options.getString("code");

        if (code !== ACCESS_CODE) {
            return interaction.reply({ content: "❌ Código inválido.", flags: 64 });
        }

        await interaction.reply({ content: "✅ Regras enviadas.", flags: 64 });

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
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

        await interaction.channel.send({ embeds: [embed] });
    }

    // RESTART
    if (interaction.commandName === "restart") {
        const code = interaction.options.getString("code");

        if (code !== ACCESS_CODE) {
            return interaction.reply({ content: "❌ Código inválido.", flags: 64 });
        }

        await interaction.reply({ content: "♻️ Reiniciando...", flags: 64 });
        process.exit(0);
    }

    // PAINEL ADM
    if (interaction.commandName === "adm") {
        const code = interaction.options.getString("code");

        if (code !== ACCESS_CODE) {
            return interaction.reply({ content: "❌ Código inválido.", flags: 64 });
        }

        logStructured("PAINEL ADM", `Acessado por ${interaction.user.tag}`);

        await interaction.reply({
            content:
`📊 Painel Administrativo

Comandos usados: ${stats.totalCommands}
Erros: ${stats.errors}
Ping: ${client.ws.ping}ms
Memória: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB
Horário Brasília: ${brTime()}`,
            flags: 64
        });
    }
});

client.login(TOKEN);
