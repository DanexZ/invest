const billingPeriodTransfersCollection = require('../../db').db().collection("billingPeriod_transfers");
const ObjectID = require('mongodb').ObjectID;


class BillingPeriodTransfers{

    createMany(array){
        return new Promise(async (resolve, reject) => {
            const x = await billingPeriodTransfersCollection.insertMany(array);
            resolve(x.insertedIds);
        });
    }


    getForPeriod(period_id){
        return new Promise(async (resolve, reject) => {

            const rows = await billingPeriodTransfersCollection.find({_id: ObjectID(period_id)}).toArray();

            resolve(rows);
        });
    }
}

module.exports = BillingPeriodTransfers