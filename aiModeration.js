const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

// estado da IA
let aiEnabled = false;

// lista de palavras suspeitas
const suspiciousWords = [

  // insultos
  "idiota",
  "burro",
  "estúpido",
  "retardado",
  "lixo",
  "imbecil",
  "inútil",

  // xingamentos
  "merda",
  "filho da puta",
  "fdp",
  "vai se foder",
  "vai tomar no cu",
  "vtnc",
  "arrombado",
  "otário",
  "desgraçado",

  // ofensas diretas
  "seu merda",
  "seu lixo",
  "seu inútil",
  "seu retardado",

  // agressões
  "cala a boca",
  "ninguém gosta de você",
  "se mata",
  "vai morrer"
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

    const result = response.output_text
      .trim()
      .toLowerCase();

    return result.includes("true");

  } catch (err) {

    console.log("❌ ERRO NA IA:");
    console.log(err);

    return false;

  }

}

// verificação final
async function isOffensive(text) {

  try {

    if (!aiEnabled) return false;

    if (!text || text.length < 5) return false;

    if (!quickFilter(text)) return false;

    const result = await analyzeWithAI(text);

    if (result) {
      console.log("⚠️ Mensagem ofensiva detectada:", text);
    }

    return result;

  } catch (err) {

    console.log("❌ ERRO NA VERIFICAÇÃO DE MENSAGEM:", err);
    return false;

  }

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

module.exports = {

  isOffensive,
  enableAI,
  disableAI,
  getAIStatus

};
