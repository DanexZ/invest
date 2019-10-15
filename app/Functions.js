const Transfer = require('./models/Transfer');
const Pool = require('./models/Pool');
const Payment = require('./models/Payment');
const Asset = require('./models/Asset');
const AssetClient = require('./models/AssetClient');
const AssetTransfers = require('./models/AssetTransfers');
const moment = require('moment');
const timezone = require('moment-timezone');
const bcrypt = require('bcryptjs');

class Functions{


    get_billing_period(time, toSubtract=null){

        
        const currentDate = new Date(time);

        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth() + 1;
        const currentDay = currentDate.getDate();

        if(toSubtract){

            //można odejmować tylko o 1 !

            if(currentMonth == 1){
                currentYear--;
                currentMonth = 12;
            } else {
                currentMonth -= toSubtract;
            }
        }

        let nextYear;
        let nextMonth;

        let previousYear;
        let previousMonth;

        const billing_period = {
            startingDate: '',
            endingDate: ''
        }

        if(currentDay > 15){

            if(currentMonth == 12){
                nextYear = currentYear + 1;
                nextMonth = 1;
            } else {
                nextYear = currentYear;
                nextMonth = currentMonth + 1;
            }

            if(currentMonth < 10){
                currentMonth = '0' + currentMonth;
            }

            if(nextMonth < 10){
                nextMonth = '0' + nextMonth;
            }

            billing_period.startingDate = currentYear+'-'+currentMonth+'-16';
            billing_period.endingDate = nextYear+'-'+nextMonth+'-15';

        } else {

            if(currentMonth == 1){
                previousYear = currentYear - 1;
                previousMonth = 12;
                currentMonth = '01';
            } else {
                previousYear = currentYear;
                previousMonth = currentMonth - 1;

                if(currentMonth < 10){
                    currentMonth = '0' + currentMonth;
                }

                if(previousMonth < 10){
                    previousMonth = '0' + previousMonth;
                }
            }

            billing_period.startingDate = previousYear+'-'+previousMonth+'-16';
            billing_period.endingDate = currentYear+'-'+currentMonth+'-15';

        }

        

        return billing_period;
    }


    calculate_subkonto(user_id){
        return new Promise(async (resolve, reject) => {

            const payment = new Payment();
            const transfer = new Transfer(); 

            let payments_promise = payment.getPayments(user_id);
            let in_transfers_promise = transfer.getRecipientTransfers(user_id);
            let out_transfers_promise = transfer.getAuthorTransfers(user_id);


            let [payments, in_transfers, out_transfers] = await Promise.all([payments_promise, in_transfers_promise, out_transfers_promise]);

            let in_sum = 0;
            let out_sum = 0;

            for(let i=0; i<in_transfers.length; i++){
                in_sum += in_transfers[i].amount;
            }

            for(let i=0; i<out_transfers.length; i++){
                out_sum += out_transfers[i].amount;
            }


            let subkonto = 0;

            if(payments.length){
                for(let i=0; i<payments.length; i++){
                    if(payments[i].status === 'verified'){
                        subkonto += payments[i].amount;
                    }
                }
            }

            subkonto = subkonto + in_sum - out_sum;

            resolve({payments: payments, subkonto: subkonto});
        });
    }




    user_percentage(user_id, finishedPools, transfers){

        let pools_total = 0
        let user_part_in = 0;
        let user_part_out = 0;

        for(let i=0; i<finishedPools.length; i++){

            pools_total += finishedPools[i].amount;

            for(let m=0; m<transfers.length; m++){
                if(transfers[m].recipient_id.equals(finishedPools[i]._id) && transfers[m].author_id.equals(user_id) ){
                    user_part_in += transfers[m].amount;
                }

                if(transfers[m].author_id.equals(finishedPools[i]._id) && transfers[m].recipient_id.equals(user_id) ){
                    user_part_out += transfers[m].amount;
                }
            }
        }

        let user_part = 0;

        if(pools_total){
            user_part = (user_part_in - user_part_out)/pools_total;
        }
        
        return user_part;
    }



