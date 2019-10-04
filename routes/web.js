const express = require('express');
const router = express.Router();
const UserController = require('../app/controllers/UserController');
const FrontendController = require('../app/controllers/FrontendController');
const BackendController = require('../app/controllers/BackendController');
const PaymentController = require('../app/controllers/PaymentController');
const PoolController = require('../app/controllers/PoolController');
const TransferController = require('../app/controllers/TransferController');
const CommentController = require('../app/controllers/CommentController');
const AssetController = require('../app/controllers/AssetController');
const AssetClientController = require('../app/controllers/AssetClientController');
const OrderController = require('../app/controllers/OrderController');

router.get('/', FrontendController.home);

// USER Routes
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.post('/register', UserController.register);
router.post('/doesUsernameExist', UserController.doesUsernameExist);
router.post('/doesEmailExist', UserController.doesEmailExist);
router.post('/edit', UserController.mustBeLoggedIn, UserController.edit);
router.post('/dashboard/changePassword', UserController.mustBeLoggedIn, UserController.changePassword);

// BILLING PERIODS  
router.get('/makeBillingPeriod', FrontendController.makeBillingPeriod);
router.get('/dashboard/period', UserController.mustBeLoggedIn, BackendController.getPeriod);

// BACKEND ROUTES

router.get('/dashboard', UserController.mustBeLoggedIn, BackendController.index);

// ACCOUNT
router.get('/dashboard/account/:username', UserController.mustBeLoggedIn, UserController.access,BackendController.user_account);
router.get('/dashboard/password', UserController.mustBeLoggedIn, BackendController.user_password);
router.get('/dashboard/documents', UserController.mustBeLoggedIn, BackendController.user_documents);
router.get('/dashboard/emerytura', UserController.mustBeLoggedIn, BackendController.user_emerytura);
router.post('/dashboard/emerytura/update', UserController.mustBeLoggedIn, UserController.update_emerytura);

// ADMIN ROUTES
router.get('/dashboard/admin/:optional', UserController.mustBeLoggedIn, UserController.mustBeAdmin, BackendController.admin);
router.get('/dashboard/admin/orders', UserController.mustBeLoggedIn, UserController.mustBeAdmin, BackendController.admin_orders);
router.get('/dashboard/admin/pools', UserController.mustBeLoggedIn, UserController.mustBeAdmin, BackendController.admin_pools);
router.get('/dashboard/admin/pools_create', UserController.mustBeLoggedIn, UserController.mustBeAdmin, BackendController.admin_pools_create);
router.get('/dashboard/admin/assets', UserController.mustBeLoggedIn, UserController.mustBeAdmin, BackendController.admin_assets);
router.get('/dashboard/admin/users', UserController.mustBeLoggedIn, UserController.mustBeAdmin, BackendController.admin_users);
router.get('/dashboard/admin/asset/:id', UserController.mustBeLoggedIn, UserController.mustBeAdmin, BackendController.admin_asset);

// INFORMATION
router.get('/dashboard/information', UserController.mustBeLoggedIn, BackendController.information);
router.get('/dashboard/information/regulamin', UserController.mustBeLoggedIn, BackendController.information_regulamin);
router.get('/dashboard/information/politics', UserController.mustBeLoggedIn, BackendController.information_politics);
router.get('/dashboard/information/faq', UserController.mustBeLoggedIn, BackendController.information_faq);
router.get('/dashboard/information/mission', UserController.mustBeLoggedIn, BackendController.information_mission);

// PAYMENTS
router.post('/payment/create', UserController.mustBeLoggedIn, PaymentController.create);
router.post('/payment/:id/edit', UserController.mustBeLoggedIn, PaymentController.edit);

// POOLS
router.post('/dashboard/pool/create', UserController.mustBeLoggedIn, PoolController.create);
router.post('/dashboard/pool/:id/edit', UserController.mustBeLoggedIn, PoolController.edit);

// COMMENTS
router.post('/comment/create', UserController.mustBeLoggedIn, CommentController.create);

// TRANSFER
router.post('/dashboard/transfer/create', UserController.mustBeLoggedIn, TransferController.create);
router.post('/dashboard/transfer/back', UserController.mustBeLoggedIn, TransferController.back);

// POOLS
router.get('/dashboard/pools', UserController.mustBeLoggedIn, BackendController.pools_index);
router.get('/dashboard/pools/history', UserController.mustBeLoggedIn, BackendController.pools_history);
router.get('/dashboard/pool/:id', UserController.mustBeLoggedIn, BackendController.pools_single);

// MONEY
router.get('/dashboard/money' , UserController.mustBeLoggedIn, BackendController.money);
router.get('/dashboard/money/history', UserController.mustBeLoggedIn, BackendController.money_history);
router.get('/dashboard/money/billingPeriod/:date', UserController.mustBeLoggedIn, BackendController.billingPeriod);

// ASSETS
//router.get('/dashboard/assets', UserController.mustBeLoggedIn, BackendController.assets);
router.get('/dashboard/assets/properties', UserController.mustBeLoggedIn, BackendController.assets_properties);
router.get('/dashboard/assets/property/:id', UserController.mustBeLoggedIn, BackendController.get_property);
router.get('/dashboard/asset/:id/incomes', UserController.mustBeLoggedIn, BackendController.asset_incomes);
router.post('/dashboard/asset/create', UserController.mustBeLoggedIn, AssetController.create);


// ASSET_CLIENT
router.post('/dashboard/asset_client', UserController.mustBeLoggedIn, AssetClientController.update);

// SUBKONTO
router.get('/dashboard/subkonto', UserController.mustBeLoggedIn, BackendController.subkonto);
router.get('/dashboard/subkonto/inpay', UserController.mustBeLoggedIn, BackendController.subkonto_inpay);
router.get('/dashboard/subkonto/send_money', UserController.mustBeLoggedIn, BackendController.subkonto_send_money);

// PRODUCTS
router.get('/dashboard/my-products', UserController.mustBeLoggedIn, BackendController.my_products);
router.get('/dashboard/products/property/:id', UserController.mustBeLoggedIn, BackendController.products_property);
router.get('/dashboard/products/properties', UserController.mustBeLoggedIn, BackendController.products_properties);

//ORDERS
router.get('/dashboard/orders', UserController.mustBeLoggedIn, BackendController.orders);
router.post('/order/create/:id/:type', UserController.mustBeLoggedIn, OrderController.create);

module.exports = router;