const Payment = require('../models/Payment');
const BillingPeriod = require('../models/BillingPeriod');
const BillingPeriodTransfers = require('../models/BillingPeriodTransfers');
const AssetPeriodCosts = require('../models/AssetPeriodCosts');
const Transfer = require('../models/Transfer');
const Pool = require('../models/Pool');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Order = require('../models/Order');
const AssetClient = require('../models/AssetClient');
const AssetTransfers = require('../models/AssetTransfers');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const timezone = require('moment-timezone');
const Functions = require('../Functions');

const functions = new Functions();

exports.index = async (req, res) => {

    const userNextPayments = await functions.userNextPayments(req.session.user._id);

    const p_s = await functions.calculate_subkonto(req.session.user._id);

    const userAccountValue = await functions.calculate_userAccountValue(req.session.user._id);

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
        userNextPayments: userNextPayments,
        payments: p_s.payments,
        userAccountValue: userAccountValue
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


exports.user_emerytura = async (req, res) => {

    //muszę wyliczyć średnią rentowność
    const asset = new Asset();
    const pool = new Pool();
    const assets = await asset.all();
    const finishedPools = await pool.getFinishedPools();

    let profitabilities = [];
    for(let i=0; i<assets.length; i++){
        for(let m=0; m<finishedPools.length; m++){
            if(assets[i].pool_nr == finishedPools[m].nr){
                const purchase = assets[i].purchase;
                const rent = assets[i].rent;
                const static_costs = assets[i].static_costs;
                const tax = 0.19*(rent - static_costs);
                const operator_interest = 0.07*(rent - tax - static_costs);
                const netto = rent - tax - static_costs - operator_interest;
                const profitability = netto/purchase;
                profitabilities.push(profitability);
            }
        }  
    }

    let average = 0;
    for(let i=0; i<profitabilities.length; i++){
        average += profitabilities[i];
    }

    average = average/profitabilities.length;
    /** Mam średnią rentowność wszystkich aktywów */
    /** Teraz potrzebuję wartość konta użytkownika */
    const userAccountValue = await functions.calculate_userAccountValue(req.session.user._id);
    /** Zakładam wiek usera na 25 lat a przejście na emeryturę w wieku 65 z kwotą 2000 */
    const targetAge = 65;
    const currentAge = 25;
    const targetPension = 2000;
    const months = (targetAge - currentAge)*12;
    /** Muszę wyliczyć jaki jest potrzebny kapitał */
    /** capital*average = targetPension */
    const targetCapital = targetPension/average;
    const missingCapital = targetCapital - userAccountValue;
    const monthlyInvest = missingCapital/months;


    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/account/emerytura', {
        user: req.session.user,
        specyficUser: null,
        average: average*100,
        targetCapital,
        targetAge: targetAge,
        targetPension: targetPension,
        currentAge: currentAge,
        targetPension: targetPension,
        missingCapital: missingCapital,
        userAccountValue: userAccountValue,
        monthlyInvest: monthlyInvest,
        months: months,
        page: 'account_emerytura'
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


// MONEY

exports.money = async (req, res) => {

    const currentTime = moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss');

    const billing_period = functions.get_billing_period('2019-10-16');

    const asset = new Asset();
    const assetTransfers = new AssetTransfers();
    const billingPeriod = new BillingPeriod();
    let assetPeriodCosts = new AssetPeriodCosts();
    const pool = new Pool();
    const transfer = new Transfer();      

    const period = await billingPeriod.getPeriod(billing_period); //dla billibPeriod._id
    assetPeriodCosts = await assetPeriodCosts.all();
    const assets = await asset.all();
    const assetsTransfers = await assetTransfers.all();
    const finishedPools = await pool.getFinishedPools();
    const transfers = await transfer.all();

    //odpowiedni static costs w odpowiednim assecie na dany okres
    for(let i=0; i<assetPeriodCosts.length; i++){
        for(let m=0; m<assets.length; m++){
            if(assetPeriodCosts[i]._id.equals(period._id) && assetPeriodCosts[i].asset_id.equals(asset[m]._id)){
                transfers[m].static_costs = assetPeriodCosts[i].static_costs;
            }
        }
    }
    /**! Teraz mam zaktualizowane static_costs w każdym assecie według najnowszego okresu ! */
    const income_object = functions.calculate_total_netto(assets, assetsTransfers, billing_period);
    

    //tylko te pools z których zostało sfinansowane i dodane aktywo w danym okresie rozliczeniowym
    let pools = [];
    for(let i=0; i<finishedPools.length; i++){
        for(let m=0; m<assets.length; m++){
            if(assets[m].pool_nr == finishedPools[i].nr && functions.isDateExistBeforeEndingDate(assets[m].created_at, billing_period)) {
                pools.push(finishedPools[i]);
            }
        }
    }

    const user_percentage = functions.user_percentage(req.session.user._id, pools, transfers);


    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/money/index', {
        user: req.session.user,
        income_object: income_object,
        billing_period: billing_period,
        user_percentage: user_percentage,
        page: 'money'
    });
}


