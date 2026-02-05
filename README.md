# Audius Clone - Microservices Backend

A direct-to-artist music streaming platform inspired by Audius, built with a microservices architecture using Node.js, Express, PostgreSQL, MongoDB, and pnpm workspaces. 

## Features
- **User & Merchant Accounts**: Separate roles for listeners and artists.
- **Music Catalog**: Integration with the Audius API and local database support for albums/playlists.
- **Direct Payments**: Wallet funding, tipping, and withdrawals via Flutterwave.
- **Social Graph**: Following, likes, reposts, and activity feeds.
- **Streaming**: Range-supported audio streaming with playback limits.
- **Analytics & Recommendations**: Artist performance metrics and personalized content discovery.

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Docker & Docker Compose**: For PostgreSQL, MongoDB, and Redis
- **Flutterwave Account**: (Optional) For live payment testing (requires API keys)

### Step-by-Step Guide
1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/audius-clone-demo.git
   cd audius-clone-demo
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Open .env and add your secrets (JWT_PRIVATE_KEY, FLUTTERWAVE_SECRET_KEY, etc.)
   ```

4. **Spin up Infrastructure**
   ```bash
   docker-compose up -d
   ```

5. **Start All Microservices**
   ```bash
   pnpm dev:all
   ```
   *The API Gateway will be available at `http://localhost:3000`.*

---

## 🛠 API Endpoints

All requests should be made through the **API Gateway** on port **3000**.

### 👤 User Endpoints (Consumer)
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | Register as a listener | ✅ Available |
| **POST** | `/api/auth/login` | Login and receive JWT | ✅ Available |
| **GET** | `/api/auth/me` | Get current user session | ✅ Available |
| **GET** | `/api/auth/:id` | Get public profile of any user | ✅ Available |
| **GET** | `/api/music/songs` | Get trending tracks (via Audius) | ✅ Available |
| **GET** | `/api/music/songs/:id` | Get details and access track | ✅ Available |
| **GET** | `/api/music/search` | Search across songs, artists, playlists | ✅ Available |
| **GET** | `/api/stream/:songId` | Stream audio file | ✅ Available |
| **POST** | `/api/social/follow/:id` | Follow an artist or user | ✅ Available |
| **POST** | `/api/social/comment/:id` | Comment on a song | ✅ Available |
| **POST** | `/api/payment/tip` | Send tokens to an artist | ✅ Available |
| **GET** | `/api/auth/me/preferences`| Get user taste profile | ✅ Available |
| **POST** | `/api/auth/forgot-password`| Request reset link | ⚠️ UI only (No SMTP) |

### 👨‍🎤 Merchant Endpoints (Artist)
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/merchants/signup` | Register as an artist | ✅ Available |
| **POST** | `/api/auth/upgrade-to-merchant` | Upgrade existing consumer account | ✅ Available |
| **GET** | `/api/auth/merchants/me` | Merchant dashboard profile | ✅ Available |
| **POST** | `/api/music/albums` | Create a new album | ✅ Available |
| **POST** | `/api/payment/withdraw` | Withdraw funds to bank | ✅ Available |
| **GET** | `/api/social/stats/:id` | Get detailed artist engagement stats | ✅ Available |

### 🔑 Admin Endpoints
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/auth/merchants` | List all merchants for review | ✅ Available |
| **POST** | `/api/auth/merchants/:id/verify` | Verify an artist's identity | ✅ Available |
| **DELETE** | `/api/auth/users/:id` | Permanently remove a user | ✅ Available |
| **GET** | `/api/analytics/metrics` | View system-wide performance | ✅ Available |
| **GET** | `/api/analytics/reports/trending` | View most popular songs across periods | ✅ Available |

---

## 🏗 Microservices Architecture

- **Auth Service (3001)**: Identity, Role Management, and User Preferences.
- **Music Catalog (3002)**: Metadata for songs, albums, and Audius API proxy.
- **Streaming Service (3003)**: HLS-like streaming and play analytics.
- **Social Service (3004)**: Engagement graph (Likes, Reposts, Follows).
- **Payment Service (3005)**: Financial ledger and Flutterwave integration.
- **Recommendations (3006)**: Discovery algorithms for the dashboard.
- **Analytics (3007)**: Event tracking and reporting engine.
- **API Gateway (3000)**: Unified entry point with rate limiting and logging.

## 🧪 Testing

```bash
pnpm test          # Run all test suites
pnpm test:unit     # Run unit tests only
```

## License
ISC
