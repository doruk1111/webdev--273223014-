const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');

const lectures = JSON.parse(fs.readFileSync(path.join(__dirname, 'lectures.json'), 'utf8')); /// Reads the file when the lecture.js starts.

function textResult(id, text, isError) {        /// Builds a standart answer.
  return {
    jsonrpc: '2.0',
    id: id,
    result: {
      content: [{ type: 'text', text: text }],
      isError: isError
    }
  };
}
const { describe } = require('node:test');

const tools = [
  {
    name: 'find_lecture',
    description: 'Return the title and topics of one course lecture by its number, 1 to 12. Use it when asked what a lecture covers.',
    /// This is where AI needs to decide when to use this tool
    inputSchema: {
      type: 'object',
      properties: {
        number: { type: 'integer', description: 'Lecture number, 1 to 12' }
      },
      required: ['number']
    }
  },
  {
    name: 'list_lectures',
    description: 'List the number and title of every course lecture. Use it when asked what the course covers.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

function send(reply) {      /// This prints the outcome.
  process.stdout.write(JSON.stringify(reply) + '\n');
}

function handle(message) {    /// This decides what will be the answer.
  if (message.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: message.params.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: 'lectures', version: '0.1.0' }
      }
    };
  }

  if (message.method === 'notifications/initialized') {
    return null;
  }

  if (message.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { tools: tools }  /// We send our list back by using the same ID
    };
  }
  if (message.method === 'tools/call') {
    const name = message.params.name;  /// This is a tool agent which wants to use the input
    const args = message.params.arguments;

    if (name === 'find_lecture') {
      const lecture = lectures.find(function (l) {
        return l.number === args.number;
      });
            if (!lecture) {    /// This makes sure that if we find nothing we return the normal result.
        return textResult(
          message.id,
          'There is no lecture ' + args.number + '. The course has lectures 1 to 12.',
          true
        );
      }
      return textResult(
        message.id,
        'Lecture ' + lecture.number + ': ' + lecture.title + '. Topics: ' + lecture.topics,
        false
      );
    }

    if (name === 'list_lectures') {
      const lines = lectures.map(function (l) {
        return l.number + '. ' + l.title;
      });
      return textResult(message.id, lines.join('\n'), false);
    }

        return {    /// This works when the tool name isn't our own tool, The server sends error message -32606
      jsonrpc: '2.0',
      id: message.id,
      error: { code: -32602, message: 'Unknown tool: ' + name }
    };
  }
  if (message.id !== undefined) {
    return {
      jsonrpc: '2.0',
      id: message.id,
      error: { code: -32601, message: 'Unknown method: ' + message.method }
    };
  }

  return null;
}

const reader = readline.createInterface({ input: process.stdin });

reader.on('line', function (line) {
  console.error('got: ' + line);
  const message = JSON.parse(line);     /// This converts text into object.
  const reply = handle(message);
  if (reply !== null) {
    send(reply);
  }
});