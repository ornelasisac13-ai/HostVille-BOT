const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1473705296101900420";

if (!TOKEN) {
    console.error("❌ TOKEN não definido!");
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ⏳ Cooldown Map
const cooldown = new Map();
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 horas

// ========= COMANDOS =========
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor'),

    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Mostra informações do bot')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Comandos registrados!");
    } catch (error) {
        console.error("Erro ao registrar comandos:", error);
    }
}

client.once('clientReady', async (client) => {
    console.log("🤖 BOT ONLINE:", client.user.tag);
    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'rule') {

        const userId = interaction.user.id;
        const now = Date.now();

        if (cooldown.has(userId)) {
            const lastUsed = cooldown.get(userId);
            const timeLeft = COOLDOWN_TIME - (now - lastUsed);

            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                return interaction.reply({
                    content: `⏳ Você já usou este comando hoje.\nTente novamente em ${hours}h ${minutes}m.`,
                    flags: 64
                });
            }
        }

        cooldown.set(userId, now);

        await interaction.deferReply({ flags: 64 });

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setImage("https://image2url.com/r2/default/images/1771453214746-e642e4a3-1aba-4eae-bd21-07e118149345.jpg")
            .setTitle("📜 Regras e Diretrizes - HostVille Greenville RP")
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

        await interaction.channel.send({ embeds: [embed] });
        await interaction.deleteReply();
    }

    if (interaction.commandName === 'info') {

        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setTitle("🤖 Informações do Bot")
            .addFields(
                { name: "Nome", value: client.user.tag, inline: true },
                { name: "ID", value: client.user.id, inline: true },
                { name: "Servidores", value: `${client.guilds.cache.size}`, inline: true },
                { name: "Uptime", value: `${hours}h ${minutes}m ${seconds}s`, inline: true }
            )
            .setFooter({ text: "HostVille Greenville RP" });

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
});

client.login(TOKEN);
