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
const GUILD_ID = "928614664840052757";
const ACCESS_CODE = process.env.ACCESS_CODE;

if (!TOKEN) {
    console.error("❌ TOKEN não definido!");
    process.exit(1);
}

if (!ACCESS_CODE) {
    console.error("❌ ACCESS_CODE não definido!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites
    ]
});

// ========= COMANDOS =========
const commands = [
    new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Exibe as regras do servidor')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Digite o código de acesso')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Mostra informações do bot')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        console.log("⏳ Registrando comandos...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log("✅ Comandos registrados instantaneamente no servidor!");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }
}

client.once('clientReady', async () => {
    console.log("====================================");
    console.log("🤖 BOT ONLINE");
    console.log(`👤 ${client.user.tag}`);
    console.log(`🆔 ${client.user.id}`);
    console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
    console.log("====================================");

    await registerCommands();

    console.log(" ");
    console.log("═══════════════════════════════════");
    console.log("  Todos os Serviços Foram Carregados com Sucesso✅️");
    console.log("═══════════════════════════════════");
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    console.log(`📌 Comando recebido: /${interaction.commandName}`);
    console.log(`   👤 Usuário: ${interaction.user.tag} (${interaction.user.id})`);
    console.log(`   📺 Canal: ${interaction.channel.name} (${interaction.channel.id})`);
    console.log(`   🏠 Servidor: ${interaction.guild.name}`);

    try {
        // ========= /RULE =========
        if (interaction.commandName === 'rule') {
            console.log("   🔐 Verificando código de acesso...");

            const codigoDigitado = interaction.options.getString('code');

            if (codigoDigitado !== ACCESS_CODE) {
                console.log("   ❌ Código incorreto digitado");
                return interaction.reply({
                    content: "❌ Código de acesso inválido.",
                    flags: 64
                });
            }

            console.log("   ✅ Código correto! Enviando regras...");
            await interaction.deferReply({ flags: 64 });

            const embed = new EmbedBuilder()
                .setColor(0x89CFF0)
                .setTitle("📜 Regras - HostVille Greenville RP")
                .setDescription(`
As regras gerais têm como objetivo garantir a ordem, o respeito e a boa convivência entre todos.

➤ Ao participar do HostVille Greenville RP, você concorda em agir com educação, responsabilidade e bom senso.

━━━━━━━━━━━━━━━━━━━━

📘 **Para mais informações sobre as regras, visite o documento abaixo:**

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
            await interaction.deleteReply();
            console.log("   ✅ Regras enviadas com sucesso!");
        }

        // ========= /INFO =========
        if (interaction.commandName === 'info') {
            console.log("   📊 Coletando informações do bot...");

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
            console.log("   ✅ Informações enviadas!");
        }
    } catch (error) {
        console.error("❌ Erro ao executar comando:", error);
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: "⚠️ Ocorreu um erro ao executar este comando. Tente novamente.", 
                    flags: 64 
                });
            } else {
                await interaction.reply({ 
                    content: "⚠️ Ocorreu um erro ao executar este comando. Tente novamente.", 
                    flags: 64 
                });
            }
        } catch (e) {
            console.error("❌ Erro ao enviar mensagem de erro:", e);
        }
    }
});

// ========= EVENTOS DE MONITORAMENTO =========

// Novo membro entrou
client.on('guildMemberAdd', (member) => {
    console.log(`👋 Novo membro entrou: ${member.user.tag} (${member.user.id})`);
    console.log(`   📊 Membros totais: ${member.guild.memberCount}`);
    console.log(`   🏠 Servidor: ${member.guild.name}`);
});

// Membro saiu
client.on('guildMemberRemove', (member) => {
    console.log(`👋 Membro saiu: ${member.user.tag} (${member.user.id})`);
    console.log(`   📊 Membros restantes: ${member.guild.memberCount}`);
    console.log(`   🏠 Servidor: ${member.guild.name}`);
});

// Nova mensagem
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    console.log(`💬 Nova mensagem de ${message.author.tag}`);
    console.log(`   📺 Canal: #${message.channel.name}`);
    console.log(`   📝 Conteúdo: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`);
});

// Mensagem deletada
client.on('messageDelete', (message) => {
    if (message.author.bot) return;
    console.log(`🗑️ Mensagem deletada de ${message.author.tag}`);
    console.log(`   📺 Canal: #${message.channel.name}`);
    console.log(`   📝 Conteúdo: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`);
});

// Mensagem editada
client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author.bot) return;
    console.log(`✏️ Mensagem editada por ${oldMessage.author.tag}`);
    console.log(`   📺 Canal: #${oldMessage.channel.name}`);
    console.log(`   📝 Antes: ${oldMessage.content.substring(0, 100)}${oldMessage.content.length > 100 ? '...' : ''}`);
    console.log(`   📝 Depois: ${newMessage.content.substring(0, 100)}${newMessage.content.length > 100 ? '...' : ''}`);
});

// Canal criado
client.on('channelCreate', (channel) => {
    console.log(`📁 Canal criado: #${channel.name} (${channel.type})`);
    console.log(`   🏠 Servidor: ${channel.guild.name}`);
});

// Canal deletado
client.on('channelDelete', (channel) => {
    console.log(`📁 Canal deletado: #${channel.name} (${channel.type})`);
    console.log(`   🏠 Servidor: ${channel.guild.name}`);
});

// Canal atualizado
client.on('channelUpdate', (oldChannel, newChannel) => {
    console.log(`📁 Canal atualizado: #${oldChannel.name}`);
    console.log(`   🏠 Servidor: ${oldChannel.guild.name}`);
});

// Cargo criado
client.on('roleCreate', (role) => {
    console.log(`🎭 Cargo criado: ${role.name}`);
    console.log(`   🏠 Servidor: ${role.guild.name}`);
});

