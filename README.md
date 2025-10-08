# WhatsApp Webhook + Auto Reply

This service receives WhatsApp webhook events, prints them in a structured format, and replies "Thank you" to incoming user messages using the WhatsApp Cloud API.

## Setup

- Create a `.env` file (already present):

PORT=5000
VERIFY_TOKEN=your_verify_token
API_VERSION=v23.0
PHONE_NUMBER_ID=821504461048183
TEMPORARY_ACCESS_TOKEN=your_access_token

- Install deps and run:

npm install
npm run dev

## How it works

- `server.js` handles webhook verification (GET /) and events (POST /).
- Incoming payloads are parsed into events; details are logged.
- For message events, the app sends a "Thank you" reply to the sender using `services/whatsappService.js`.

## Notes

- Ensure your Meta App webhook is set to POST to your server's public URL.
- Keep your access token secure. Rotate regularly.
