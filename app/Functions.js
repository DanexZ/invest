const Transfer = require('./models/Transfer');
const Payment = require('./models/Payment');
const Asset = require('./models/Asset');
const AssetClient = require('./models/AssetClient');
const AssetTransfers = require('./models/AssetTransfers');
const moment = require('moment');
const timezone = require('moment-timezone');
const bcrypt = require('bcryptjs');

class Functions{


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
                        let type;
                        let sum = 0;

                        if(assets[i].type == 'studio'){
                            amount = assets[i].rent;
                            type = 'Kawalerka';

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
                                const period = transfers[transfers.length-1].period;

                                //wyliczenie sumy przelewów na dany period  
                                for(let n=0; n<transfers.length; n++){
                                    if(transfers[n].period == period){
                                        sum += transfers[n].amount;
                                    }
                                }
                                /** ==================================== */

                                lastTransferPeriod = new Date(period);
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
                            type: type,
                            amount: amount - sum,
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

                            console.log('tutaj');
                            
                            const userMovingInDate = new Date(clientAssets[m].created_at);
                            let amount;
                            let termin;
                            let type;
    
                            if(assets[i].type == 'studio'){
                                amount = assets[i].rent;
                                type = 'Kawalerka';
    
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
                                    lastTransferPeriod = new Date(transfers[transfers.length-1].period);
                                    lastTransferPeriodYear = lastTransferPeriod.getFullYear();
                                    lastTransferPeriodMonth = lastTransferPeriod.getMonth();
                                }
                                
                                if(lastTransferPeriod){
    
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
                                        if(nextMonth <10){
                                            nextMonth = '0' + nextMonth; // no i tutaj bedzie 01 jesli styczen a nie 0
                                        }
                                    }
                                }
    
                                termin = nextYear+'-'+nextMonth+'-11';
                                
                            }
    
                            const data = {
                                user_id: users[h]._id,
                                type: type,
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
}

module.exports = Functions