    calculate_total_netto(assets, assetsTransfers, period){

            const income_object = {
                assets: [], //wewnątrz {asset_id, transfers: [], brutto, netto}
                total_brutto: 0,
                total_netto: 0
            }

            const startingDate = new Date(period.startingDate);
            const startingYear = startingDate.getFullYear();
            const startingMonth = startingDate.getMonth();
            
            const endingDate = new Date(period.endingDate);
            const endingYear = endingDate.getFullYear();
            const endingMonth = endingDate.getMonth();
            const endingDay = endingDate.getDate();


            for(let i=0; i<assets.length; i++){

                let asset_name;

                if(assets[i].type == 'Kawalerka' || assets[i].type == 'Mieszkanie'){
                    asset_name = assets[i].type + ' ' + assets[i].street + '/' + assets[i].apartment_nr + ' ' + assets[i].postcode + ' ' + assets[i].city;
                }

                income_object.assets.push({
                    asset_id: assets[i]._id,
                    asset_name: asset_name,
                    incomes: [],
                    costs: [],
                    incomes_sum: 0,
                    costs_sum: 0
                });
            }


            for(let i=0; i<assetsTransfers.length; i++){
                for(let m=0; m<income_object.assets.length; m++){
                    if(income_object.assets[m].asset_id.equals(assetsTransfers[i].asset_id)){

                        //muszę wziąć transfery które mieszczą się w przedziale period, nie muszę tu sprawdzać dnia miesiąca

                        const periodDate = new Date(assetsTransfers[i].period);
                        const periodYear = periodDate.getFullYear();
                        const periodMonth = periodDate.getMonth();
                        const periodDay = periodDate.getDate();
                        
                        let brutto = 0;
                        let tax = 0;
                        let static_costs = 0;
                        let operator_interest = 0;
                        let netto = 0;
                        let flag = false;

                        if(periodYear > startingYear ){

                            if( periodYear == endingYear && periodMonth == 0 && periodDay <= endingDay ){
                                flag = true;
                            }

                        } else if(periodYear == startingYear){


                            if(periodYear == endingYear){

                                if(periodMonth == endingMonth && periodDay < 16){
                                    flag = true;
                                } else if(periodMonth == startingMonth && periodDay > 15){
                                    flag = true;
                                }

                            } else if (periodYear < endingYear){

                                if(periodMonth == 11 && periodDay > 15){
                                    flag = true
                                }
                            }
                        }

                        if(flag){

                            brutto = assetsTransfers[i].amount;
                            static_costs = assets[m].static_costs;
                            tax = 0.19*(brutto - static_costs);
                            operator_interest = 0.07*(brutto - tax - static_costs);

                            income_object.assets[m].incomes.push({
                                amount: brutto,
                                created_at: assetsTransfers[i].created_at
                            });

                            income_object.assets[m].costs.push({
                                static_costs: static_costs,
                                tax: tax,
                                operator: operator_interest,
                                amount: static_costs + tax + operator_interest
                            });

                        }

                        netto = brutto - tax - static_costs - operator_interest;
                        income_object.total_brutto += brutto;
                        income_object.total_netto += netto;
                    }
                }
            }

            let income_sums = [];
            let cost_sums = [];

            for(let i=0; i<income_object.assets.length; i++){

                let income_sum = 0;
                let cost_sum = 0;

                for(let m=0; m<income_object.assets[i].incomes.length; m++){
                    income_sum += income_object.assets[i].incomes[m].amount;
                }

                for(let m=0; m<income_object.assets[i].costs.length; m++){
                    cost_sum += income_object.assets[i].costs[m].amount;
                }

                income_sums.push(income_sum);
                cost_sums.push(cost_sum);
            }

            for(let i=0; i<income_sums.length; i++){
                if(i){
                    income_sums[i] = income_sums[i] + income_sums[i-1];
                }

                income_object.assets[i].incomes_sum = income_sums[i];
            }

            for(let i=0; i<cost_sums.length; i++){
                if(i){
                    cost_sums[i] = cost_sums[i] + cost_sums[i-1];
                }

                income_object.assets[i].costs_sum = cost_sums[i];
            }

            return income_object;
    }




