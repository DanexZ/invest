const Payment = require('../models/Payment');
const Transfer = require('../models/Transfer');
const Pool = require('../models/Pool');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Order = require('../models/Order');
const Functions = require('../Functions');

const functions = new Functions();

exports.index = async (req, res) => {

    const p_s = await functions.calculate_subkonto(req.session.user._id);

    req.session.user.subkonto = p_s.subkonto;


    //obliczenie udziału w zbiórce
    let pool = new Pool();
    let currentPool = await pool.getCurrent();

    let userPart;
    
    if(currentPool){

        //trzeba pobrać jej transfery i podliczyć zbiórkę
        //podliczam udorazu udział aktualnie zalogowane usera
        let transfer = new Transfer();
        let in_transfers = await transfer.getRecipientTransfers(currentPool._id);
        let out_transfers = await transfer.getAuthorTransfers(currentPool._id);

        let user_part_in = 0;
        let user_part_out = 0;

        for(let i=0; i<in_transfers.length; i++){
            if(in_transfers[i].author_id == req.session.user._id){
                user_part_in += in_transfers[i].amount;
            }
        }

        for(let i=0; i<out_transfers.length; i++){
            if(out_transfers[i].author_id == req.session.user._id){
                user_part_out += out_transfers[i].amount;
            }
        }

        userPart = user_part_in - user_part_out;
    }

    req.session.user.part = userPart || '0';


    res.render('backend/index', {
        user: req.session.user,
        payments: p_s.payments
    });
}

/** ACCOUNT */

exports.user_account = async (req, res) => {

    const user = new User();
    const specyficUser = await user.findUserByUsername(req.params.username);

    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/account/account', {
        user: req.session.user,
        specyficUser: specyficUser,
        page: 'account'
    });
}

exports.user_password = async (req, res) => {

    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/account/password', {
        user: req.session.user,
        specyficUser: null,
        page: 'password'
    });
}


exports.user_documents = async (req, res) => {
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/account/documents', {
        user: req.session.user,
        specyficUser: null,
        page: 'account_documents'
    });
}

/** END ACCOUNT */


/** POOLS */

exports.pools_index = async (req, res) => {

    //trzeba pobrać bieżącą zbiórkę
    let pool = new Pool();
    let currentPool = await pool.getCurrent();
    /** ------------------------------------- */

    if(currentPool){

        //trzeba pobrać jej transfery i podliczyć zbiórkę
        //podliczam udorazu udział aktualnie zalogowane usera
        let transfer = new Transfer();
        let in_transfers = await transfer.getRecipientTransfers(currentPool._id);
        let out_transfers = await transfer.getAuthorTransfers(currentPool._id);

        let in_sum = 0;
        let out_sum = 0;
        let user_part_in = 0;
        let user_part_out = 0;

        for(let i=0; i<in_transfers.length; i++){
            in_sum += in_transfers[i].amount;

            if(in_transfers[i].author_id == req.session.user._id){
                user_part_in += in_transfers[i].amount;
            }
        }

        for(let i=0; i<out_transfers.length; i++){
            out_sum += out_transfers[i].amount;

            if(out_transfers[i].author_id == req.session.user._id){
                user_part_out += out_transfers[i].amount;
            }
        }


        currentPool.total = in_sum - out_sum;
        req.session.user.part = user_part_in - user_part_out;
        /** ------------------------------------ */

        /** Udziały wszystkich użytkowników */
        const all_transfers = in_transfers.concat(out_transfers);
        let shareholders = [];
        
        for(let i=0; i<all_transfers.length; i++){
        
            let item = all_transfers[i];
            let existItem = false;

            for(m=0; m<shareholders.length; m++){
                if(shareholders[m].username == item.author_username){
                    existItem = true;
                }
            }
            
            if(!existItem && !item.author_username.includes('#')){
                shareholders.push({username: item.author_username, value: 0});
            }

            for(let m=0; m<shareholders.length; m++){
                if(shareholders[m].username == all_transfers[i].author_username){
                    shareholders[m].value += all_transfers[i].amount;
                }

                if(shareholders[m].username == all_transfers[i].recipient_username){
                    shareholders[m].value -= all_transfers[i].amount;
                }
            }

        }

        currentPool.shareholders = shareholders;

        //zmienna dla max value
        currentPool.max = currentPool.amount - currentPool.total;
    }

     /** Aktualizuję subkonto */
     const p_s = await functions.calculate_subkonto(req.session.user._id);
     req.session.user.subkonto = p_s.subkonto;

    res.render('backend/pools/index', {
        user: req.session.user,
        currentPool: currentPool,
        page: 'pools_currentPool'
    });
}