exports.money_history = async (req, res) => {

    const billingPeriod = new BillingPeriod();
    const billingPeriods = await billingPeriod.all();


    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/money/history', {
        user: req.session.user,
        billingPeriods: billingPeriods,
        page: 'money_history'
    });
}


exports.billingPeriod = async (req, res) => {

    const billing_period = functions.get_billing_period(req.params.date);

    const asset = new Asset();
    const assetTransfers = new AssetTransfers();
    const billingPeriod = new BillingPeriod();
    let assetPeriodCosts = new AssetPeriodCosts();
    const pool = new Pool();
    const transfer = new Transfer();

    const period = await billingPeriod.getPeriod(billing_period); //dla billibPeriod._id
    assetPeriodCosts = await assetPeriodCosts.all();
    const assets = await asset.all();
    const assetsTransfers = await assetTransfers.all();
    const finishedPools = await pool.getFinishedPools();
    const transfers = await transfer.all();

    //odpowiedni static costs w odpowiednim assecie na dany okres
    for(let i=0; i<assetPeriodCosts.length; i++){
        for(let m=0; m<assets.length; m++){
            if(assetPeriodCosts[i]._id.equals(period._id) && assetPeriodCosts[i].asset_id.equals(asset[m]._id)){
                transfers[m].static_costs = assetPeriodCosts[i].static_costs;
            }
        }
    }
    /**! Teraz mam zaktualizowane static_costs w każdym assecie według najnowszego okresu ! */
    const income_object = functions.calculate_total_netto(assets, assetsTransfers, billing_period);
    

    //tylko te pools z których zostało sfinansowane i dodane aktywo w danym okresie rozliczeniowym
    let pools = [];
    for(let i=0; i<finishedPools.length; i++){
        for(let m=0; m<assets.length; m++){
            if(assets[m].pool_nr == finishedPools[i].nr && functions.isDateExistBeforeEndingDate(assets[m].created_at, billing_period)) {
                pools.push(finishedPools[i]);
            }
        }
    }

    const user_percentage = functions.user_percentage(req.session.user._id, pools, transfers);


    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/money/specyfic', {
        user: req.session.user,
        income_object: income_object,
        billing_period: billing_period,
        user_percentage: user_percentage,
        page: 'money'
    });
}


// ASSETS

/*exports.assets = async (req, res) => {

    
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/assets/index', {
        user: req.session.user,
        
        page: 'assets'
    });
}*/



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


    /** Muszę policzyć przysługujące zyski użytkowników (za poprzedni okres rozliczeniowy) */
    const currentTime = moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss');
    const previous_billing_period = functions.get_billing_period('2019-11-16', 1);

    const assetTransfers = new AssetTransfers();
    const asset = new Asset();
    const user = new User();
    const transfer = new Transfer();
    const billingPeriod = new BillingPeriod();
    const billingPeriodTransfers = new BillingPeriodTransfers();

    const assetsTransfers = await assetTransfers.all();
    const assets = await asset.all();
    const users = await user.all();
    const finishedPools = await pool.getFinishedPools();
    const transfers = await transfer.all();
    const moneyu = await user.findUserByUsername('MoneyU');    
    const period = await billingPeriod.getPeriod(previous_billing_period); //dla period_id
    const periodTransfers = await billingPeriodTransfers.getForPeriod(period._id);

    //Najpierw muszę policzyć total zysk netto z poprzedniego okresu rozliczeniowego
    const income_object = functions.calculate_total_netto(assets, assetsTransfers, previous_billing_period);
    const total_netto = income_object.total_netto;

    //Ok teraz muszę policzyć udziały użytkowników za tamten okres

    //tylko te pools z których zostało sfinansowane i dodane aktywo w danym okresie rozliczeniowym
    let pools = [];
    for(let i=0; i<finishedPools.length; i++){
        for(let m=0; m<assets.length; m++){
            if(assets[m].pool_nr == finishedPools[i].nr && functions.isDateExistBeforeEndingDate(assets[m].created_at, previous_billing_period)) {
                pools.push(finishedPools[i]);
            }
        }
    }

    let transfers_array = [];
    //muszę wykluczyć transfery które zostały już zaznaczone jako wysłane

    for(let i=0; i<users.length; i++){
        let flag = false;
        for(let m=0; m<periodTransfers.length; m++){
            for(let n=0; n<transfers.length; n++){

                if(transfers[n]._id.equals(periodTransfers[m].transfer_id) && transfers[n].recipient_id.equals(users[i]._id)){
                    flag = true;
                }
            }

            if(!flag){
                const percentage = functions.user_percentage(users[i]._id, pools, transfers);
                const income = Math.floor(percentage*total_netto*100)/100;
                const data = {
                    author_id: ObjectID(moneyu._id),
                    recipient_id: ObjectID(users[i]._id),
                    author_username: 'MoneyU',
                    recipient_username: users[i].username,
                    amount: parseFloat(income),
                    title: 'ZYSK za ' + previous_billing_period.startingDate + ' ' + previous_billing_period.endingDate,
                    created_at: currentTime
                }
                if(income){
                    transfers_array.push(data);
                }
            }
        }
    }

    if(transfers_array.length){
        if(req.params.optional == 'send'){

            let transfers_ids = await transfer.createIncomesTransfers(transfers_array);
            transfers_ids = Object.entries(transfers_ids);
    
            const array = [];
            for(let i=0; i<transfers_ids.length; i++){
                array.push({
                    billingPeriod: ObjectID(period._id),
                    transfer_id: ObjectID(transfers_ids[i][1])
                });
            }
            await billingPeriodTransfers.createMany(array);
        }
    }

    

    /** ------------------------------------ */

    for(let i=0; i<transfers_array.length; i++){
        transfers_array[i].sum = transfers_array[0].amount;
    }


    for(let i=0; i<transfers_array.length; i++){
        if(i){
            transfers_array[i].sum = transfers_array[i].amount + transfers_array[i-1].sum;
        }
    }

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/admin/index', {
        user: req.session.user,
        pending_payments: pending_payments,
        currentPool: currentPool,
        transfers_array: transfers_array,
        previous_billing_period: previous_billing_period,
        total_netto: total_netto
    });
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
    let users = await user.all();

    users = await functions.usersNextPayments(users);

    /** Aktualizuję subkonto */
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/admin/users', {
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

    const asset = new Asset();
    const assets = await asset.all();

    for(let i=0; i<orders.length; i++){
        for(let m=0; m<assets.length; m++){
            if(assets[m]._id.equals(orders[i].orderable_id)){
                orders[i].asset = assets[m];
            }
        }
    }


    res.render('backend/admin/orders',{
        user: req.session.user,
        orders: orders
    });
}


