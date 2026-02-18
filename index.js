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
        console.log("🔄 Registrando comandos...");
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Comandos registrados!");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }
}

client.once('clientReady', async (client) => {
    console.log("====================================");
    console.log("🤖 BOT ONLINE");
    console.log(`👤 Usuário: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(`📅 Iniciado em: ${new Date().toLocaleString()}`);
    console.log("====================================");

    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    console.log(`📌 /${interaction.commandName} | ${interaction.user.tag}`);

    // ========= /RULE =========
    if (interaction.commandName === 'rule') {

        await interaction.deferReply({ flags: 64 }); // EPHEMERAL sem warning

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setImage("https://image2url.com/r2/default/images/1771453214746-e642e4a3-1aba-4eae-bd21-07e118149345.jpg")
            .setTitle("📜 Regras e Diretrizes - HostVille Greenville RP")
            .setDescription(`
As regras garantem ordem e respeito.

🤖 **AutoMod**
Sistema ativo 24h.

⚠️ **Blacklist**
• Burlar regras  
• Exploits  
• Contas alternativas  

🚦 **Trânsito**
Máx. 85 MPH  

🎭 **Roleplay**
Sem Troll, Power-Gaming ou Fail-RP  
NLR: 3 minutos  

💼 **Economia**
1 trabalho por sessão  

🗣️ **Comunicação**
Use // fora do RP  

🔗 **Links Oficiais**
[Política de Privacidade](https://nativo-00.gitbook.io/hostville-bot-privacy-policy/)  
[Termos de Uso](https://nativo-00.gitbook.io/hostville-bot-terms/)
`);

        await interaction.channel.send({ embeds: [embed] });

        await interaction.deleteReply();
    }

    // ========= /INFO =========
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
            );

        await interaction.reply({
            embeds: [embed],
            flags: 64 // EPHEMERAL sem warning
        });
    }
});

client.login(TOKEN);
