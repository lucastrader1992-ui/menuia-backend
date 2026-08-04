const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function cleanJsonResponse(text) {
  let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  clean = clean.replace(/^\s+|\s+$/g, '');
  return clean;
}

async function generateContent(photoDescription, restaurantName, dishName, price, tone) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

  const prompt = `Você é um especialista em marketing digital para restaurantes no Brasil.
Crie 3 textos diferentes para divulgar este prato:

Restaurante: ${restaurantName}
Prato: ${dishName}
Preço: ${price}
Descrição da foto: ${photoDescription}
Tom de voz: ${tone || 'descontraído e apetitoso'}

Retorne APENAS um JSON válido no formato:
{
  "instagram": "texto para post do Instagram com hashtags",
  "whatsapp": "texto curto e direto para enviar no WhatsApp",
  "short": "texto curto de até 100 caracteres para story/legenda"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleanText = cleanJsonResponse(text);
    return JSON.parse(cleanText);
  } catch (e) {
    return {
      instagram: text,
      whatsapp: text.substring(0, 200),
      short: text.substring(0, 100)
    };
  }
}

async function generatePromotionIdea(inventory, dayOfWeek, weather) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

  const prompt = `Crie uma ideia de promoção para um restaurante hoje.
Dia: ${dayOfWeek}
Clima: ${weather || 'ensolarado'}
Estoque alto: ${inventory || 'carne de sol'}

Retorne JSON:
{
  "title": "nome da promoção",
  "description": "descrição apetitosa",
  "price": "preço sugerido",
  "whatsappText": "texto pronto para mandar no WhatsApp"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleanText = cleanJsonResponse(text);
    return JSON.parse(cleanText);
  } catch (e) {
    return { title: 'Promoção do Dia', description: text, price: '', whatsappText: text };
  }
}

async function generateVideoScript(photoDescription, restaurantName, dishName, price, tone, videoDuration) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

  const prompt = `Você é um diretor de criação especializado em vídeos para Instagram Reels de restaurantes no Brasil.
Crie um roteiro completo para um vídeo de ${videoDuration} segundos divulgando este prato:

Restaurante: ${restaurantName}
Prato: ${dishName}
Preço: ${price}
Descrição da foto: ${photoDescription}
Tom de voz: ${tone || 'descontraído, apetitoso e envolvente'}

Retorne APENAS um JSON válido no formato:
{
  "title": "título do vídeo",
  "hook": "frase de impacto para os primeiros 3 segundos",
  "scenes": [
    {
      "timestamp": "0-3s",
      "visual": "descrição visual do que aparece na tela",
      "text": "texto que aparece na tela",
      "audio": "descrição do som/música"
    }
  ],
  "captions": [
    {"start": "0.0", "end": "3.0", "text": "legenda 1"}
  ],
  "hashtags": "#hashtags para o vídeo",
  "musicSuggestion": {
    "style": "estilo musical recomendado",
    "mood": "clima da música",
    "youtubeLink": "Busque em: youtube.com/audiolibrary/music?search=bossa+nova+upbeat"
  },
  "voiceover": "script completo para narração",
  "callToAction": "frase final de chamada para ação",
  "canvaTemplate": "Template recomendado: Reels Food - Canva (canva.com/templates/search/reels-food/)"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleanText = cleanJsonResponse(text);
    return JSON.parse(cleanText);
  } catch (e) {
    return {
      title: `Vídeo - ${dishName}`,
      hook: `Descubra o ${dishName} do ${restaurantName}!`,
      scenes: [{ timestamp: '0-15s', visual: 'Foto do prato', text: dishName, audio: 'Música animada' }],
      captions: [{ start: '0.0', end: '15.0', text: dishName }],
      hashtags: '#food #restaurante #comida',
      musicSuggestion: { style: 'Bossa Nova Upbeat', mood: 'Alegre', youtubeLink: 'youtube.com/audiolibrary/music' },
      voiceover: `Venha experimentar o ${dishName} no ${restaurantName}!`,
      callToAction: 'Siga @restaurante e reserve sua mesa!',
      canvaTemplate: 'canva.com/templates/search/reels-food/'
    };
  }
}

module.exports = { generateContent, generatePromotionIdea, generateVideoScript };