    matchDateToPeriod(date, billingPeriod){

        const startingDate = new Date(billingPeriod.startingDate);
        const startingYear = startingDate.getFullYear();
        const startingMonth = startingDate.getMonth();
        
        const endingDate = new Date(billingPeriod.endingDate);
        const endingYear = endingDate.getFullYear();
        const endingMonth = endingDate.getMonth();
        const endingDay = endingDate.getDate();


        const specyficDate = new Date(date);
        const specyficYear = specyficDate.getFullYear();
        const specyficMonth = specyficDate.getMonth();
        const specyficDay = specyficDate.getDate();

        let flag = false;

        if(specyficYear > startingYear ){

            if( specyficYear == endingYear && specyficMonth == 0 && specyficDay <= endingDay ){
                flag = true;
            }

        } else if(specyficYear == startingYear){


            if(specyficYear == endingYear){

                if(specyficMonth == endingMonth && specyficDay < 16){
                    flag = true;
                } else if(specyficMonth == startingMonth && specyficDay > 15){
                    flag = true;
                }

            } else if (specyficYear < endingYear){

                if(specyficMonth == 11 && specyficDay > 15){
                    flag = true
                }
            }
        }

        return flag;

    }



    isDateExistBeforeEndingDate(date, billingPeriod){
        const endingDate = new Date(billingPeriod.endingDate);
        const endingYear = endingDate.getFullYear();
        const endingMonth = endingDate.getMonth();
        const endingDay = endingDate.getDate();

        const specyficDate = new Date(date);
        const specyficYear = specyficDate.getFullYear();
        const specyficMonth = specyficDate.getMonth();
        const specyficDay = specyficDate.getDate();

        let flag = false;

        if(specyficYear == endingYear && specyficMonth == endingMonth && specyficDay <= endingDay){
            flag = true;
        } else if (specyficYear < endingYear || specyficMonth < endingMonth){
            flag = true;
        }

        return flag;
    }




    autorizeUser(inputPassword, sessionPassword){
        return bcrypt.compareSync(inputPassword, sessionPassword);
    }





