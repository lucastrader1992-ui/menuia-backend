const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateContent(photoDescription, restaurantName, dishName, price, tone) {
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

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });

  const text = completion.choices[0].message.content;
  try {
    return JSON.parse(text);
  } catch (e) {
    return {
      instagram: text,
      whatsapp: text.substring(0, 200),
      short: text.substring(0, 100)
    };
  }
}

async function generatePromotionIdea(inventory, dayOfWeek, weather) {
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

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
  });

  const text = completion.choices[0].message.content;
  try {
    return JSON.parse(text);
  } catch (e) {
    return { title: 'Promoção do Dia', description: text, price: '', whatsappText: text };
  }
}

module.exports = { generateContent, generatePromotionIdea };
