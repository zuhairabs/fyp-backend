const router = require('express').Router();
const User = require('../../../models/entities/user-schema');
const Order = require('../../../models/operations/order-schema');
const Product = require('../../../models/entities/product-schema');
const handleError = require('../../../error_handling/handler');
const verifySession = require('../auth/verifySession');

router.post("/create/product", async (req, res) => {
    try {
        const { product } = req.body;
        const prod = await Product.create(product);
        if (!prod) return res.status(400).json({ error: "Product could not be created." });
        else return res.status(200).json({ product: prod });

    }
    catch (err) {
        handleError(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

//FETCH PRODUCT

router.post("/fetch/product", async (req, res) => {

    try {
        const prod = await Product.findOne({ event: req.body.event });

        if (!prod)
            return res.status(400).json({ error: "Product not found" });

        if (prod.quantity == 0)
            return res.status(200).json({ product: prod, sold: true });

        if (!prod) return res.status(400).json({ error: "Product not found" });
        else if (prod.quantity === 0) return res.status(201).json({ product: prod, sold: true });
        return res.status(200).json({ product: prod });

    } catch (err) {
        handleError(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});


//CREATE ORDER
router.post("/create/order", async (req, res) => {
    try {
        const {
            product,
            user,
            quantity,
            address,
            variant,
            amount,
            paymentId,
            email
        } = req.body.orderData;

        const prod = await Product.find({ _id: product });
        if (!prod)
            return res.status(400).json({ error: "Product not found" });

        const checkUser = await User.find({ _id: user });
        if (!checkUser)
            return res.status(401).json({ error: "User not found" });

        const order = {
            product: product,
            user: user,
            quantity: quantity,
            address: address,
            variant: variant,
            amount: amount,
            paymentId: paymentId,
            date: new Date(),
            status: (paymentId) ? 'paid' : 'pending',
            email: email,
        };
        const savedOrder = await Order.create(order);
        const userWithOrder = await User.findOneAndUpdate(
            { _id: user },
            {
                $push: { orders: savedOrder._id }
            }
        ).populate('orders');

        const newQuantity = prod[0].quantity - quantity;
        const newProd = await Product.findOneAndUpdate({ _id: product }, { quantity: newQuantity }, { new: true },
            (err, data) => {
                if (err) console.error(err)
            }
        )

        return res.status(200).json({
            user: userWithOrder,
            order: savedOrder,
            product: newProd
        });

    } catch (error) {
        handleError(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