    userNextPayments(user_id){
        return new Promise(async (resolve, reject) => {

            let nextPayments = [];
            const currentDate = new Date(moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss'));
            let currentYear = currentDate.getFullYear();
            let currentMonth = currentDate.getMonth();
            let nextYear;
            let nextMonth;

            const assetClient = new AssetClient();
            const asset = new Asset();
            const assetTransfer = new AssetTransfers();

            const assetTransfers = await assetTransfer.all();
            const userAssets = await assetClient.getUserRows(user_id);
            const assets = await asset.all();

            for(let i=0; i<assets.length; i++){
                for(let m=0; m<userAssets.length; m++){
                    if(assets[i]._id.equals(userAssets[m].asset_id)){
                        
                        const userMovingInDate = new Date(userAssets[m].created_at);
                        let amount;
                        let termin;
                        let sum = 0;

                        if(assets[i].type == 'Kawalerka' || assets[i].type == 'Mieszkanie'){
                            amount = assets[i].rent;

                            //muszę wiedzieć jaka jest aktualna data a później czy w bieżącym miesiącu rozliczeniowym został już opłacomy czynsz
                            let transfers = [];
                            for(let n=0; n<assetTransfers.length; n++){
                                if(assetTransfers[n].asset_id.equals(assets[i]._id) && assetTransfers[n].client_id.equals(user_id)){
                                    transfers.push(assetTransfers[n]);
                                }
                            }

                            let lastTransferPeriod;
                            let lastTransferPeriodYear;
                            let lastTransferPeriodMonth;
                            let diff;
                            
                            if(transfers.length){
                                const lastPeriod = transfers[transfers.length-1].period;

                                //wyliczenie sumy przelewów na dany period  
                                for(let n=0; n<transfers.length; n++){
                                    if(transfers[n].period == lastPeriod ){
                                        sum += transfers[n].amount;
                                    }
                                }

                                /** ==================================== */

                                lastTransferPeriod = new Date(lastPeriod);
                                lastTransferPeriodYear = lastTransferPeriod.getFullYear();
                                lastTransferPeriodMonth = lastTransferPeriod.getMonth();
                            }
                            
                            if(lastTransferPeriod && sum == assets[i].rent){

                                nextMonth = lastTransferPeriodMonth + 2; //dodaje dwa zamiast jeden bo styczen to 0
                                if(nextMonth > 12){
                                    nextMonth = '01';
                                    nextYear = lastTransferPeriodYear + 1;
                                } else {
                                    nextYear = lastTransferPeriodYear;
                                    if( nextMonth < 10 ){
                                        nextMonth = '0' + nextMonth; // no i tutaj bedzie 01 jesli styczen a nie 0
                                    }
                                } 

                            } else if(lastTransferPeriod){

                                nextMonth = lastTransferPeriodMonth +1; //dodaje dwa zamiast jeden bo styczen to 0
                                nextYear = currentYear;
                                if(nextMonth < 10){
                                    nextMonth = '0' + nextMonth; // no i tutaj bedzie 01 jesli styczen a nie 0
                                }

                                amount = amount - sum;

                            } else {

                                //nie ma jeszcze płatności wię trzeba sprawdzić wprowadzkę
                                if(currentDate.getFullYear() === userMovingInDate.getFullYear() && currentDate.getMonth() === userMovingInDate.getMonth()){
                                    diff = 1;
                                } else {
                                    diff = 0;
                                }

                                nextMonth = currentMonth + (diff+1); //dodaje dwa zamiast jeden bo styczen to 0
                                if(nextMonth > 12){
                                    nextMonth = '01';
                                    nextYear = currentYear + 1;
                                } else {
                                    nextYear = currentYear;
                                    if(nextMonth < 10){
                                        nextMonth = '0' + nextMonth; // no i tutaj bedzie 01 jesli styczen a nie 0
                                    }
                                }
                            }

                            termin = nextYear+'-'+nextMonth+'-11';
                            
                        }



                        const data = {
                            type: assets[i].type,
                            amount: amount,
                            asset_id: assets[i]._id,
                            termin: termin
                        }

                        nextPayments.push(data);
                    }
                }
            }

            resolve(nextPayments);

        });
    }


    usersNextPayments(users){
        return new Promise(async (resolve, reject) => {

            let nextPayments = [];
            const currentDate = new Date(moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss'));
            let currentYear = currentDate.getFullYear();
            let currentMonth = currentDate.getMonth();
            let nextYear;
            let nextMonth;

            const assetClient = new AssetClient();
            const asset = new Asset();
            const assetTransfer = new AssetTransfers();

            const assetTransfers = await assetTransfer.all();
            const clientAssets = await assetClient.all();
            const assets = await asset.all();

            for(let h=0; h<users.length; h++){

                users[h].nextPayments = [];

                for(let i=0; i<assets.length; i++){
                    for(let m=0; m<clientAssets.length; m++){
                        if(assets[i]._id.equals(clientAssets[m].asset_id) && clientAssets[m].client_id.equals(users[h]._id)){
                            
                            const userMovingInDate = new Date(clientAssets[m].created_at);
                            let amount;
                            let termin;
                            let sum = 0;
    
                            if(assets[i].type == 'Kawalerka' || assets[i].type == 'Mieszkanie'){
                                amount = assets[i].rent;
    
                                //muszę wiedzieć jaka jest aktualna data a później czy w bieżącym miesiącu rozliczeniowym został już opłacomy czynsz
                                let transfers = [];
                                for(let n=0; n<assetTransfers.length; n++){
                                    if(assetTransfers[n].asset_id.equals(assets[i]._id) && assetTransfers[n].client_id.equals(users[h]._id)){
                                        transfers.push(assetTransfers[n]);
                                    }
                                }
    
                                let lastTransferPeriod;
                                let lastTransferPeriodYear;
                                let lastTransferPeriodMonth;
                                let diff;
                                
                                if(transfers.length){
                                    const lastPeriod = transfers[transfers.length-1].period;

                                    //wyliczenie sumy przelewów na dany period  
                                    for(let n=0; n<transfers.length; n++){
                                        if(transfers[n].period == lastPeriod ){
                                            sum += transfers[n].amount;
                                        }
                                    }

                                    /** ==================================== */

                                    lastTransferPeriod = new Date(lastPeriod);
                                    lastTransferPeriodYear = lastTransferPeriod.getFullYear();
                                    lastTransferPeriodMonth = lastTransferPeriod.getMonth();
                                }
                                
                                if(lastTransferPeriod && sum == assets[i].rent){

                                    nextMonth = lastTransferPeriodMonth + 2; //dodaje dwa zamiast jeden bo styczen to 0
                                    if(nextMonth > 12){
                                        nextMonth = '01';
                                        nextYear = lastTransferPeriodYear + 1;
                                    } else {
                                        nextYear = lastTransferPeriodYear;
                                        if( nextMonth < 10 ){
                                            nextMonth = '0' + nextMonth; // no i tutaj bedzie 01 jesli styczen a nie 0
                                        }
                                    } 
    
                                } else if(lastTransferPeriod){
    
                                    nextMonth = lastTransferPeriodMonth +1; //dodaje dwa zamiast jeden bo styczen to 0
                                    nextYear = currentYear;
                                    if(nextMonth < 10){
                                        nextMonth = '0' + nextMonth; // no i tutaj bedzie 01 jesli styczen a nie 0
                                    }
    
                                    amount = amount - sum;
    
                                } else {
    
                                    //nie ma jeszcze płatności wię trzeba sprawdzić wprowadzkę
                                    if(currentDate.getFullYear() === userMovingInDate.getFullYear() && currentDate.getMonth() === userMovingInDate.getMonth()){
                                        diff = 1;
                                    } else {
                                        diff = 0;
                                    }
    
                                    nextMonth = currentMonth + (diff+1); //dodaje dwa zamiast jeden bo styczen to 0
                                    if(nextMonth > 12){
                                        nextMonth = '01';
                                        nextYear = currentYear + 1;
                                    } else {
                                        nextYear = currentYear;
                                        if(nextMonth < 10){
                                            nextMonth = '0' + nextMonth; // no i tutaj bedzie 01 jesli styczen a nie 0
                                        }
                                    }
                                }
    
                                termin = nextYear+'-'+nextMonth+'-11';
                                
                            }
    
                            const data = {
                                user_id: users[h]._id,
                                type: assets[i].type,
                                amount: amount,
                                asset_id: assets[i]._id,
                                termin: termin
                            }
    
                            nextPayments.push(data);
                        }
                    }
                }

                for(let i=0; i<nextPayments.length; i++){
                    if(users[h]._id.equals(nextPayments[i].user_id)){
                        users[h].nextPayments.push(nextPayments[i]);
                    }
                }
            }

            resolve(users);

        });
    }




    calculate_userAccountValue(user_id){
        return new Promise(async (resolve, reject) => {

            const pool = new Pool();
            const transfer = new Transfer();
            const pools = await pool.getFinishedPools();
            const transfers = await transfer.all();

            let in_transfers = 0;
            let out_transfers = 0;

            for(let i=0; i<pools.length; i++){
                for(let m=0; m<transfers.length; m++){
                    if(pools[i]._id.equals(transfers[m].recipient_id) && transfers[m].author_id.equals(user_id)){
                        in_transfers += transfers[m].amount;
                    }

                    if(pools[i]._id.equals(transfers[m].author_id) && transfers[m].recipient_id.equals(user_id)){
                        out_transfers += transfers[m].amount;
                    }
                }
            }

            const userAccountValue = in_transfers - out_transfers;

            resolve(userAccountValue);

        });
    }
}

module.exports = Functions