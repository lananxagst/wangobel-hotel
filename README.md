# Wangobel Hotel Management System

A comprehensive hotel management system built with modern web technologies.

## Project Structure

- `frontend/` - React-based user interface
- `backend/` - Node.js/Express API server
- `admin/` - Admin dashboard interface

## Features

- Room booking and management
- Payment integration with Midtrans
- User authentication and authorization
- Room availability tracking
- Booking history and management
- Admin dashboard for hotel management

## Prerequisites

- Node.js >= 14
- MongoDB
- NPM or Yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wangobel-hotel
```

2. Install dependencies for each component:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Admin (if applicable)
cd ../admin
npm install
```

3. Set up environment variables:
Create `.env` files in both frontend and backend directories with the required configuration.

4. Start the development servers:

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Admin
cd admin
npm run dev
```

## Environment Variables

### Backend
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

### Frontend
```
VITE_BACKEND_URL=http://localhost:5000
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
