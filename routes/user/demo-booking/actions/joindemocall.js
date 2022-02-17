const router = require('express').Router();
const User = require('../../../../models/entities/user-schema');
const Product = require('../../../../models/entities/product-schema');
const demoBooking = require('../../../../models/operations/demo-booking-schema');
const handleError = require('../../../../error_handling/handler');


router.post('/', async (req, res) => {
    try {

        const {
            user,
            event
        } = req.body;

        const Event = await demoBooking.findById({ _id: event });
        const prod = await Product.findOne({ event: event }).select('price discount');

        const customer = {
            user: user,
            interested: false,
            status: true
        }
        let f = 0;
        Event.customers.every(element => {
            if (element.user == customer.user) {
                element.status = true;
                f = 1;
                return false;
            }
            return true;
        });
        if (f == 0)
            Event.customers.push(customer);

        const updatedEvent = await demoBooking.findByIdAndUpdate({ _id: event }, { customers: Event.customers });
        const disc = prod.price - (prod.price * prod.discount / 100);

        res.status(200).json({ price: prod.price, discounted: disc, title: Event.demoName });
    } catch (error) {
        handleError(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }

});

module.exports = router;