import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';

interface StaticRouteParams {
  '*': string;
}

export async function staticRoutes(fastify: FastifyInstance) {
  const publicPath = path.join(process.cwd(), 'public');

  fastify.get<{ Params: StaticRouteParams }>(
    '/*',
    async (request: FastifyRequest<{ Params: StaticRouteParams }>, reply: FastifyReply) => {
      const filePath = request.params['*'];
      const fullPath = path.join(publicPath, filePath);

      if (!fullPath.startsWith(publicPath)) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      try {
        const data = await fs.promises.readFile(fullPath);
        const ext = path.extname(filePath).toLowerCase();

        const contentTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.ogg': 'audio/ogg',
          '.m4a': 'audio/mp4',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.json': 'application/json',
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';
        reply.header('Content-Type', contentType);
        return reply.send(data);
      } catch (error) {
        return reply.code(404).send({ error: 'File not found' });
      }
    }
  );

  fastify.get('/', async () => {
    return {
      success: true,
      data: {
        message: 'Static file server is running',
        publicPath,
        usage: 'Append file path to URL, e.g. /images/logo.png',
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp3', 'wav', 'ogg', 'mp4', 'webm'],
      },
    };
  });
}
