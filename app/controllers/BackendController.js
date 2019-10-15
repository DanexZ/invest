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

    try{

        const currentDate = new Date(moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss'));
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentDay = currentDate.getDate();

        /**------------------------------------- */

        /******
         *  Needed models 
        *******/

        const transfer = new Transfer();
        const user = new User();
        const pool = new Pool();
        const asset = new Asset();

        /**-------------------------------------- */

        const userNextPaymentsPromise = functions.userNextPayments(req.session.user._id);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);
        const userAccountValuePromise = functions.calculate_userAccountValue(req.session.user._id);
        const userTransfersPromise = transfer.getRecipientTransfers(req.session.user._id);
        const transfersPromise = transfer.all();
        const currentUserPromise = user.findUserByUsername(req.session.user.username);
        const currentPoolPromise = pool.getCurrent();
        const assetsPromise = asset.all();
        const finishedPoolsPromise = pool.getFinishedPools();

        const [

            userNextPayments,
            p_s, userAccountValue, 
            userTransfers, 
            transfers, 
            currentUser,
            currentPool,
            assets,
            finishedPools

        ] = await Promise.all([

            userNextPaymentsPromise,
            p_sPromise,
            userAccountValuePromise,
            userTransfersPromise,
            transfersPromise,
            currentUserPromise,
            currentPoolPromise,
            assetsPromise,
            finishedPoolsPromise

        ]);


        /******
         *  Subkonto usera 
        *******/
        req.session.user.subkonto = p_s.subkonto;
        /** ------------------------------------- */


        /******
         *  obliczenie udziału w zbiórce 
        *******/
        let userPartCurrentPool = 0;
        
        if(currentPool){

            //trzeba pobrać jej transfery i podliczyć zbiórkę
            //podliczam udorazu udział aktualnie zalogowane usera
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

            userPartCurrentPool = user_part_in - user_part_out;
        }
        /** ------------------------------------- */

        /******
         *  Przyszły zysk 
        *******/
        let futureIncome = 0;
        if(userPartCurrentPool){
            futureIncome = Math.floor((userPartCurrentPool/currentPool.amount)*currentPool.profit_netto*100)/100;
        }
        /** --------------------------------------- */


        /******
         *  Chcę wyliczyć zysk użytkownika w bieżącym miesiącu, poprzednim i w tym roku
        *******/
        let currentMonthIncome = 0;
        let previousMonthIncome = 0;
        let currentYearIncome = 0;
        for(let i=0; i<userTransfers.length; i++){
            if(userTransfers[i].author_username == 'MoneyU' && userTransfers[i].title.includes('ZYSK')){
                const transferDate = new Date(userTransfers[i].created_at);
                const transferYear = transferDate.getFullYear();
                const transferMonth = transferDate.getMonth();

                if(transferYear == currentYear){
                    currentYearIncome += userTransfers[i].amount;
                }

                if(transferYear == currentYear && transferMonth == currentMonth){
                    currentMonthIncome += userTransfers[i].amount;
                }

                if(currentMonth == 0){
                    if(transferYear == currentYear - 1 && transferMonth == 11){
                        previousMonthIncome += userTransfers[i].amount;
                    }
                } else {
                    if(transferYear == currentYear && transferMonth == currentMonth - 1){
                        previousMonthIncome += userTransfers[i].amount;
                    }
                }
            }
        }
        /** ---------------------------------------------------------------------------------- */

        /******
         *  Emerytura
        *******/

        // muszę wyliczyć średnią rentowność
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
        // Mam średnią rentowność wszystkich aktywów 
        // Defaultowo zakładam wiek usera na 25 lat a przejście na emeryturę w wieku 65 z kwotą 2000
        let targetAge = 65;
        let currentAge = 25;
        let targetPension = 2000;

        // jeżeli user zadeklarował cel emerytalny zmień defaultowe wartości
        if(currentUser.targetPension){
            targetAge = currentUser.targetAge;
            targetPension = currentUser.targetPension;
            //muszę wyliczyć currentAge
            const userBirthDate = new Date(currentUser.birth);
            const userYear = userBirthDate.getFullYear();
            const userMonth = userBirthDate.getMonth();
            const userDay = userBirthDate.getDate();

            currentAge = currentYear - userYear;
            if( userMonth >= currentMonth && userDay > currentDay){
                currentAge--;
            }
            req.session.user.targetPension = user.targetPension;
        }
        const months = (targetAge - currentAge)*12;
        // Muszę wyliczyć jaki jest potrzebny kapitał
        // capital*average = targetPension
        const targetCapital = targetPension/average;
        const missingCapital = targetCapital - userAccountValue;
        const monthlyInvest = missingCapital/months;

        // muszę wiedzieć ile user zainwestował już w bieżącym miesiącu
        // może są zamknięte zbiórki z bieżącego miesiąca?
        let userPartLastPools = 0;
        let user_amount_in = 0;
        let user_amount_out = 0;

        for(let i=0; i<finishedPools.length; i++){
            
            for(let m=0; m<transfers.length; m++){
                if(finishedPools[i]._id.equals(transfers[m].recipient_id) && transfers[m].author_id.equals(req.session.user._id)){
                    const transferDate = new Date(transfers[m].created_at);
                    const transferYear = transferDate.getFullYear();
                    const transferMonth = transferDate.getMonth();

                    if(transferYear == currentYear && transferMonth == currentMonth){   
                        user_amount_in += transfers[m].amount;
                    } 
                }

                if(finishedPools[i]._id.equals(transfers[m].author_id && transfers[m].recipient_id.equals(req.session.user._id))){
                    const transferDate = new Date(transfers[m].created_at);
                    const transferYear = transferDate.getFullYear();
                    const transferMonth = transferDate.getMonth();

                    if(transferYear == currentYear && transferMonth == currentMonth){   
                        user_amount_out += transfers[m].amount;
                    } 
                }
            }
        }

        userPartLastPools = user_amount_in - user_amount_out;
        
        const currentMonthInvested = userPartCurrentPool + userPartLastPools;


        res.render('backend/index', {
            user: req.session.user,
            userNextPayments: userNextPayments,
            payments: p_s.payments,
            userAccountValue: userAccountValue,
            currentMonthIncome: currentMonthIncome,
            previousMonthIncome: previousMonthIncome,
            currentYearIncome: currentYearIncome,
            futureIncome,
            targetAge: targetAge,
            targetPension: targetPension,
            monthlyInvest: monthlyInvest,
            currentMonthInvested: currentMonthInvested
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });

    }
}

