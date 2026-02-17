require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json());

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StockSave Auth API',
      version: '1.0.0',
      description: 'API for User Signup, Login, and Profile Management',
    },
    servers: [
      {
        url: 'https://auth-signup.onrender.com',
        description: 'Production Server',
      },
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Points to your route files to read the JSDoc comments
  apis: ['./routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Routes
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoute');
const savingsRoutes = require('./routes/savingRoute');
const inventoryRoutes = require('./routes/inventory');
const payoutRoutes = require('./routes/payoutRoute');

// Global Route Mapping
app.use('/api/auth', authRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/test', testRoutes);

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Redirect to Documentation
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Server Initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Docs available at: http://localhost:${PORT}/api-docs`); 
});
