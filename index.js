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

const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Comando /rule registrado!");
    } catch (error) {
        console.error(error);
    }
}

client.once('ready', async () => {
    console.log(`🤖 Bot online como ${client.user.tag}`);
    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'rule') {

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0) // Azul bebê
            .setImage("https://image2url.com/r2/default/images/1771453214746-e642e4a3-1aba-4eae-bd21-07e118149345.jpg")
            .setTitle("📜 Regras e Diretrizes - HostVille Greenville RP")
            .setDescription(`
As regras gerais têm como objetivo garantir ordem, respeito e boa convivência.

➤ Ao participar você concorda em agir com educação e bom senso.

🤖 **AutoMod**
Sistema ativo 24h contra spam, flood, palavras proibidas e links suspeitos.

⚠️ **Blacklist**
Proibição total de participação.
• Burlar regras
• Exploits ou bugs
• Contas alternativas
• Prejudicar a comunidade

🔒 **Segurança**
Qualquer tentativa de burlar regras do Discord ou servidor é proibida.

✅ **Punições**
⚠️ Advertência | ❌ Kick | ⛔ Banimento

🚦 **Regras de Trânsito**
• Máx. 85 MPH  
• Respeite sinalizações  
• Use setas  
• Pare em STOP/vermelho  

⚖️ **Leis Gerais**
• ❌ Sem vandalismo, roubo ou armas sem permissão  
• 🚫 Não cause caos em áreas públicas  

🎭 **Roleplay**
• Siga sua história  
• Crie nome, profissão e personalidade  
• ❌ Sem Troll, Power-Gaming ou Fail-RP  
• 🕒 NLR: 3 minutos após morte/prisão  

💼 **Trabalho e Economia**
• 1 trabalho por sessão  
• Salário apenas pelo sistema  
• 🚫 Sem dinheiro fora de eventos  

🗣️ **Comunicação**
• Respeito sempre  
• Voz só em emergências  
• Use telefone do jogo  
• Use // para falar fora do RP  

🔗 **Links Oficiais**
[Política de Privacidade](https://nativo-00.gitbook.io/hostville-bot-privacy-policy/)  
[Termos de Uso](https://nativo-00.gitbook.io/hostville-bot-terms/)
`);

        // SEM reply
        await interaction.channel.send({ embeds: [embed] });
    }
});

client.login(TOKEN);
