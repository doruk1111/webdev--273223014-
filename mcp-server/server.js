const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');
const groupsService = require('../services/groups');
const { getMcpUser } = require('../services/sessionAuth');




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
    name: 'list_groups',
    description: 'Lists open study groups for a course and shows the number of members in each group.',
    inputSchema: {
      type: 'object',
      properties: {
        course: {
          type: 'string',
          description: 'The course name to search for.'
        }
      },
      required: ['course']
    }
  },
  {
    name: 'upcoming_sessions',
    description: 'Lists future study sessions for groups that the signed-in user belongs to.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'join_group',
    description: 'Adds the signed-in user to a study group if they are not already a member.',
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'integer',
          description: 'The ID of the study group to join.'
        }
      },
      required: ['groupId']
    }
  }
];

function send(reply) {      /// This prints the outcome.
  process.stdout.write(JSON.stringify(reply) + '\n');
}

async function handle(message) {    /// This decides what will be the answer.
  if (message.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: message.params.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: 'study-groups', version: '0.1.0' }
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

    if (message.method === 'tools/call') {
  const name = message.params.name;
  const args = message.params.arguments;

  if (name === 'list_groups') {
  try {
    const groups = await groupsService.list(args.course);

    const lines = groups.map(function (group) {
      return group.name + ' | Course: ' + group.course +
        ' | Members: ' + group.member_count;
    });

    return textResult(
      message.id,
      lines.length ? lines.join('\n') : 'No groups found for this course.',
      false
    );
  } catch (err) {
    return textResult(message.id, err.message, true);
  }
}

  if (name === 'upcoming_sessions') {
  try {
    const user = await getMcpUser(); // Identifies the owner
    const sessions = await groupsService.upcomingSessions(user.id);   // Makes sure we are working with right person

    const lines = sessions.map(function (session) {
      return session.group_name +
        ' | Course: ' + session.course +
        ' | Starts: ' + session.start_time +
        ' | Place: ' + (session.place || 'Not specified');
    });

    return textResult(
      message.id,
      lines.length ? lines.join('\n') : 'No upcoming sessions found.',
      false
    );
  } catch (err) {
    return textResult(message.id, err.message, true);
  }
}

if (name === 'join_group') {
  try {
    const user = await getMcpUser(); // User Identifier

    const membership = await groupsService.join(
      args.groupId,   // Shows the group they'd like to join
      user.id
    );

    return textResult(
      message.id,
      'Successfully joined group ' + args.groupId + '.',
      false
    );
  } catch (err) {
    return textResult(message.id, err.message, true);
  }
}


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

reader.on('line', async function (line) {
  console.error('got: ' + line);
  const message = JSON.parse(line);     /// This converts text into object.
  const reply = await handle(message);
  if (reply !== null) {
    send(reply);
  }
});