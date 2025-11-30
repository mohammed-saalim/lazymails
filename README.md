# LazyMails

A Chrome extension that generates personalized cold emails from LinkedIn profiles using AI.

## Overview

LazyMails analyzes LinkedIn profiles and uses Google Gemini AI to generate personalized cold emails. The extension identifies genuine connections between you and the recipient (shared companies, education, skills) and crafts tailored outreach messages.

## Features

- Four email generation styles: Default, Minimal, About Them, and Custom
- Automatic LinkedIn profile data extraction
- User profile system for personalized sender information
- Email history dashboard with status tracking
- JWT-based authentication
- Secure password storage with BCrypt

## Technology Stack

**Backend**
- ASP.NET Core 9.0
- PostgreSQL with Entity Framework Core
- Google Gemini API
- JWT Authentication

**Frontend**
- Chrome Extension (Manifest V3)
- Vanilla JavaScript
- HTML/CSS

## Prerequisites

- .NET 9.0 SDK
- PostgreSQL database or Supabase account
- Google Gemini API key
- Chrome browser

## Installation

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/mohammed-saalim/lazymails.git
cd lazymails/backend/ColdEmailAPI
```

2. Configure application settings:
```bash
cp appsettings.Example.json appsettings.json
```

Edit `appsettings.json` with your credentials:
- Database connection string
- Gemini API key
- JWT secret key

3. Apply database migrations:
```bash
dotnet ef database update
```

4. Run the application:
```bash
dotnet run
```

The API will be available at `http://localhost:5148`

### Chrome Extension Setup

1. Update the API endpoint in `extension/config.js` if needed.

2. Load the extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `extension` folder

3. Use the extension:
   - Navigate to any LinkedIn profile
   - Click the LazyMails icon
   - Register or login
   - Complete your profile
   - Generate emails

## Email Generation Styles

**Default**
Comprehensive email that identifies connections between sender and recipient. Approximately 150 words.

**Minimal**
Direct referral request. Approximately 80 words.

**About Them**
Focuses on learning from the recipient's experience. Approximately 120 words.

**Custom**
User-defined prompt for complete customization.

## Project Structure

```
lazymails/
├── backend/ColdEmailAPI/
│   ├── Controllers/          API endpoints
│   ├── Models/               Data models and DTOs
│   ├── Services/             Business logic
│   ├── Data/                 Database context
│   └── Program.cs            Application configuration
├── extension/
│   ├── popup.html/js/css     Extension popup interface
│   ├── dashboard.html        Email history dashboard
│   ├── profile.html          User profile management
│   ├── content.js            LinkedIn data extraction
│   └── manifest.json         Extension configuration
└── README.md
```

## Deployment

### Backend Deployment (Railway)

1. Push code to GitHub
2. Create a new project on Railway
3. Connect your GitHub repository
4. Set environment variables:
   - `ConnectionStrings__DefaultConnection`
   - `GeminiApi__ApiKey`
   - `Jwt__Key`
   - `Jwt__Issuer`
   - `Jwt__Audience`
5. Deploy

### Extension Publication

1. Update `extension/config.js` with production API URL
2. Update `extension/manifest.json` host permissions
3. Create Chrome Web Store developer account
4. Prepare store assets and privacy policy
5. Submit for review

Detailed deployment instructions are available in `DEPLOYMENT.md`.

## API Endpoints

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

**Email Generation**
- `POST /api/email/generate` - Generate cold email

**Email History**
- `GET /api/history` - Retrieve email history
- `PUT /api/history/{id}` - Update email status
- `DELETE /api/history/{id}` - Delete email record

**User Profile**
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create or update profile

## Configuration

Environment variables for production:

```
ConnectionStrings__DefaultConnection=<postgres-connection-string>
GeminiApi__ApiKey=<gemini-api-key>
Jwt__Key=<jwt-secret-key>
Jwt__Issuer=LazyMails
Jwt__Audience=LazyMails
```

## License

MIT License

## Author

Mohammed Saalim K
- GitHub: [@mohammed-saalim](https://github.com/mohammed-saalim)
- LinkedIn: [Mohammed Saalim K](https://www.linkedin.com/in/mohammed-saalim-k/)