/** END ADMIN */

/** INFORMATION */

exports.information = async (req, res) => {

    //podliczenie subkonta pod każdym rootem
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/information/index',{
        user: req.session.user,
        page: 'information'
    });
}


exports.information_regulamin = async (req, res) => {

    //podliczenie subkonta pod każdym rootem
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/information/regulamin',{
        user: req.session.user,
        page: 'information_regulamin'
    });
}


exports.information_faq = async (req, res) => {

    //podliczenie subkonta pod każdym rootem
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/information/faq',{
        user: req.session.user,
        page: 'information_faq'
    });
}


exports.information_mission = async (req, res) => {

    //podliczenie subkonta pod każdym rootem
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/information/mission',{
        user: req.session.user,
        page: 'information_mission'
    });
}


/** END INFORMATION */

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

    //produkty klienta na podstawie AssetClient
    const assetClient = new AssetClient();
    const userAssets = await assetClient.getUserRows(req.session.user._id);

    const asset = new Asset();
    const assets = await asset.all();

    let userProducts = [];

    for(let i=0; i<assets.length; i++){
        for(let m=0; m<userAssets.length; m++){
            if(assets[i]._id.equals(userAssets[m].asset_id)){
                userProducts.push(assets[i]);
            }
        }
    }

    /** ========================================== */

    // płatności za produkty
    const userNextPayments = await functions.userNextPayments(req.session.user._id);
    for(let i=0; i<userProducts.length; i++){
        for(let m=0; m<userNextPayments.length; m++){
            if(userProducts[i]._id.equals(userNextPayments[m].asset_id)){
                userProducts[i].nextPayment = userNextPayments[m];
            }
        }
    }
    /** =========================================== */

    /** ------ */
    const transfer = new Transfer();
    const transfers = await transfer.getAuthorTransfers(req.session.user._id);
    const assetTransfers = new AssetTransfers();
    const userAssetTransfers = await assetTransfers.userAssetTransfers(req.session.user._id);

    for(let i=0; i<userProducts.length; i++){
        userProducts[i].transfers = [];
    }

    for(let i=0; i<userProducts.length; i++){
        for(let m=0; m<userAssetTransfers.length; m++){
            if(userAssetTransfers[m].asset_id.equals(userProducts[i]._id)){
                const transfer_id = userAssetTransfers[m].transfer_id;

                for(let n=0; n<transfers.length; n++){
                    if(transfers[n]._id.equals(transfer_id)){
                        userProducts[i].transfers.push(transfers[n]);
                    }
                }
            }
        }
    }
    /** ------ */

    const p_s = await functions.calculate_subkonto(req.session.user._id);
    req.session.user.subkonto = p_s.subkonto;

    res.render('backend/products/my-products', {
        user: req.session.user,
        userProducts: userProducts,
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



exports.getPeriod = async (req, res) => {

    let billingPeriod = new BillingPeriod();
    const period = functions.get_billing_period();

    billingPeriod = await billingPeriod.getPeriod(period);

    res.send(billingPeriod.period.startingDate);
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


