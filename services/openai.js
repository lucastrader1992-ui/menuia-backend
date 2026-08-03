const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateContent(photoDescription, restaurantName, dishName, price, tone) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

  // Tenta extrair JSON da resposta
  try {
    // Remove markdown code blocks se existirem
    const cleanText = text.replace(/```json
?/g, '').replace(/```
?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    // Fallback: retorna o texto como está
    return {
      instagram: text,
      whatsapp: text.substring(0, 200),
      short: text.substring(0, 100)
    };
  }
}

async function generatePromotionIdea(inventory, dayOfWeek, weather) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
    const cleanText = text.replace(/```json
?/g, '').replace(/```
?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return { title: 'Promoção do Dia', description: text, price: '', whatsappText: text };
  }
}

module.exports = { generateContent, generatePromotionIdea };
