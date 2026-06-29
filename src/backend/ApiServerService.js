import http from 'node:http';
import { engine } from '../components/inferenceEngine.js';

export class ApiServerService {
  constructor() {
    this.server = null;
    this.port = 1234; 
  }

  start() {
    if (this.server) return; // Prevent duplicate sockets

    this.server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === 'POST' && req.url === '/v1/chat/completions') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const messages = data.messages || [];
            const isStreaming = data.stream === true;

            const systemMessage = messages.find(m => m.role === 'system')?.content;
            const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';

            if (!lastUserMessage) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: "Missing required user message." }));
              return;
            }

            if (systemMessage) {
              await engine.setPersonality(systemMessage);
            }

            if (isStreaming) {
              res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              });

              const completionId = `chatcmpl-${Date.now()}`;

              await engine.generateResponse(lastUserMessage, (token) => {
                const chunkFrame = {
                  id: completionId,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: data.model || 'local-gguf',
                  choices: [{ index: 0, delta: { content: token }, finish_reason: null }]
                };
                res.write(`data: ${JSON.stringify(chunkFrame)}\n\n`);
              });

              const finalFrame = {
                id: completionId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: data.model || 'local-gguf',
                choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
              };
              res.write(`data: ${JSON.stringify(finalFrame)}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
            } else {
              let cumulativeText = '';
              await engine.generateResponse(lastUserMessage, (token) => {
                cumulativeText += token;
              });

              const structuralResponse = {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: data.model || 'local-gguf',
                choices: [{ index: 0, message: { role: 'assistant', content: cumulativeText }, finish_reason: 'stop' }]
              };

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(structuralResponse));
            }
          } catch (err) {
            console.error("[API Server Error]:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal engine error.", details: err.message }));
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Route not found." }));
      }
    });

    this.server.listen(this.port, () => {
      console.log(`[DukeVanta API Link] Server listening on port ${this.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log("[DukeVanta API Link] Server socket successfully closed.");
    }
  }
}