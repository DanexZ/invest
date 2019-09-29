const assetClientCollection = require('../../db').db().collection("asset_client");
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const timezone = require('moment-timezone');

class AssetClient{
    constructor(){
        this.errors = [];
    }


    update(asset_id, client_id){
        return new Promise(async (resolve, reject) => {

            //jeżeli nie ma takiego wiersza to go stwórz
            const row = await assetClientCollection.find({asset_id: asset_id}).toArray();

            if(row.length){
                //update
                await assetClientCollection.findOneAndUpdate(
                    { _id: row[0]._id },
                    { $set: {
                        client_id: ObjectID(client_id),
                        created_at: moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss')
                        } 
                    }
                );
                resolve('success');

            } else {
                //create
                const data = {
                    asset_id: ObjectID(asset_id),
                    client_id: ObjectID(client_id),
                    created_at: moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss')
                }

                assetClientCollection.insertOne(data)
                .then(function(info){
                    resolve('success');
                })
                .catch(function(){
                    this.errors.push("Please try later");
                    reject(this.errors);
                });
            }

        });
    }


    getUserRows(client_id){
        return new Promise(async (resolve, reject) => {
            
            const rows = await assetClientCollection.find({client_id: ObjectID(client_id)}).toArray();
            
            resolve(rows);
        });
    }



    all(){
        return new Promise(async (resolve, reject) => {

            const rows = await assetClientCollection.find().toArray();

            resolve(rows);
        });
    }

}

module.exports = AssetClient