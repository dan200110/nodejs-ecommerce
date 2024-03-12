const {findCartById} = require("../models/repositories/cart.repo");
const {Api404Error, BusinessLogicError} = require("../core/error.response");
const {checkProductByServer} = require("../models/repositories/product.repo");
const {DiscountService} = require("./discount.service");
const { acquireLock, releaseLock } = require("./redis.service");
const { orderModel } = require("../models/order.model")
class OrderService  {

    /*
        {
            cartId,
            userId,
            shop_order_ids: [
                {
                    shopId,
                    shop_discounts: [
                        {
                            shopId,
                            discountId,
                            codeId
                        }
                    ],
                    item_products: [
                        {
                            price,
                            quantity,
                            productId
                        }
                    ]
                }
            ]
        }
     */
    static async orderReview({ cartId, userId, shop_order_ids}) {
        // check cartId exists
        // console.log('CartId is', cartId);
        // console.log('userId is', userId);
        // console.log('shop_order_ids is', shop_order_ids);



        const foundCart = findCartById(cartId)
        if (!foundCart) throw new Api404Error(`Cart don't exists`)

        const checkout_order = {
            totalPrice: 0, // tong tien hang
            feeShip: 0, // phi van chuyen
            totalDiscount: 0, // tong tien giam gia
            totalCheckout: 0 // tong thanh toan
        }, shop_order_ids_new = []

        // calculator bill
        for (let i = 0; i<shop_order_ids.length; i++) {
            const {shopId, shop_discounts = [], item_products = []} = shop_order_ids[i]
            // console.log('shop_order_ids[i] is', shop_order_ids[i]);
            // console.log('shopId is', shopId);
            // console.log('shop_discounts is', shop_discounts);
            // console.log('item_products is', item_products);


            // check product available
            const checkProductServer = await checkProductByServer(item_products)
            const hasInvalidProduct = checkProductServer.some(product => product === undefined);

            if (hasInvalidProduct) {
                throw new BusinessLogicError('Order invalid');
            }


            // sum total order
            const checkoutPrice = checkProductServer.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            }, 0)

            // total before
            checkout_order.totalPrice = +checkoutPrice

            const itemCheckout = {
                shopId,
                shop_discounts,
                priceRow: checkoutPrice,
                priceApplyDiscount: checkoutPrice,
                item_products: checkProductServer
            }

            // neu shop_discounts ton tai > 0, check valid
            if (shop_discounts.length > 0) {
                const {totalPrice, discount = 0} = await DiscountService.getDiscountAmount({
                    codeId: shop_discounts[0].codeId,
                    userId,
                    shopId,
                    products: checkProductServer
                })
                checkout_order.totalDiscount +=discount
                if (discount > 0) {
                    itemCheckout.priceApplyDiscount = checkoutPrice - discount
                }
            }

            // tong thanh toan cuoi cung
            checkout_order.totalCheckout += itemCheckout.priceApplyDiscount
            shop_order_ids_new.push(itemCheckout)
        }

        return {
            shop_order_ids,
            shop_order_ids_new,
            checkout_order
        }
    }

    static async orderByUser({ shop_order_ids, cartId, userId,user_address = {}, user_payment = {}}) {
        const { checkout_order }
            = await OrderService.orderReview({
            cartId,
            userId,
            shop_order_ids
        })

        // check lai mot lan nua xem ton kho hay k
        // get new array products
        const products = shop_order_ids.flatMap( order => order.item_products)
        console.log('[1]::', products)
        const acquireProduct = []
        for (let i = 0; i < products.length; i++) {
            const {productId, quantity} = products[i];
            const keyLock = await acquireLock(productId, quantity, cartId)
            acquireProduct.push( keyLock ? true : false )
            if(keyLock){
                await releaseLock(keyLock)
            }
        }
        
        // check if co mot sp het hang trong kho
        if(acquireProduct.includes(false)){
            throw new BusinessLogicError('Co san pham da het hang')
        }

        // assume that can click to create order then status of this order is completed, no need to shipping,...
        const newOrder = await orderModel.create({
            order_user_id: userId,
            order_checkout: checkout_order,
            order_shipping: user_address,
            order_payment: user_payment,
            order_products: shop_order_ids
        })

        // neu insert thanh cong, thi remove product co trong cart
        if(newOrder){
            // remove product in my cart
        }
    }

    static async getOrderByUser() {

    }

    static async getOneOrderByUser() {

    }

    static async cancelOrderByUser() {

    }

    static async updateOrderStatusByShop() {

    }
}

module.exports = {
    OrderService
}
