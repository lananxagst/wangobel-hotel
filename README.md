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
npm run server

# Frontend
cd frontend
npm run dev

# Admin
cd admin
npm run dev
```

## Environment Variables

### Backend
```env
PORT=4000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

### Frontend
```env
VITE_BACKEND_URL=http://localhost:4000
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

## Git Workflow

This project uses three main branches:

### Branches
1. `development` - Active development branch
2. `main` - Stable release candidate
3. `production` - Live production code

### Development Workflow
1. Create feature branch from development:
```bash
git checkout development
git checkout -b feature/your-feature
```

2. Make changes and commit:
```bash
git add .
git commit -m "feat: your feature description"
```

3. Push and merge to development:
```bash
git push origin feature/your-feature
# Create PR to development
```

4. Merge to main when stable:
```bash
git checkout main
git merge development
git push origin main
```

5. Release to production:
```bash
git checkout production
git merge main
git tag -a vX.Y.Z -m "Version X.Y.Z"
git push origin production --tags
```

### Commit Message Format
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Testing
- `chore`: Maintenance

## Contributing

1. Fork the repository
2. Create feature branch from development
3. Follow commit message format
4. Push changes and create PR to development
5. Wait for review and merge

## License

This project is licensed under the MIT License.