exports.pools_history = async (req, res) => {
    const pool = new Pool();
    const pools = await pool.getPools();
    const transfer = new Transfer();

    for(let i=0; i<pools.length; i++){
        const in_transfers = await transfer.getRecipientTransfers(pools[i]._id);
        const out_transfers = await transfer.getAuthorTransfers(pools[i]._id);

        const all_transfers = in_transfers.concat(out_transfers);
        let shareholders = [];

        for(let m=0; m<all_transfers.length; m++){
        
            let item = all_transfers[m];
            let existItem = false;

            for(n=0; n<shareholders.length; n++){
                if(shareholders[n].username == item.author_username){
                    existItem = true;
                }
            }
            
            if(!existItem && !item.author_username.includes('#')){
                shareholders.push({username: item.author_username, value: 0});
            }

            for(let n=0; n<shareholders.length; n++){
                if(shareholders[n].username == all_transfers[m].author_username){
                    shareholders[n].value += all_transfers[m].amount;
                }

                if(shareholders[n].username == all_transfers[m].recipient_username){
                    shareholders[n].value -= all_transfers[m].amount;
                }
            }

        }

        pools[i].shareholders = shareholders;

    }

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/pools/history', {
        user: req.session.user,
        pools: pools,
        page: 'pools_history'
    });
}


exports.pools_single = async (req, res) => {
    //trzeba pobrać bieżącą zbiórkę
    let pool_object = new Pool();
    let pool = await pool_object.getPoolById(req.params.id);
    /** ------------------------------------- */

    if(pool){

        //trzeba pobrać jej transfery i podliczyć zbiórkę
        //podliczam udorazu udział aktualnie zalogowane usera
        let transfer = new Transfer();
        let in_transfers = await transfer.getRecipientTransfers(pool._id);
        let out_transfers = await transfer.getAuthorTransfers(pool._id);

        let in_sum = 0;
        let out_sum = 0;
        let user_part_in = 0;
        let user_part_out = 0;

        for(let i=0; i<in_transfers.length; i++){
            in_sum += in_transfers[i].amount;

            if(in_transfers[i].author_id == req.session.user._id){
                user_part_in += in_transfers[i].amount;
            }
        }

        for(let i=0; i<out_transfers.length; i++){
            out_sum += out_transfers[i].amount;

            if(out_transfers[i].author_id == req.session.user._id){
                user_part_out += out_transfers[i].amount;
            }
        }


        pool.total = in_sum - out_sum;
        req.session.user.part = user_part_in - user_part_out;
        /** ------------------------------------ */

        /** Udziały wszystkich użytkowników */
        const all_transfers = in_transfers.concat(out_transfers);
        let shareholders = [];
        
        for(let i=0; i<all_transfers.length; i++){
        
            let item = all_transfers[i];
            let existItem = false;

            for(m=0; m<shareholders.length; m++){
                if(shareholders[m].username == item.author_username){
                    existItem = true;
                }
            }
            
            if(!existItem && !item.author_username.includes('#')){
                shareholders.push({username: item.author_username, value: 0});
            }

            for(let m=0; m<shareholders.length; m++){
                if(shareholders[m].username == all_transfers[i].author_username){
                    shareholders[m].value += all_transfers[i].amount;
                }

                if(shareholders[m].username == all_transfers[i].recipient_username){
                    shareholders[m].value -= all_transfers[i].amount;
                }
            }

        }

        pool.shareholders = shareholders;

        //zmienna dla max value
        pool.max = pool.amount - pool.total;
    }

     /** Aktualizuję subkonto */
     const p_s = await functions.calculate_subkonto(req.session.user._id);
     req.session.user.subkonto = p_s.subkonto;

    res.render('backend/pools/single', {
        user: req.session.user,
        pool: pool
    });
}



/** END POOLS */


// ASSETS

exports.assets = async (req, res) => {

    res.render('backend/assets/index', {
        user: req.session.user
    });
}



exports.assets_properties = async (req, res) => {

    const asset = new Asset();
    const properties =  await asset.getProperties();

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/assets/properties', {
        user: req.session.user,
        properties: properties,
        page: 'properties'
    });
}



exports.get_property = async (req, res) => {
    let asset = new Asset();

    asset.getProperty(req.params.id)

    .then(async (property) => {

        /** Aktualizuję subkonto */
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/assets/property', {
            user: req.session.user,
            property: property,
            page: "property"
        });
    })

    .catch((errors) => {
        console.log(errors);
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect('/dashboard/operations/inpay'));
    });
}

exports.asset_incomes = async (req, res) => {
    res.render('backend/assets/incomes', {
        user: req.session.user,
        page: 'incomes'
    });
}

// ADMIN

