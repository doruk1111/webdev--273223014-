
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAgendaService } = require('../services/agenda');

test('AC-8: missing API key returns a manual-entry fallback', async () => {
  const service = createAgendaService({
    apiKey: '',
    fetchImpl: async () => {
      throw new Error('Fetch should not be called');
    }
  });

  const result = await service.suggest({
    course: 'CS101',
    topic: 'Arrays'
  });

  assert.strictEqual(result.title, '');
  assert.strictEqual(result.agenda.length, 0);
  assert.ok(result.note.length > 0);
});

test('fake Gemini client returns a title and three agenda points', async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              title: 'Understanding Arrays',
              agenda: [
                'Introduction to arrays',
                'Array operations',
                'Practical exercises'
              ]
            })
          }]
        }
      }]
    })
  });

  const service = createAgendaService({
    apiKey: 'fake-key',
    fetchImpl: fakeFetch
  });

  const result = await service.suggest({
    course: 'CS101',
    topic: 'Arrays'
  });

  assert.strictEqual(result.title, 'Understanding Arrays');
  assert.strictEqual(result.agenda.length, 3);
  assert.strictEqual(result.note, '');
});

test('provider failure returns a manual-entry fallback', async () => {
  const service = createAgendaService({
    apiKey: 'fake-key',
    fetchImpl: async () => {
      throw new Error('Provider unavailable');
    }
  });

  const result = await service.suggest({
    course: 'CS101',
    topic: 'Arrays'
  });

  assert.strictEqual(result.title, '');
  assert.strictEqual(result.agenda.length, 0);
  assert.ok(result.note.length > 0);
});


test('provider timeout returns a manual-entry fallback', async () => {
  const service = createAgendaService({
    apiKey: 'fake-key',
    timeoutMs: 20,
    fetchImpl: (_url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('Request timed out');
        error.name = 'AbortError';
        reject(error);
      });
    })
  });

  const result = await service.suggest({
    course: 'CS101',
    topic: 'Arrays'
  });

  assert.strictEqual(result.title, '');
  assert.strictEqual(result.agenda.length, 0);
  assert.ok(result.note.length > 0);
});
