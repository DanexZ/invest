const periodsCollection = require('../../db').db().collection("billingPeriods");

class BillingPeriod{

    create(period){
        return new Promise(async (resolve, reject) => {
            const periods = await periodsCollection.find({period: period}).toArray();

            let id;

            if(!periods.length){
                const data = {
                    period: period
                }

                const info = await periodsCollection.insertOne(data);
                id = info.ops[0]._id;
            } else {

                id = periods[0]._id
            }

            resolve(id);
        });
    }


    getPeriod(period){  
        return new Promise(async (resolve, reject) => {
            const billingPeriod = await periodsCollection.findOne({period: period});

            resolve(billingPeriod);
        });
    }


    all(){
        return new Promise(async (resolve, reject) => {
            const billingPeriods = await periodsCollection.find().toArray();

            resolve(billingPeriods);
        });
    }
}

module.exports = BillingPeriod
