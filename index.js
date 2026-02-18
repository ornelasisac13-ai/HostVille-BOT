const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

// ===== VARIÁVEIS RAILWAY =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
    console.error("❌ TOKEN não definido!");
    process.exit(1);
}

if (!CLIENT_ID) {
    console.error("❌ CLIENT_ID não definido!");
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ========= REGISTRO DO COMANDO =========
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        console.log("🔄 Registrando comando...");
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Comando registrado!");
    } catch (error) {
        console.error(error);
    }
}

client.once('ready', async () => {
    console.log(`🤖 Bot online como ${client.user.tag}`);
    await registerCommands();
});

// ========= COMANDO =========
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'rule') {

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0) // Azul bebê
            .setImage('https://image2url.com/r2/default/images/1771453214746-e642e4a3-1aba-4eae-bd21-07e118149345.jpg')
            .setTitle('📜 Regras e Diretrizes - HostVille Greenville RP')
            .setDescription(`
As regras gerais têm como objetivo garantir ordem, respeito e boa convivência.

🤖 **AutoMod**
Sistema ativo 24h contra spam, flood e abusos.

⚠️ **Blacklist**
Proibição total para quem tentar burlar regras.

🔒 **Segurança**
Exploit, contas alternativas ou abuso = punição.

🚦 **Regras de Trânsito**
• Máx. 85 MPH  
• Respeite sinalizações  

🎭 **Roleplay**
• Sem Troll, Power-Gaming ou Fail-RP  
• NLR: 3 minutos após morte/prisão  

💼 **Economia**
• 1 trabalho por sessão  

🗣️ **Comunicação**
• Use // para falar fora do RP  

🔗 **Links Oficiais**
[Política de Privacidade](https://nativo-00.gitbook.io/hostville-bot-privacy-policy/)  
[Termos de Uso](https://nativo-00.gitbook.io/hostville-bot-terms/)
`);

        await interaction.channel.send({ embeds: [embed] });
    }
});

client.login(TOKEN);
