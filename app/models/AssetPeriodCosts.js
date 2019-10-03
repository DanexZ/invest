const costsCollection = require('../../db').db().collection("asset_billingPeriod_staticCosts");
const ObjectID = require('mongodb').ObjectID;

class AssetPeriodCosts{

    create(asset_id, period_id, static_costs){

        return new Promise((resolve, reject) => {

            const data = {
                asset_id: ObjectID(asset_id),
                period_id: ObjectID(period_id),
                static_costs: static_costs
            }
            
            costsCollection.insertOne(data)
            .then(function(info){
                resolve(info.ops[0]._id);
            })
            .catch(function(){
                this.errors.push("Nie udało dodać się asset-period-costs");
                reject(this.errors);
            });
                
        });

    }


    all(){
        return new Promise(async (resolve, reject) => {

            const rows = await costsCollection.find().toArray();

            resolve(rows);
        });
    }


    edit(){

    }
}

module.exports = AssetPeriodCosts

