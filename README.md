# Resilient Email Sending Service

This project implements a resilient email sending service with the following features:

- Retry mechanism with exponential backoff
- Fallback between two email providers
- Idempotency to prevent duplicate sends
- Rate limiting
- Status tracking for email sending attempts
- Circuit breaker pattern
- Simple logging
- Basic queue system

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Send Email

- URL: `POST /api/email/send`
- Body:
  ```json
  {
    "to": "recipient@example.com",
    "subject": "Email Subject",
    "body": "Email Body"
  }
  ```
