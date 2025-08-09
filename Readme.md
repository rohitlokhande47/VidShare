A robust Node.js backend for a video sharing platform with social features, built using Express.js and MongoDB.

## 🚀 Features

- 👤 User authentication and profile management
- 🎥 Video upload, streaming, and management
- 💬 Comment system with pagination
- 👍 Like functionality for videos and comments
- 🔔 Subscription system
- 🐦 Tweet functionality for short updates

## 🛠️ Technologies

- **Node.js & Express.js**: Server framework
- **MongoDB & Mongoose**: Database and ODM
- **JWT**: Secure authentication
- **Multer**: File uploads handling
- **Cloudinary**: Media storage
- **Custom error handling**: Standardized API responses

## 📋 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/video-platform-backend.git
cd video-platform-backend

# Install dependencies
npm install

# Create .env file with the following variables
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Start development server
npm run dev
```

## 🔍 Usage

### API Endpoints

- **Auth**: `/api/v1/users/register`, `/api/v1/users/login`
- **Videos**: `/api/v1/videos` - Upload, view, and manage videos
- **Comments**: `/api/v1/comments` - Create and view comments on videos
- **Likes**: `/api/v1/likes` - Like/unlike videos and comments
- **Subscriptions**: `/api/v1/subscription` - Subscribe to channels
- **Tweets**: `/api/v1/tweets` - Create and view tweets

### Example: Fetching Video Comments

```javascript
fetch('http://localhost:8000/api/v1/videos/{videoId}/comments?page=1&limit=10', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

## 📜 License

MIT License

---

Connect your frontend application to these endpoints to build a complete video sharing platform. See API documentation for detailed request/response formats.
