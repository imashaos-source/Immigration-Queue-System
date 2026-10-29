
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
- Search, filter and sort records where supported.
- Edit and delete appointments.
- Register walk-in applicants and generate queue tickets.
- Update walk-in ticket statuses.

### Validation and Security
- Client-side and server-side input validation.
- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based access control for protected operations.
- Error handling for invalid requests.

## Technologies Used

- **Frontend:** React, JavaScript, CSS and Vite
- **Backend:** Node.js and Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Password hashing:** bcryptjs
- **Version control:** Git and GitHub

## Prerequisites

Install the following before running the application:

- Node.js and npm
- MongoDB, either a local instance or an accessible database service
- Git
- A modern web browser

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/imashaos-source/Immigration-Queue-System.git
cd Immigration-Queue-System
```

### 2. Configure the backend

Open a terminal in the project root and run:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory.

Configure the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Configure the authentication secret using the environment variable name expected by the authentication implementation.

- `PORT` is optional. The backend defaults to port `5000`.
- `MONGODB_URI` provides the MongoDB connection string and is required for the database connection.

Replace the example database value with your own valid connection string.

Start the backend in development mode:

```bash
npm run dev
```

Alternatively, start it using Node.js:

```bash
npm start
```

Wait for the backend to connect to MongoDB successfully.

### 3. Configure the frontend

Open a second terminal and navigate to the project root, then run:

```bash
cd frontend
npm install
```

Configure the frontend API URL if required by the existing project configuration.

Start the frontend development server:

```bash
npm run dev
```

Open the local URL printed in the terminal.

### 4. Build the frontend

To check whether the frontend can be built for production, run the following command from the `frontend/` directory:

```bash
npm run build
```

The build output is generated in the `frontend/dist/` directory.

## Local Development URLs

The application has been tested using these local development addresses:

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

The actual addresses may differ depending on the local configuration.

## Project Structure

The project contains separate frontend and backend applications.

- `frontend/` — React user interface, pages, reusable components and styles.
- `backend/` — Express server, API routes, data models, authentication and database integration.
- `README.md` — Project overview and installation instructions.

## Database

The application uses MongoDB for persistent storage.

The main models defined in the project include:

- **Appointment:** Appointment request and booking information.
- **Staff:** Staff account details, roles and password hashes.
- **WalkInTicket:** Walk-in registration and queue ticket information.
- **QueueCounter:** A model defined in the project; its role depends on the implemented queue logic.

Refer to the project report for the database design and Entity-Relationship Diagram (ERD).

## Security Notes

- Passwords are hashed using bcryptjs.
- JWT-based authentication is used for protected operations.
- Access to staff functions is controlled by the implemented authorization rules.
- Environment files containing database credentials or authentication secrets must not be committed to GitHub.
- Use fictional test data for academic demonstrations.

## Author

- **Student Name:** Suraweera M.G.I.O.
- **Reg Number:** EG/2023/5909
- **Module:** EE4207 Web Application Development
- **Project:** Immigration Appointment & Queue Management System

## Repository

[Immigration Appointment & Queue Management System on GitHub](https://github.com/imashaos-source/Immigration-Queue-System)