/** ACCOUNT */

exports.user_account = async (req, res) => {

    try {

        const user = new User();

        const specyficUserPromise = user.findUserByUsername(req.params.username);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            specyficUser,
            p_s

        ] = await Promise.all([

            specyficUserPromise,
            p_sPromise

        ]);


        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/account/account', {
            user: req.session.user,
            specyficUser: specyficUser,
            page: 'account'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });

    }
}

exports.user_password = async (req, res) => {

    try {

        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/account/password', {
            user: req.session.user,
            specyficUser: null,
            page: 'password'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });

    }
}


exports.user_documents = async (req, res) => {

    try {

        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/account/documents', {
            user: req.session.user,
            specyficUser: null,
            page: 'account_documents'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });

    }
}


exports.user_emerytura = async (req, res) => {

    try {

        /******
         *  Needed models 
        *******/

        const user = new User();
        const asset = new Asset();
        const pool = new Pool();

        /** -------------------------------------- */

        const assetsPromise = asset.all();
        const finishedPoolsPromise = pool.getFinishedPools();
        const currentUserPromise = user.findUserByUsername(req.session.user.username);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            assets,
            finishedPools,
            currentUser,
            p_s

        ] = await Promise.all([

            assetsPromise,
            finishedPoolsPromise,
            currentUserPromise,
            p_sPromise

        ]);

        /** ---------------------------------------- */

        //muszę wyliczyć średnią rentowność

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
        /** ---------------------------------------------- */


        /** Mam średnią rentowność wszystkich aktywów */
        /** Teraz potrzebuję wartość konta użytkownika */
        const userAccountValue = await functions.calculate_userAccountValue(req.session.user._id, finishedPools);
        /** Zakładam wiek usera na 25 lat a przejście na emeryturę w wieku 65 z kwotą 2000 */
        let targetAge = 65;
        let currentAge = 25;
        let targetPension = 2000;
        if(currentUser.targetPension){
            targetAge = currentUser.targetAge;
            targetPension = currentUser.targetPension;
            //muszę wyliczyć currentAge
            const userBirthDate = new Date(currentUser.birth);
            const userYear = userBirthDate.getFullYear();
            const userMonth = userBirthDate.getMonth();
            const userDay = userBirthDate.getDate();
            const currentDate = new Date(moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss'));
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            const currentDay = currentDate.getDate();

            currentAge = currentYear - userYear;
            if( userMonth >= currentMonth && userDay > currentDay){
                currentAge--;
            }
            req.session.user.targetPension = user.targetPension;
        }
        const months = (targetAge - currentAge)*12;
        /** Muszę wyliczyć jaki jest potrzebny kapitał */
        /** capital*average = targetPension */
        const targetCapital = targetPension/average;
        const missingCapital = targetCapital - userAccountValue;
        const monthlyInvest = missingCapital/months;



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

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}

/** END ACCOUNT */


/** POOLS */

exports.pools_index = async (req, res) => {

    try {

        /******
         *  Needed models 
        *******/

        const pool = new Pool();
        const transfer = new Transfer();

        /** -------------------------------- */

        const currentPoolPromise = pool.getCurrent();
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            currentPool,
            p_s

        ] = await Promise.all([

            currentPoolPromise,
            p_sPromise

        ]);
        /** ------------------------------------- */



        if(currentPool){

            //trzeba pobrać jej transfery i podliczyć zbiórkę
            //podliczam odrazu udział aktualnie zalogowane usera
            
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
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/pools/index', {
            user: req.session.user,
            currentPool: currentPool,
            page: 'pools_currentPool'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.pools_history = async (req, res) => {

    try {

        /******
         *  Needed models 
        *******/

        const pool = new Pool();
        const transfer = new Transfer();
        /** ------------------------------------- */

        const poolsPromise = pool.getPools();
        const transfersPromise = transfer.all();
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            pools,
            transfers,
            p_s

        ] = Promise.all([

            poolsPromise,
            transfersPromise,
            p_sPromise

        ]);

        /** ------------------------------------ */
        

        for(let i=0; i<pools.length; i++){

            let shareholders = [];

            for(let m=0; m<transfers.length; m++){

                let item = transfers[m];

                if(pools[i]._id.equals(transfers[m].recipient_id) || pools[i]._id.equals(transfers[m].author_id)){

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
                        if(shareholders[n].username == transfers[m].author_username){
                            shareholders[n].value += transfers[m].amount;
                        }

                        if(shareholders[n].username ==transfers[m].recipient_username){
                            shareholders[n].value -= transfers[m].amount;
                        }
                    }
                }
            }

            pools[i].shareholders = shareholders;

        }

        /** Aktualizuję subkonto */
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/pools/history', {
            user: req.session.user,
            pools: pools,
            page: 'pools_history'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.pools_single = async (req, res) => {

    try {

        /******
         *  Needed models 
        *******/
        const pool = new Pool();
        const transfer = new Transfer();
        /** -------------------------------- */

        const specyficPoolPromise = pool.getPoolById(req.params.id);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            specyficPool,
            p_s

        ] = await Promise.all([

            specyficPoolPromise,
            p_sPromise

        ]);
        /** ---------------------------------------------------------- */


        if(specyficPool){

            //trzeba pobrać jej transfery i podliczyć zbiórkę
            //podliczam udorazu udział aktualnie zalogowane usera
            let in_transfers = await transfer.getRecipientTransfers(specyficPool._id);
            let out_transfers = await transfer.getAuthorTransfers(specyficPool._id);

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


            specyficPool.total = in_sum - out_sum;
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

            specyficPool.shareholders = shareholders;

            //zmienna dla max value
            specyficPool.max = specyficPool.amount - specyficPool.total;
        }
        /** ------------------------------------------------------------- */


        /** Aktualizuję subkonto */
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/pools/single', {
            user: req.session.user,
            pool: specyficPool
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}

/** END POOLS */



// MONEY

exports.money = async (req, res) => {
    
    try {

        const currentTime = moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss');

        const billing_period = functions.get_billing_period('2019-10-16');

        /******
         *  Needed models 
        *******/
    
        const asset = new Asset();
        const assetTransfers = new AssetTransfers();
        const billingPeriod = new BillingPeriod();
        const assetPeriodCostsC = new AssetPeriodCosts();
        const pool = new Pool();
        const transfer = new Transfer();
        
        /**------------------------------------------------------ */

        const periodPromise = billingPeriod.getPeriod(billing_period); //dla billibPeriod._id
        const assetPeriodCostsPromise = assetPeriodCostsC.all();
        const assetsPromise = asset.all();
        const assetsTransfersPromise = assetTransfers.all();
        const finishedPoolsPromise = pool.getFinishedPools();
        const transfersPromise = transfer.all();
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            period,
            assetPeriodCosts,
            assets,
            assetsTransfers,
            finishedPools,
            transfers,
            p_s

        ] = await Promise.all([

            periodPromise,
            assetPeriodCostsPromise,
            assetsPromise,
            assetsTransfersPromise,
            finishedPoolsPromise,
            transfersPromise,
            p_sPromise

        ]);
        /** -------------------------------------------------------- */


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
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/money/index', {
            user: req.session.user,
            income_object: income_object,
            billing_period: billing_period,
            user_percentage: user_percentage,
            page: 'money'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.money_history = async (req, res) => {

    try {

        const billingPeriod = new BillingPeriod();

        const billingPeriodsPromise =  billingPeriod.all();
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            billingPeriods,
            p_s

        ] = await Promise.all([

            billingPeriodsPromise,
            p_sPromise

        ]);
        /** ---------------------------------------------- */


        /** Aktualizuję subkonto */
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/money/history', {
            user: req.session.user,
            billingPeriods: billingPeriods,
            page: 'money_history'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.billingPeriod = async (req, res) => {

    try {

        const billing_period = functions.get_billing_period(req.params.date);

        /******
         *  Needed models 
        *******/

        const asset = new Asset();
        const assetTransfers = new AssetTransfers();
        const billingPeriod = new BillingPeriod();
        const assetPeriodCostsC = new AssetPeriodCosts();
        const pool = new Pool();
        const transfer = new Transfer();

        /** ----------------------------------------------------- */

        const periodPromise = billingPeriod.getPeriod(billing_period); //dla billibPeriod._id
        const assetPeriodCostsPromise = assetPeriodCostsC.all();
        const assetsPromise = asset.all();
        const assetsTransfersPromise = assetTransfers.all();
        const finishedPoolsPromise = pool.getFinishedPools();
        const transfersPromise = transfer.all();
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            period,
            assetPeriodCosts,
            assets,
            assetsTransfers,
            finishedPools,
            transfers,
            p_s

        ] = await Promise.all([

            periodPromise,
            assetPeriodCostsPromise,
            assetsPromise,
            assetsTransfersPromise,
            finishedPoolsPromise,
            transfersPromise,
            p_sPromise

        ]);
        /** --------------------------------------------------------- */

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
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/money/specyfic', {
            user: req.session.user,
            income_object: income_object,
            billing_period: billing_period,
            user_percentage: user_percentage,
            page: 'money'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.assets_properties = async (req, res) => {

    try {

        const asset = new Asset();

        const propertiesPromise = asset.getProperties();
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            properties,
            p_s

        ] = await Promise.all([

            propertiesPromise,
            p_sPromise

        ]);
        /** ---------------------------------------- */


        /** Aktualizuję subkonto */
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/assets/properties', {
            user: req.session.user,
            properties: properties,
            page: 'properties'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
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

    try {

        const assetTransfersC = new AssetTransfers();

        const assetTransfersPromise = assetTransfersC.ofAsset(req.params.id);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            assetTransfers,
            p_s

        ] = await Promise.all([

            assetTransfersPromise,
            p_sPromise

        ]);
        /** ---------------------------------------------------- */


        /** Aktualizuję subkonto */
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/assets/incomes', {
            user: req.session.user,
            assetTransfers: assetTransfers,
            page: 'incomes'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


// ADMIN

exports.admin = async (req, res) => {

    try {

        /******
         *  Needed models 
        *******/

        const payment = new Payment();
        const pool = new Pool();
        const transfer = new Transfer();
        const assetTransfers = new AssetTransfers();
        const asset = new Asset();
        const user = new User();
        const billingPeriod = new BillingPeriod();
        const billingPeriodTransfers = new BillingPeriodTransfers();

        /** ----------------------------------------------------- */

        const assetsTransfersPromise = assetTransfers.all();
        const assetsPromise = asset.all();
        const usersPromise = user.all();
        const finishedPoolsPromise = pool.getFinishedPools();
        const transfersPromise = transfer.all();
        const moneyuPromise = user.findUserByUsername('MoneyU');    
        const periodPromise = billingPeriod.getPeriod(previous_billing_period); //dla period_id
        const periodTransfersPromise = billingPeriodTransfers.getForPeriod(period._id);
        const paymentsPromise = payment.getPayments();
        const currentPoolPromise = pool.getCurrent()
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            assetsTransfers,
            assets,
            users,
            finishedPools,
            transfers,
            moneyu,
            period,
            periodTransfers,
            payments,
            currentPool,
            p_s

        ] = await Promise.all([

            assetsTransfersPromise,
            assetsPromise,
            usersPromise,
            finishedPoolsPromise,
            transfersPromise,
            moneyuPromise,
            periodPromise,
            periodTransfersPromise,
            paymentsPromise,
            currentPoolPromise,
            p_sPromise

        ]);
        /** --------------------------------------------------------------------- */


        let pending_payments = [];
        
        for(let i=0; i<payments.length; i++){
            if(payments[i].status == 'pending'){
                pending_payments.push(payments[i]);
            }
        }
        /** ------------------------ END PAYMENTS -------------------------------- */

        
        
        if(currentPool){
            
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

        /** ----------------------------------------------------------------------------------- */


        /** Muszę policzyć przysługujące zyski użytkowników (za poprzedni okres rozliczeniowy) */
        const currentTime = moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss');
        const previous_billing_period = functions.get_billing_period('2019-11-16', 1);


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
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/admin/index', {
            user: req.session.user,
            pending_payments: pending_payments,
            currentPool: currentPool,
            transfers_array: transfers_array,
            previous_billing_period: previous_billing_period,
            total_netto: total_netto
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.admin_pools = async (req, res) => {

    try {

        const pool = new Pool();

        const poolsPromise = pool.getPools();
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            pools,
            p_s

        ] = await Promise.all([

            poolsPromise,
            p_sPromise

        ]);
        /** -------------------------------------------------------- */


        /** Aktualizuję subkonto */
        
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/admin/pools',{
            user: req.session.user,
            pools: pools,
            page: 'admin_pools'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.admin_pools_create = async (req, res) => {

    try {

        /** Aktualizuję subkonto */
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/admin/pools_create',{
            user: req.session.user,
            page: 'admin_pools_create'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.admin_users = async (req, res) => {

    try {

        const user = new User();

        const users = await user.all();

        const usersWithPaymentsPromise = functions.usersNextPayments(users);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            usersWithPayments,
            p_s

        ] = await Promise.all([

            usersWithPaymentsPromise,
            p_sPromise

        ]);
        /** --------------------------------------------------------- */


        /** Aktualizuję subkonto */
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/admin/users', {
            user: req.session.user,
            users: usersWithPayments,
            page: 'admin_users'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.admin_asset = async (req, res) => {

    try {

        const asset = new Asset();

        const specyficAssetPromise = asset.getAsset(req.params.id);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            specyficAsset,
            p_s

        ] = await Promise.all([

            specyficAssetPromise,
            p_sPromise

        ]);
        /** ------------------------------------------------------ */

        /** Aktualizuję subkonto */
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/admin/asset',{
            user: req.session.user,
            asset: specyficAsset,
            page: 'admin_asset'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.admin_assets = async (req, res) => {

    try {

        /** Aktualizuję subkonto */
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/admin/assets',{
            user: req.session.user
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.admin_orders = async (req, res) => {

    try {

        const order = new Order();
        const asset = new Asset();

        const ordersPromise = order.all();
        const assetsPromise = asset.all();
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            orders,
            assets,
            p_s

        ] = await Promise.all([

            ordersPromise,
            assetsPromise,
            p_sPromise

        ]);
        /** -------------------------------------------------- */


        for(let i=0; i<orders.length; i++){
            for(let m=0; m<assets.length; m++){
                if(assets[m]._id.equals(orders[i].orderable_id)){
                    orders[i].asset = assets[m];
                }
            }
        }


        /** Aktualizuję subkonto */
        req.session.user.subkonto = p_s.subkonto;


        res.render('backend/admin/orders',{
            user: req.session.user,
            orders: orders
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


/** END ADMIN */


/** INFORMATION */

exports.information = async (req, res) => {

    try {

        //podliczenie subkonta pod każdym rootem
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/information/index',{
            user: req.session.user,
            page: 'information'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.information_regulamin = async (req, res) => {

    try {

        //podliczenie subkonta pod każdym rootem
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/information/regulamin',{
            user: req.session.user,
            page: 'information_regulamin'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.information_politics = async (req, res) => {

    try {

        //podliczenie subkonta pod każdym rootem
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/information/politics',{
            user: req.session.user,
            page: 'information_politics'
        });
    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.information_faq = async (req, res) => {

    try {

        //podliczenie subkonta pod każdym rootem
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/information/faq',{
            user: req.session.user,
            page: 'information_faq'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.information_mission = async (req, res) => {

    try {

        //podliczenie subkonta pod każdym rootem
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/information/mission',{
            user: req.session.user,
            page: 'information_mission'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}

/** END INFORMATION */


//SUBKONTO

exports.subkonto = async (req, res) => {

    try {

        //muszę pobrać payments, transfers, withrawals i je skonkatenować

        const payment = new Payment();
        const transfer = new Transfer();

        const paymentsPromise = payment.getPayments(req.session.user._id);
        const in_transfersPromise = transfer.getRecipientTransfers(req.session.user._id);
        const out_transfersPromise = transfer.getAuthorTransfers(req.session.user._id);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            payments,
            in_transfers, 
            out_transfers,
            p_s

        ] = await Promise.all([

            paymentsPromise, 
            in_transfersPromise, 
            out_transfersPromise,
            p_sPromise

        ]);

        /** ------------------------------------------------------------------------------ */


        const transactions = payments.concat(in_transfers).concat(out_transfers);

        transactions.sort( (a,b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });

        /** ------------------------------------------------------------------------------ */


        //aktualizacja subkonta
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/subkonto/index', {
            user: req.session.user,
            page: 'subkonto_history',
            transactions: transactions
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.subkonto_inpay = async (req, res) => {

    try {
    
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/subkonto/inpay', {
            user: req.session.user,
            page: 'inpay'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.subkonto_send_money = async (req, res) => {

    try {

        //podliczenie subkonta pod każdym rootem
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/subkonto/send_money', {
            user: req.session.user,
            page: 'send_money'
        });
    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}

/** END SUBKONTO */

/** PRODUCTS */

exports.my_products = async (req, res) => {

    try {

        /******
         *  Needed models 
        *******/

        const assetClient = new AssetClient();
        const asset = new Asset();
        const transfer = new Transfer();
        const assetTransfers = new AssetTransfers();

        /** ---------------------------------------------------------------- */

        const userAssetsPromise = assetClient.getUserRows(req.session.user._id);
        const assetsPromise = asset.all();
        const userNextPaymentsPromise = functions.userNextPayments(req.session.user._id);
        const transfersPromise = transfer.getAuthorTransfers(req.session.user._id);
        const userAssetTransfersPromise = assetTransfers.userAssetTransfers(req.session.user._id);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            userAssets,
            assets,
            userNextPayments,
            transfers,
            userAssetTransfers,
            p_s

        ] = await Promise.all([

            userAssetsPromise,
            assetsPromise,
            userNextPaymentsPromise,
            transfersPromise,
            userAssetTransfersPromise,
            p_sPromise

        ]);
        /** ------------------------------------------------------------------- */


        let userProducts = [];

        for(let i=0; i<assets.length; i++){
            for(let m=0; m<userAssets.length; m++){
                if(assets[i]._id.equals(userAssets[m].asset_id)){
                    userProducts.push(assets[i]);
                }
            }
        }

        /** ------------------------------------------------------------------- */


        // płatności za produkty
        
        for(let i=0; i<userProducts.length; i++){
            for(let m=0; m<userNextPayments.length; m++){
                if(userProducts[i]._id.equals(userNextPayments[m].asset_id)){
                    userProducts[i].nextPayment = userNextPayments[m];
                }
            }
        }

        /** -------------------------------------------------------------------- */

    

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

        /** ---------------------------------------------------------------------- */

        // Aktualizacja subkonta
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/products/my-products', {
            user: req.session.user,
            userProducts: userProducts,
            page: 'my_products'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.products_property = async (req, res) => {

    try {

        const user = new User();
        const asset = new Asset();

        //muszę pobrać na nowo użytkownika aby mieć jego aktualny status

        const propertyPromise = asset.getProperty(req.params.id);
        const currentUserPromise = user.findUserByUsername(req.session.user.username);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            property,
            currentUser,
            p_s

        ] = await Promise.all([

            propertyPromise,
            currentUserPromise,
            p_sPromise

        ]);

        /** ------------------------------------------------------------ */


        req.session.user.status = currentUser.status;
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/products/property', {
            user: req.session.user,
            property: property,
            page: 'product_property'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.products_properties = async (req, res) => {

    try {

        //muszę pobrać produkty możliwe do zamówienia przez usera
        const asset = new Asset();

        const propertiesPromise = asset.getProperties();
        const p_sPromise = await functions.calculate_subkonto(req.session.user._id);

        const [

            properties,
            p_s

        ] = await Promise.all([

            propertiesPromise,
            p_sPromise

        ]);

        /** ------------------------------------------------------ */


        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/products/properties', {
            user: req.session.user,
            properties: properties,
            page: 'properties'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.orders = async (req, res) => {

    try {

        const order = new Order();

        const ordersPromise = order.getUserOrders(req.session.user._id);
        const p_sPromise = functions.calculate_subkonto(req.session.user._id);

        const [

            orders,
            p_s

        ] = await Promise.all([

            ordersPromise,
            p_sPromise

        ]);

        /** -------------------------------------------------------- */


        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/orders/orders', {
            user: req.session.user,
            orders: orders,
            page: 'orders'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}



exports.getPeriod = async (req, res) => {

    try {

        let billingPeriod = new BillingPeriod();
        const period = functions.get_billing_period();

        billingPeriod = await billingPeriod.getPeriod(period);

        res.send(billingPeriod.period.startingDate);

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.loans = async (req, res) => {

    try {

        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/loans/index', {
            user: req.session.user,
            page: 'loans'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.messages = async (req, res) => {

    try {
    
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/messages/index', {
            user: req.session.user,
            page: 'messages'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


exports.forum = async (req, res) => {

    try {
    
        const p_s = await functions.calculate_subkonto(req.session.user._id);
        req.session.user.subkonto = p_s.subkonto;

        res.render('backend/forum/index', {
            user: req.session.user,
            page: 'forum'
        });

    } catch(e) {

        res.status(500).send({
            message: e
        });
    }
}


