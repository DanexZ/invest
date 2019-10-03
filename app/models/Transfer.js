const transfersCollection = require('../../db').db().collection("transfers");
const Asset = require('./Asset');
const AssetTransfers = require('./AssetTransfers');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const timezone = require('moment-timezone');
const User = require('./User');
const Pool = require('./Pool');

class Transfer{
    constructor(data, author_id, author_username){
        this.data = data;
        this.author_id = author_id;
        this.author_username = author_username;
        this.created_at = moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss');
        this.errors = [];
    }


    cleanUp(){

        this.data.amount = parseFloat(this.data.amount);

        /** Jeżeli sparsowana wartość daje NaN to przyrównanie do jakiejkolwiek liczby zwraca false */
        if(!(this.data.amount == 1) && !(this.data.amount < 1) && !(this.data.amount > 1)){
            this.errors.push('Wykryto potencjalną manipulację');
        }

        if((typeof(this.data.title) != 'string') || typeof(this.author_username) != 'string' || typeof(this.data.recipient_username) != 'string'){
            this.errors.push("Wykryto manipulację");
        }


        if(this.data.asset_id){
            this.data2 = {
                asset_id: ObjectID(this.data.asset_id),
                client_id: ObjectID(this.author_id),
                amount: this.data.amount,
                period: this.data.termin,
                created_at: this.created_at
            }
        }


        this.data = {
            author_id: ObjectID(this.author_id),
            recipient_id: ObjectID(this.data.recipient_id),
            author_username: this.author_username,
            recipient_username: this.data.recipient_username,
            amount: this.data.amount,
            title: this.data.title,
            created_at: this.created_at
        }
    }


    validate(){
        if(this.data.amount <= 0){
            this.errors.push('Minimalna kwota transferu to 0.01 zł');
        }

        let someText = false;

        for(let i=0; i<this.data.title.length; i++){
            if(this.data.title.charAt(i) != ' ' ){
                someText = true;
            }
        }

        if(this.data.title.length < 1 || !someText){
            this.errors.push('Oznacz swój transfer wpisując tytuł');
        }
    }




    createIncomesTransfers(transfers){
        return new Promise(async (resolve, reject) => {
            const x = await transfersCollection.insertMany(transfers);
            resolve(x.insertedIds);
        });
    }
    



    reusableTransferQuery(uniqueOperations, visitorId=null) {
        return new Promise( async (resolve, reject) => {

            let aggOperations = uniqueOperations.concat([
                { $lookup: {from: 'users', localField: "author_id", foreignField: "_id", as: "authorDocument"} },
                { $project: {
                    author_username: 1,
                    recipient_username: 1,
                    amount: 1,
                    title: 1,
                    recipient_id: 1,
                    created_at: 1,
                    author_id: '$author_id',
                    author: {$arrayElemAt: ['$authorDocument', 0]} //to 0 to pozycja w tablicy
                } }
            ]);

            let transfers = await transfersCollection.aggregate(aggOperations).toArray();

            resolve(transfers);
        });
    }



    create(author_subkonto){
        return new Promise( async (resolve, reject) => {

            if(author_subkonto < this.data.amount){
                this.errors.push('Nie masz wystarczających środków na subkoncie do tej operacji');
            }

            if(this.data.currentPool){

                let pool = new Pool();
                let currentPool = await pool.getCurrent();

                let in_transfers = await this.getRecipientTransfers(currentPool._id);
                let out_transfers = await this.getAuthorTransfers(currentPool._id);

                let in_sum = 0;
                let out_sum = 0;

                for(let i=0; i<in_transfers.length; i++){
                    in_sum += in_transfers[i].amount;
                }

                for(let i=0; i<out_transfers.length; i++){
                    out_sum += out_transfers[i].amount;
                }

                currentPool.total = in_sum - out_sum;

                if(this.data.amount > currentPool.amount - currentPool.total){
                    this.errors.push('Twoja wpłata nie może przekraczać sumy, której aktualnie brakuje do zakończenia zbiórki')
                }
            }

            if(!this.data.currentPool){

                let user = new User();
                user = await user.findUserByUsername(this.data.recipient_username);

                if(!user){
                    this.errors.push('Nie ma takiego użytkownika');
                } else {
                    this.data.recipient_id = user._id;
                }

            }

            this.cleanUp();
            this.validate();
            
            if(!this.errors.length){

                //nie można wpłacić więcej na dany period niż wynosi rent

                const assetTransfers = new AssetTransfers(this.data2);

                if(this.data2){

                    let asset = new Asset();
                    asset = await asset.getAsset(this.data2.asset_id);
                    
                    const userAssetTransfers = await assetTransfers.specyfic(ObjectID(this.data2.asset_id), ObjectID(this.data2.author_id));
    
                    const period = this.termin;
    
                    let sum = 0;
                    if(period){
                        for(let i=0; i<userAssetTransfers.length; i++){
                            if(userAssetTransfers[i].period == period){
                                sum += userAssetTransfers[i].amount;
                            }
                        }
                    }
    
                    if(sum + this.data.amount > asset.rent){
                        this.errors.push('Kwota przekracza wartość wpłat na dany okres rozliczeniowy');
                    }
    
                }

                const info = await transfersCollection.insertOne(this.data);
                const transfer_id = info.ops[0]._id;

                if(this.data2){

                    const id = await assetTransfers.create(transfer_id);
                    resolve(id);
                } else {
                    resolve(transfer_id);
                }

            } else {
                reject(this.errors);
            }
        });
    }



    back(){
        return new Promise( async (resolve, reject) => {

            const pool = new Pool();
            const withrawal_pool = await pool.getPoolById(this.data.author_id);

            if(withrawal_pool){

                if(pool.status == 'finished'){

                    this.errors.push("Nie można wypłacać ze zbiórki, która została zakończona");
                    reject(this.errors);

                } else {
                    const transfer_id = await this.create();

                    if(transfer_id){
                        resolve(transfer_id);
                    }
                }

            } else {
                this.errors.push('coś nie tak');
                reject(this.errors);
            }
        });
    }



    getRecipientTransfers(recipient_id){
        return new Promise(async (resolve, reject) => {

            if(typeof(recipient_id) == 'string') recipient_id = ObjectID(recipient_id);

            let params = [
                { $match: { recipient_id: recipient_id } },
                { $sort: { created_at: -1 } }
            ];

            const transfers = await this.reusableTransferQuery(params);

            resolve(transfers);
        });
    }


    
    getAuthorTransfers(author_id){
        return new Promise(async (resolve, reject) => {

            if(typeof(author_id) == 'string') author_id = ObjectID(author_id);

            let params = [
                { $match: { author_id: author_id } },
                { $sort: { created_at: -1 } }
            ];

            const transfers = await this.reusableTransferQuery(params);

            resolve(transfers);
        });
    }



    all(){
        return new Promise(async (resolve, reject) => {

            const transfers = await transfersCollection.find().toArray();

            resolve(transfers);
        });
    }

}

module.exports = Transfer