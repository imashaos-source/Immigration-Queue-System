# Immigration Appointment & Queue Management System

A web-based application developed for the **EE4207 Web Application Development Mini Project**. The system allows applicants to request immigration-related appointments and check their appointment status, while staff can manage appointments and walk-in queues.

> **Note:** This is an academic demonstration project and is not an official government service.

## Features

### Public Portal
- View immigration service information.
- Submit appointment requests.
- Check appointment status using booking details.
- View the live queue board.

### Staff Portal
- Authenticate staff users.
- View and manage appointment records.
- Search, filter and sort appointment records.
- Edit and delete appointments.
- Register walk-in applicants and generate queue tickets.
- Update walk-in ticket statuses.

### Validation and Security
- Client-side and server-side input validation.
- Password hashing using bcryptjs.
- JWT-based authentication.
- Role-based access control for protected operations.
- Error handling for invalid requests.

## Technologies Used

- **Frontend:** React, JavaScript, CSS and Vite
- **Backend:** Node.js and Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** bcryptjs
- **Version Control:** Git and GitHub

## Project Structure

```text
Immigration-Queue-System/
│
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- MongoDB (local instance or an accessible database service)
- Git
- A modern web browser

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/imashaos-source/Immigration-Queue-System.git
cd Immigration-Queue-System
```

### 2. Configure the Backend

Open a terminal in the project root and run:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory and configure the following environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
SETUP_SECRET=your_secure_setup_secret
```

**Environment Variables:**

- `PORT` – Port number used by the backend server. Defaults to 5000 if not specified.
- `MONGODB_URI` – MongoDB connection string used to connect to the database.
- `JWT_SECRET` – Secret key used for JWT authentication.
- `SETUP_SECRET` – Secret used for the initial administrator setup process.

Replace the example values with your own configuration. Keep the `.env` file private and never commit it to GitHub.

Start the backend in development mode:

```bash
npm run dev
```

Alternatively, use:

```bash
npm start
```

Wait for the backend to connect successfully to MongoDB.

### 3. Configure the Frontend

Open a second terminal and navigate to the project root:

```bash
cd frontend
npm install
```

Configure the frontend API URL if required by the existing project configuration.

Start the frontend development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### 4. Build the Frontend

To create a production build, run the following command from the `frontend/` directory:

```bash
npm run build
```

The production build is generated in the `frontend/dist/` directory.

## Local Development URLs

The application uses the following local development addresses:

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

The actual addresses may differ depending on the local configuration.

## Database

The application uses MongoDB for persistent data storage through Mongoose.

The main models defined in the project include:

- **Appointment:** Stores appointment request and booking information.
- **Staff:** Stores staff account details, roles and password hashes.
- **WalkInTicket:** Stores walk-in registration and queue ticket information.
- **QueueCounter:** Defines a database model for maintaining queue counter values. It is currently not integrated into the active queue-generation process.

Refer to the project report for the database design and Entity-Relationship Diagram (ERD).

## Security Notes

- Passwords are hashed using bcryptjs.
- JWT-based authentication is used for protected operations.
- Role-based access control is implemented for restricted staff functions.
- Environment files containing database credentials or authentication secrets must not be committed to GitHub.
- Fictional test data is used for academic demonstrations.

## Author

- **Student Name:** Suraweera M.G.I.O.
- **Registration Number:** EG/2023/5909
- **Module:** EE4207 Web Application Development
- **Project:** Immigration Appointment & Queue Management System

## Repository

[Immigration Appointment & Queue Management System – GitHub](https://github.com/imashaos-source/Immigration-Queue-System)