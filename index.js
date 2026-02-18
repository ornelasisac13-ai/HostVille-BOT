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
    console.log("====================================");
    console.log("🤖 BOT ONLINE");
    console.log(`👤 ${client.user.tag}`);
    console.log(`🆔 ${client.user.id}`);
    console.log("====================================");

    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    console.log(`📌 /${interaction.commandName} | ${interaction.user.tag}`);

    // ========= /RULE =========
    if (interaction.commandName === 'rule') {

        await interaction.deferReply({ flags: 64 });

        const embed = new EmbedBuilder()
            .setColor(0x89CFF0)
            .setImage("https://image2url.com/r2/default/images/1771453214746-e642e4a3-1aba-4eae-bd21-07e118149345.jpg")
            .setTitle("📜 Regras e Diretrizes - HostVille Greenville RP")
            .setDescription(`
As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso, respeitando os demais jogadores, a staff e as diretrizes do servidor.

🤖 **AutoMod**
Sistema ativo 24h contra spam, flood, palavras proibidas, links suspeitos e comportamentos fora das regras.

⚠️ **Blacklist**
Estar na blacklist significa proibição total de participação no servidor.
Pode ocorrer por:
• Burlar regras ou punições
• Uso de exploits, bugs ou vantagens indevidas
• Contas alternativas para contornar sanções
• Atitudes que prejudiquem o servidor

🔒 **Segurança e Integridade**
É proibido burlar ou violar regras do Discord ou do servidor.
Exploit, bugs, contas alternativas ou automações ilegais são proibidas.

✅ **Regras Oficiais**
⚠️ Advertência | ❌ Kick | ⛔ Banimento  
Respeite a simulação e colabore com todos.

🚦 **Regras de Trânsito**
• Máx. 85 MPH
• Respeite sinalizações
• Use setas ao virar
• Pare em STOP e sinal vermelho

⚖️ **Leis Gerais**
• ❌ Proibido vandalismo, roubo ou armas sem permissão da staff
• 🚫 Não cause caos em áreas públicas sem combinar

🎭 **Roleplay (RP)**
• Siga a história do seu personagem
• Crie nome, profissão, personalidade
• ❌ Proibido Trollar
• ❌ Power-Gaming
• ❌ Fail-RP
• 🕒 NLR: aguarde 3 minutos após morte/prisão

💼 **Trabalho e Economia**
• 👷 1 trabalho por sessão
• 💰 Salários apenas pelo sistema oficial
• 🚫 Proibido dinheiro fora de eventos da staff

🗣️ **Comunicação**
• 🤝 Fale com respeito
• 🎙️ Voz apenas em emergências
• 📱 Use telefone do jogo para distância
• 💬 Use // para falar fora do RP
Exemplo: // minha internet caiu rapidão

🔗 **Links Oficiais**
[Política de Privacidade](https://nativo-00.gitbook.io/hostville-bot-privacy-policy/)  
[Termos de Uso](https://nativo-00.gitbook.io/hostville-bot-terms/)

━━━━━━━━━━━━━━━━━━━━
✨ Powered by Y2k_Nat
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
            )
            .setFooter({ text: "HostVille Greenville RP" });

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
});

client.login(TOKEN);
