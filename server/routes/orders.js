const express = require('express');
const router = express.Router();
const processOrder = require('../utils/orderProcessor');

/**
 * POST /api/orders
 * Create a new order with calculations
 */
router.post('/', async (req, res) => {
    try {
        const { quantity, price, tax, discountPercent, discountAmount } = req.body;
        
        const order = await processOrder({
            quantity,
            price,
            tax,
            discountPercent,
            discountAmount
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;