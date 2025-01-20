# Pet Care Web Application - Backend

## Overview
This is the backend service for the Pet Care Web Application. It provides APIs for managing pet care services, including scheduling appointments, managing pet information, and user authentication.



## Technologies Used
- Node.js
- Express.js
- MongoDB
- JWT for authentication


## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Docker (optional)

### Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/pet-care-backend.git
    ```
2. Navigate to the project directory:
    ```bash
    cd pet-care-backend
    ```
3. Install dependencies:
    ```bash
    npm install
    ```

### Configuration
1. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/petcare
    JWT_SECRET=your_jwt_secret
    ```


3. The application will be running at `http://localhost:8000`.



## API Documentation
API documentation is available at `http://localhost:3000/api-docs` once the application is running.



## License
This project is licensed under the JMPC, IT Department License. 
