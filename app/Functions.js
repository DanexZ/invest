const Transfer = require('./models/Transfer');
const Payment = require('./models/Payment');
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
}

module.exports = Functions