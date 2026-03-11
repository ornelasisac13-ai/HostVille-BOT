const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// estado da IA
let aiEnabled = false;

// lista de palavras suspeitas
const suspiciousWords = [
  "idiota", "burro", "estúpido", "retardado", "lixo", "imbecil", "inútil",
  "merda", "filho da puta", "fdp", "vai se foder", "vai tomar no cu", "vtnc", "arrombado", "otário", "desgraçado",
  "seu merda", "seu lixo", "seu inútil", "seu retardado",
  "cala a boca", "ninguém gosta de você", "se mata", "vai morrer"
];

// filtro rápido
function quickFilter(text) {
  if (!text) return false;
  const msg = text.toLowerCase();
  return suspiciousWords.some(word => msg.includes(word));
}

// análise com IA
async function analyzeWithAI(text) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Responda apenas TRUE ou FALSE.
A mensagem abaixo contém insulto, ameaça ou discurso de ódio?
Mensagem:
${text}`
    });
    const result = response.output_text.trim().toLowerCase();
    return result.includes("true");
  } catch (err) {
    console.log("❌ ERRO NA IA:", err);
    return false;
  }
}

// verificação final
async function isOffensive(text) {
  if (!aiEnabled) return false;
  if (!text || text.length < 5) return false;
  if (!quickFilter(text)) return false;
  const result = await analyzeWithAI(text);
  if (result) console.log("⚠️ Mensagem ofensiva detectada:", text);
  return result;
}

// ativar IA
function enableAI(user = "Sistema") {
  try {
    aiEnabled = true;
    console.log("\n🧠 ================================");
    console.log("🧠 IA DE MODERAÇÃO ATIVADA");
    console.log("👤 Ativado por:", user);
    console.log("🧠 ================================\n");
    return true;
  } catch (err) {
    console.log("❌ ERRO AO ATIVAR IA:", err);
    return false;
  }
}

// desativar IA
function disableAI(user = "Sistema") {
  try {
    aiEnabled = false;
    console.log("\n🛑 ================================");
    console.log("🛑 IA DE MODERAÇÃO DESATIVADA");
    console.log("👤 Desativado por:", user);
    console.log("🛑 ================================\n");
    return true;
  } catch (err) {
    console.log("❌ ERRO AO DESATIVAR IA:", err);
    return false;
  }
}

// status da IA
function getAIStatus() {
  return aiEnabled;
}

// criar comandos de IA
function getAICommands() {
  return [
    new SlashCommandBuilder()
      .setName("activeai")
      .setDescription("Ativa a IA de moderação")
      .addStringOption(option =>
        option.setName("code")
              .setDescription("Código de acesso")
              .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("desactiveai")
      .setDescription("Desativa a IA de moderação")
      .addStringOption(option =>
        option.setName("code")
              .setDescription("Código de acesso")
              .setRequired(true)
      )
  ];
}

// lidar com interações da IA
async function handleAICommand(interaction, ACCESS_CODE) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, user } = interaction;
  const code = options.getString("code");

  if (code !== ACCESS_CODE) {
    await interaction.reply({ content: "❌ Código inválido.", ephemeral: true });
    console.log(`⚠️ ${user.tag} tentou usar ${commandName} com código incorreto.`);
    return;
  }

  if (commandName === "activeai") {
    const success = enableAI(user.tag);
    await interaction.reply({ content: success ? "🧠 IA ativada!" : "❌ Erro ao ativar IA." });
  }

  if (commandName === "desactiveai") {
    const success = disableAI(user.tag);
    await interaction.reply({ content: success ? "🛑 IA desativada!" : "❌ Erro ao desativar IA." });
  }
}

module.exports = {
  isOffensive,
  enableAI,
  disableAI,
  getAIStatus,
  getAICommands,
  handleAICommand
};