// Cargo deletado
client.on('roleDelete', (role) => {
    console.log(`🎭 Cargo deletado: ${role.name}`);
    console.log(`   🏠 Servidor: ${role.guild.name}`);
});

// Cargo atualizado
client.on('roleUpdate', (oldRole, newRole) => {
    console.log(`🎭 Cargo atualizado: ${oldRole.name} → ${newRole.name}`);
    console.log(`   🏠 Servidor: ${oldRole.guild.name}`);
});

// Usuário banido
client.on('guildBanAdd', (ban) => {
    console.log(`🔨 Usuário banido: ${ban.user.tag} (${ban.user.id})`);
    console.log(`   🏠 Servidor: ${ban.guild.name}`);
});

// Banimento removido (desbanido)
client.on('guildBanRemove', (ban) => {
    console.log(`✅ Usuário desbanido: ${ban.user.tag} (${ban.user.id})`);
    console.log(`   🏠 Servidor: ${ban.guild.name}`);
});

// Invite criado
client.on('inviteCreate', (invite) => {
    console.log(`🔗 Invite criado: ${invite.url}`);
    console.log(`   👤 Criado por: ${invite.inviter.tag}`);
    console.log(`   📺 Canal: ${invite.channel.name}`);
    console.log(`   🏠 Servidor: ${invite.guild.name}`);
});

// Invite deletado
client.on('inviteDelete', (invite) => {
    console.log(`🔗 Invite deletado: ${invite.url}`);
    console.log(`   📺 Canal: ${invite.channel.name}`);
    console.log(`   🏠 Servidor: ${invite.guild.name}`);
});

// Emoji criado
client.on('emojiCreate', (emoji) => {
    console.log(`😀 Emoji criado: ${emoji.name}`);
    console.log(`   📎 URL: ${emoji.url}`);
    console.log(`   🏠 Servidor: ${emoji.guild.name}`);
});

// Emoji deletado
client.on('emojiDelete', (emoji) => {
    console.log(`😀 Emoji deletado: ${emoji.name}`);
    console.log(`   🏠 Servidor: ${emoji.guild.name}`);
});

// Sticker criado
client.on('stickerCreate', (sticker) => {
    console.log(`📦 Sticker criado: ${sticker.name}`);
    console.log(`   🏠 Servidor: ${sticker.guild.name}`);
});

// Sticker deletado
client.on('stickerDelete', (sticker) => {
    console.log(`📦 Sticker deletado: ${sticker.name}`);
    console.log(`   🏠 Servidor: ${sticker.guild.name}`);
});

// Estado de voz atualizado
client.on('voiceStateUpdate', (oldState, newState) => {
    const member = oldState.member || newState.member;
    if (!member) return;
    
    // Usuário entrou em call de voz
    if (!oldState.channelId && newState.channelId) {
        console.log(`🎤 ${member.user.tag} entrou no canal de voz`);
        console.log(`   🔊 Canal: ${newState.channel.name}`);
        console.log(`   🏠 Servidor: ${newState.guild.name}`);
    }
    // Usuário saiu da call de voz
    else if (oldState.channelId && !newState.channelId) {
        console.log(`🎤 ${member.user.tag} saiu do canal de voz`);
        console.log(`   🔊 Canal: ${oldState.channel.name}`);
        console.log(`   🏠 Servidor: ${oldState.guild.name}`);
    }
    // Usuário mudou de canal de voz
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        console.log(`🎤 ${member.user.tag} mudou de canal de voz`);
        console.log(`   🔊 De: ${oldState.channel.name} → Para: ${newState.channel.name}`);
        console.log(`   🏠 Servidor: ${newState.guild.name}`);
    }
});

// ========= EVENTOS DE CONEXÃO =========
client.on('disconnect', () => {
    console.log("⚠️ Bot desconectado do Discord!");
});

client.on('reconnecting', () => {
    console.log("🔄 Tentando reconectar ao Discord...");
});

client.on('error', (error) => {
    console.error("❌ Erro na conexão do bot:", error);
});

client.login(TOKEN);

// ========= TRATAMENTO DE ERROS =========
process.on('unhandledRejection', (reason, promise) => {
    console.error("❌ Promise rejeitada não tratada:", reason);
});

process.on('uncaughtException', (error) => {
    console.error("❌ Exceção não tratada:", error);
    process.exit(1);
});
```

---

## O que foi adicionado:

### ✅ Intents (permissões do bot)
- `GatewayIntentBits.Guilds`
- `GatewayIntentBits.GuildMembers`
- `GatewayIntentBits.GuildMessages`
- `GatewayIntentBits.GuildMessageTyping`
- `GatewayIntentBits.GuildVoiceStates`
- `GatewayIntentBits.GuildInvites`

### 📋 Eventos de Monitoramento (todos os que mencionamos)
- `guildMemberAdd` — Novo membro
- `guildMemberRemove` — Membro saiu
- `messageCreate` — Nova mensagem
- `messageDelete` — Mensagem deletada
- `messageUpdate` — Mensagem editada
- `channelCreate` — Canal criado
- `channelDelete` — Canal deletado
- `channelUpdate` — Canal atualizado
- `roleCreate` — Cargo criado
- `roleDelete` — Cargo deletado
- `roleUpdate` — Cargo atualizado
- `guildBanAdd` — Usuário banido
- `guildBanRemove` — Usuário desbanido
- `inviteCreate` — Invite criado
- `inviteDelete` — Invite deletado
- `emojiCreate` — Emoji criado
- `emojiDelete` — Emoji deletado
- `stickerCreate` — Sticker criado
- `stickerDelete` — Sticker deletado
- `voiceStateUpdate` — Entrada/saída/mudança de call








