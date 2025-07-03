import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { Response } from 'express';

@Controller({
  path: '/',
  version: VERSION_NEUTRAL,
})
export class RootController {
  @Get()
  root(@Res() res: Response) {
    res.type('html').send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SWD-BE API</title>
        <style>
          body {
            background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #22223b;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(34,34,59,0.08);
            padding: 48px 32px;
            text-align: center;
            max-width: 420px;
          }
          h1 {
            color: #3a86ff;
            margin-bottom: 16px;
            font-size: 2.2rem;
          }
          p {
            margin-bottom: 24px;
            font-size: 1.1rem;
          }
          a {
            display: inline-block;
            background: #3a86ff;
            color: #fff;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            transition: background 0.2s;
          }
          a:hover {
            background: #265d97;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to SWD-BE API</h1>
          <p>This is the backend service for the AI Chatbot project.<br>
          For API documentation, visit the link below:</p>
          <a href="/api/docs">Go to API Docs</a>
        </div>
      </body>
      </html>
    `);
  }
}
