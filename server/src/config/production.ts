export default {
  cors: {
    origin: process.env.CLIENT_URL || 'https://your-frontend-url.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },
  socket: {
    path: '/socket.io',
    cors: {
      origin: process.env.CLIENT_URL || 'https://your-frontend-url.vercel.app',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  },
  server: {
    port: process.env.PORT || 3001,
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@webchat.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },
};