exports.admin = async (req, res) => {

    let payment = new Payment();
    let pending_payments = [];

    const payments = await payment.getPayments();
    
    for(let i=0; i<payments.length; i++){
        if(payments[i].status == 'pending'){
            pending_payments.push(payments[i]);
        }
    }
    /** END PAYMENTS */

    //trzeba pobrać bieżącą zbiórkę
    const pool = new Pool();
    const currentPool = await pool.getCurrent()
    if(currentPool){

        const transfer = new Transfer();
        const in_transfers = await transfer.getRecipientTransfers(currentPool._id);
        const out_transfers = await transfer.getAuthorTransfers(currentPool._id);

        let in_sum = 0;
        let out_sum = 0;

        for(let i=0; i<in_transfers.length; i++){
            in_sum += in_transfers[i].amount;
        }

        for(let i=0; i<out_transfers.length; i++){
            out_sum += out_transfers[i].amount;
        }

        currentPool.total = in_sum - out_sum;
    }

    /** END CurrentPOOL */

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/admin/index', {
        user: req.session.user,
        pending_payments: pending_payments,
        currentPool: currentPool
    })
}



exports.admin_pools = async (req, res) => {
    const pool = new Pool();
    const pools = await pool.getPools();

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/admin/pools',{
        user: req.session.user,
        pools: pools,
        page: 'admin_pools'
    });
}



exports.admin_pools_create = async (req, res) => {
    

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/admin/pools_create',{
        user: req.session.user,
        page: 'admin_pools_create'
    });
}



exports.admin_users = async (req, res) => {

    const user = new User();
    const users = await user.getUsers();

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/admin/users',{
        user: req.session.user,
        users: users,
        page: 'admin_users'
    });
}



exports.admin_asset = async (req, res) => {

    let asset = new Asset();
    asset = await asset.getAsset(req.params.id); 

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/admin/asset',{
        user: req.session.user,
        asset: asset,
        page: 'admin_asset'
    });
}



exports.admin_assets = async (req, res) => {

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/admin/assets',{
        user: req.session.user
    });
}



exports.admin_orders = async (req, res) => {
    const order = new Order();
    const orders = await order.all();

    console.log(orders);

    res.render('backend/admin/orders',{
        user: req.session.user,
        orders: orders
    });
}


/** END ADMIN */

//SUBKONTO

exports.subkonto = async (req, res) => {

    //muszę pobrać payments, transfers, withrawals i je skonkatenować
    let payment = new Payment();
    let transfer = new Transfer();

    let payments_promise = payment.getPayments(req.session.user._id);
    let in_transfers_promise = transfer.getRecipientTransfers(req.session.user._id);
    let out_transfers_promise = transfer.getAuthorTransfers(req.session.user._id);

    let [payments, in_transfers, out_transfers] = await Promise.all([payments_promise, in_transfers_promise, out_transfers_promise]);

    let transactions = payments.concat(in_transfers).concat(out_transfers);

    transactions.sort( (a,b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });


    //podliczenie subkonta pod każdym rootem
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/subkonto/index', {
        user: req.session.user,
        page: 'subkonto_history',
        transactions: transactions
    });
}



exports.subkonto_inpay = async (req, res) => {
    
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/subkonto/inpay', {
        user: req.session.user,
        page: 'inpay'
    });
}



exports.subkonto_send_money = async (req, res) => {

    //podliczenie subkonta pod każdym rootem
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/subkonto/send_money', {
        user: req.session.user,
        page: 'send_money'
    });
}

/** END SUBKONTO */

/** PRODUCTS */

exports.my_products = async (req, res) => {

    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/products/my-products', {
        user: req.session.user,
        page: 'my_products'
    });
}



exports.products_property = async (req, res) => {

    let user = new User();
    const asset = new Asset();
    const property = await asset.getProperty(req.params.id);

    //muszę pobrać na nowo użytkownika aby mieć jego aktualny status
    user = await user.findUserByUsername(req.session.user.username);

    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.status = user.status;
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/products/property', {
        user: req.session.user,
        property: property,
        page: 'product_property'
    });
}



exports.products_properties = async (req, res) => {

    //muszę pobrać produkty możliwe do zamówienia przez usera
    const asset = new Asset();

    const properties = await asset.getProperties();

    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/products/properties', {
        user: req.session.user,
        properties: properties,
        page: 'properties'
    });
}


exports.orders = async (req, res) => {
    const order = new Order();
    const orders = await order.getUserOrders(req.session.user._id);

    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/orders/orders', {
        user: req.session.user,
        orders: orders,
        page: 'orders'
    });
}


/*exports.studio = async (req, res) => {
    const asset = new Asset();

    const studio = await asset.getStudio(req.params.id);

    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/products/studio', {
        user: req.session.user,
        studio: studio
    });
}*/


