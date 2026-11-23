
function createAgendaService({
  fetchImpl = fetch,
  apiKey = process.env.GEMINI_API_KEY,
  timeoutMs = 8000
} = {}) {
  async function suggest({ course, topic }) {
    const fallback = {
      title: '',
      agenda: [],
      note: 'AI suggestions are unavailable. Please enter the session details manually.'
    };

    if (!apiKey) {
      return fallback;
    }

    if (!course || !topic) {
      return fallback;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `For a study session in ${course} about ${topic}, suggest a short title and exactly three agenda points. Return only JSON with this format: {"title":"...","agenda":["...","...","..."]}`
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        return fallback;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return fallback;
      }

      const cleaned = text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleaned);

      if (
        typeof result.title !== 'string' ||
        !Array.isArray(result.agenda) ||
        result.agenda.length !== 3 ||
        !result.agenda.every(item => typeof item === 'string')
      ) {
        return fallback;
      }

      return {
        title: result.title,
        agenda: result.agenda,
        note: ''
      };
    } catch (err) {
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }

  return { suggest };
}

module.exports = { createAgendaService };
