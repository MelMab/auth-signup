const router = require('express').Router();
const inventory = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock board and food booking
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get stock board - all available food items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Items, categories and low stock alerts
 */
router.get('/', inventory.getStockBoard);

/**
 * @swagger
 * /api/inventory/categories:
 *   get:
 *     summary: Get food categories and products for dropdown
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories with nested products and variants
 */
router.get('/categories', inventory.getCategories);

/**
 * @swagger
 * /api/inventory/my-bookings:
 *   get:
 *     summary: Get current user booking history
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User bookings
 */
router.get('/my-bookings', authorize(['Customer']), inventory.getMyBookings);

/**
 * @swagger
 * /api/inventory/all-bookings:
 *   get:
 *     summary: Get all bookings across all users (Owner only)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bookings with user details
 */
router.get('/all-bookings', authorize(['Owner']), inventory.getAllBookings);

/**
 * @swagger
 * /api/inventory/book:
 *   post:
 *     summary: Book food slots using savings balance
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inventory_id, slots_booked]
 *             properties:
 *               inventory_id: { type: integer, example: 1 }
 *               slots_booked: { type: integer, example: 2 }
 *     responses:
 *       200:
 *         description: Booking successful
 *       400:
 *         description: Insufficient balance or slots
 */
router.post('/book', authorize(['Customer']), inventory.bookFoodItem);

/**
 * @swagger
 * /api/inventory/add:
 *   post:
 *     summary: Add new inventory stock (Owner only)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_variant_id, total_slots]
 *             properties:
 *               product_variant_id: { type: integer, example: 1 }
 *               total_slots: { type: integer, example: 100 }
 *     responses:
 *       201:
 *         description: Inventory added
 */
router.post('/add', authorize(['Owner']), inventory.addInventory);

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get single inventory item details
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Not found
 */
router.get('/:id', inventory.getInventoryItem);

module.exports = router;