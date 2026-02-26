# Sindí - Power Outage Tracker

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-lightgrey)

_Stay informed. Stay illuminated._

## Overview

Sindí is an intelligent, real-time power outage tracking application designed to keep residents in the Philippines informed about electricity interruptions.

The application solves the problem of unreliable or hard-to-find power outage advisories by actively scraping public Facebook announcements from local electric cooperatives (like NORDECO). It utilizes artificial intelligence (Llama 3.1 via NVIDIA NIM) to read unstructured text posts, automatically extract structured outage details (type, dates, affected areas, reasons), and deliver targeted push notifications to affected users.

**Target Users:** Residents, businesses, and local government units within the franchise areas of targeted electric cooperatives.

### Key Features

- **AI-Powered Scraping:** Automatically reads and understands unstructured Facebook text announcements.
- **Real-time Alerts:** Sends targeted push notifications to users based on their selected barangays.
- **Interactive Map:** Visualizes currently affected areas on a map interface.
- **Historical Data:** Maintains a history of past outages for reference and pattern observation.
- **Automated Updates:** Runs autonomously in the cloud using a scheduled background worker.

## Tech Stack

The project is divided into a backend API and a mobile frontend application.

- **Backend:** Python, FastAPI, Playwright (for web scraping), BeautifulSoup4, APScheduler, SQLAlchemy
- **Database:** PostgreSQL (hosted on Railway)
- **AI Integration:** Llama 3.1 70B (via NVIDIA NIM API)
- **Frontend Mobile App:** React Native, Expo, NativeWind (TailwindCSS for React Native), Expo Notifications
- **Deployment:** Railway (Backend), Expo Application Services / EAS (Android APK Build)

## Installation

### Prerequisites

- Node.js (v18+)
- Python (3.12+)
- PostgreSQL installed locally or via a cloud provider
- Expo CLI (`npm install -g expo-cli`)

### Clone the Repository

```bash
git clone https://github.com/marmalade1124/Sindi.git
cd Sindi
```

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install Python dependencies:
    ```bash
    python -m venv venv
    source venv/Scripts/activate  # Or `venv\Scripts\activate` on Windows
    pip install -r requirements.txt
    ```
3.  Install Playwright browsers:
    ```bash
    playwright install chromium
    ```

### Frontend Setup

1.  Navigate to the app directory:
    ```bash
    cd sindi-app
    ```
2.  Install Node dependencies:
    ```bash
    npm install
    ```

### Environment Variable Setup

**Backend (`backend/.env`):**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/sindi
NVIDIA_API_KEY=your_nvidia_nim_api_key
FB_C_USER=your_facebook_c_user_cookie
FB_XS=your_facebook_xs_cookie
```

**Frontend (`sindi-app/.env`):**

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

## Usage

### Running the Backend (Development)

Start the local FastAPI server. The APScheduler will automatically begin polling for outages.

```bash
cd backend
uvicorn app.main:app --reload
```

### Running the Frontend (Development)

Start the Expo development server. Use the Expo Go app on your phone or an emulator to test.

```bash
cd sindi-app
npx expo start
```

### Example API Usage

Fetch the latest recorded outages:

```bash
curl -X GET "http://localhost:8000/api/outages" \
     -H "Content-Type: application/json"
```

## Project Structure

```text
Sindi/
│
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── api/              # API Route definitions
│   │   ├── core/             # Configuration and database setup
│   │   ├── models/           # SQLAlchemy DB Models
│   │   └── services/         # Scraping logic and AI engine integration
│   ├── worker.py             # APScheduler background tasks
│   └── requirements.txt      # Python dependencies
│
└── sindi-app/                # React Native Expo App
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── navigation/       # React Navigation setup
    │   ├── screens/          # Main application screens (Home, Map, Settings)
    │   └── services/         # API client and Push Notification handlers
    ├── app.json              # Expo configuration
    └── package.json          # Node dependencies
```

## Configuration

The application is primarily configured through environment variables.

- Warning: The scraper relies on active Facebook session cookies (`FB_C_USER`, `FB_XS`). These cookies may expire over time and require manual updating in the `.env` file or cloud secrets manager.

## Contributing

Contributions make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Author

**Raziel Renz C. Salamat**  
4th Year Computer Engineering  
UM Tagum College, Philippines
