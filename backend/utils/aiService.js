const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Analyze financial news
const analyzeWithAI = async (articleContent) => {
  try {

    const prompt = `
You are a professional financial analyst AI.

Analyze this news article and return ONLY valid JSON.

Article:
${articleContent.slice(0, 3000)}

JSON format:
{
  "summary": "short summary",
  "impact": "market impact",
  "sentiment": "Bullish",
  "confidence": 0.82,
  "key_points": ["point1", "point2"],
  "related_symbols": ["AAPL"]
}

Rules:
- sentiment must be Bullish, Bearish, or Neutral
- no markdown
- no extra text
`;

    const response =
      await client.chat.completions.create({

        model: 'deepseek/deepseek-chat',

        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],

        temperature: 0.3,
      });

    const text =
      response.choices[0].message.content.trim();

    console.log('AI RESPONSE:', text);

    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      summary:
        parsed.summary ||
        'Summary unavailable',

      impact:
        parsed.impact ||
        'Impact unavailable',

      sentiment:
        parsed.sentiment || 'Neutral',

      confidence:
        parsed.confidence || 0.7,

      key_points:
        parsed.key_points || [],

      related_symbols:
        parsed.related_symbols || [],
    };

  } catch (err) {

    console.error(
      'OPENROUTER ERROR:',
      err.response?.data || err.message
    );

    return {
      summary:
        'AI analysis temporarily unavailable.',

      impact:
        'Unable to generate analysis.',

      sentiment:
        'Neutral',

      confidence:
        0.5,

      key_points: [],

      related_symbols: [],
    };
  }
};

// Chatbot
const chatWithAI = async (
  message,
  portfolioContext = [],
  history = []
) => {

  try {

    const response =
      await client.chat.completions.create({

        model: 'deepseek/deepseek-chat',

        messages: [
          {
            role: 'system',
            content:
              'You are a helpful financial assistant.'
          },
          {
            role: 'user',
            content: message
          }
        ],

        temperature: 0.5,
      });

    return response
      .choices[0]
      .message
      .content;

  } catch (err) {

    console.log(err);

    return 'AI chat unavailable.';
  }
};

module.exports = {
  analyzeWithAI,
  chatWithAI
};