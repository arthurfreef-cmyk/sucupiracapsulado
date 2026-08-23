# Plan: Mangofy Payment Integration

Integration of the Mangofy payment API as requested by the user.

## User Requirements
- Integrate Mangofy payment API.
- Provide necessary information/secrets for Mangofy (Token).

## Proposed Changes

### 1. Security & Configuration
- Add `MANGOFY_TOKEN` to the project's secrets.

### 2. Backend Integration
- Create `src/lib/mangofy.server.ts` to handle Mangofy API communication (Pix generation).
- Create `src/lib/mangofy.functions.ts` as a server function wrapper for frontend calls.

### 3. Frontend Integration
- Update `src/routes/checkout.$kit.tsx` to use Mangofy instead of the current placeholder/error.
- Implement data mapping for Mangofy (customer info, amount, metadata).

## Technical Details
- **API Endpoint:** Mangofy Pix creation endpoint.
- **Payload:** Name, Email, CPF, Phone, Amount (cents), Postback URL.
- **Response:** QR Code (base64) and Pix Copy & Paste code.
