const express = require('express')
const router = express.Router()
const inventoryController = require('../../controllers/inventory.controller')
const {authenticationV2} = require("../../auth/authUtils");

// authentication
router.use(authenticationV2)

router.post('', inventoryController.addStockToInventory)


// router
module.exports = router
