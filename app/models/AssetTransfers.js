const assetTransfersCollection = require('../../db').db().collection("asset_transfers");
const ObjectID = require('mongodb').ObjectID;

class AssetTransfers{
    constructor(data){
        this.data = data;
        this.errors = [];
    }

    

    all(){
        return new Promise(async (resolve, reject) => {

            const rows = await assetTransfersCollection.find().toArray();

            resolve(rows);
        });
    }



    create(transfer_id){
        return new Promise(async (resolve, reject) => {
            this.data.transfer_id = transfer_id;
            console.log(this.data);
            const id = await assetTransfersCollection.insertOne(this.data);
            resolve(id);
        });
    }


    specyfic(asset_id, user_id){
        return new Promise(async (resolve, reject) => {

            const rows = await assetTransfersCollection.find({asset_id: asset_id, client_id: user_id}).toArray();

            resolve(rows);
        });
    }


    ofAsset(asset_id){
        console.log(asset_id);
        return new Promise(async (resolve, reject) => {

            const rows = await assetTransfersCollection.find({asset_id: ObjectID(asset_id)}).toArray();

            console.log(rows);

            resolve(rows);
        });
    }


    userAssetTransfers(user_id){
        return new Promise(async (resolve, reject) => {

            const rows = await assetTransfersCollection.find({client_id: ObjectID(user_id)}).toArray();

            resolve(rows);
        })
    }

}

module.exports = AssetTransfers