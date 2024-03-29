const catchAsync = require('../helpers/catch.async')
const {OK} = require("../core/success.response");
const {OrderService} = require("../services/order.service");

class OrderController {
    checkoutReview = catchAsync(async (req, res, next) => {
        OK(res,  "Checkout review success",
            await OrderService.orderReview(req.body));
    })

    order = catchAsync(async (req, res, next) => {
        OK(res,  "Create new order success",
            await OrderService.orderByUser(req.body));
    })
}

module.exports = new OrderController()
