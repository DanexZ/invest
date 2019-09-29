const paymentsCollection = require('../../db').db().collection("payments");
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const timezone = require('moment-timezone');

class Payment{
    constructor(data){
        this.data = data;
        this.errors = [];
    }



    cleanUp(){
        
        this.data.amount = parseFloat(this.data.amount);

        /** Jeżeli sparsowana wartość daje NaN to przyrównanie do jakiejkolwiek liczby zwraca false */
        if(!(this.data.amount == 1) && !(this.data.amount < 1) && !(this.data.amount > 1)){
            this.errors.push('Wykryto potencjalną manipulację');
        }

        if((typeof(this.data.title) != 'string') || typeof(this.data.author_username) != 'string' || typeof(this.data.recipient_username) != 'string'){
            this.errors.push("Wykryto manipulację");
        }

        const time = moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss');

        this.data = {
            author_id: ObjectID(this.data.author_id),
            author_username: this.data.author_username,
            recipient_username: this.data.recipient_username,
            title: this.data.title,
            amount: this.data.amount,
            type: 'inpayment',
            status: 'pending',
            created_at: time
        }
    }



    validate(){
        if(this.data.amount < 50){
            this.errors.push("Minimalna kwota wpłaty to 50.00 zł");
        }
    }



    create(){
        return new Promise( (resolve, reject) => {
            this.cleanUp();
            this.validate();

            if(!this.errors.length){

                paymentsCollection.insertOne(this.data)
                .then(function(info){
                    resolve(info.ops[0]._id);
                })
                .catch(function(){
                    this.errors.push("Please try later");
                    reject(this.errors);
                });
                
            } else {
                reject(this.errors);
            }
        });
    }



    reusablePaymentQuery(uniqueOperations, visitorId=null) {
        return new Promise( async (resolve, reject) => {

            let aggOperations = uniqueOperations.concat([
                { $lookup: {from: 'users', localField: "author_id", foreignField: "_id", as: "authorDocument"} },
                { $project: {
                    status: 1,
                    title: 1,
                    type: 1,
                    amount: 1,
                    created_at: 1,
                    author_id: '$author_id',
                    author: {$arrayElemAt: ['$authorDocument', 0]} //to 0 to pozycja w tablicy
                } }
            ]);

            let payments = await paymentsCollection.aggregate(aggOperations).toArray();

            resolve(payments);
        });
    }



    getPayments(author_id=null){
        return new Promise( async (resolve, reject) => {

            let params = [
                { $sort: { created_at: -1 } }
            ];

            if(author_id){
                if(typeof(author_id) == 'string') author_id = ObjectID(author_id);

                params.push({$match: { author_id: author_id } });
            }
             
            console.log(params);

            const payments = await this.reusablePaymentQuery(params);

            resolve(payments);
        });   
    }



    getPayment(id){
        return new Promise( async (resolve, reject) => {

            if(typeof(id) != 'string' || !ObjectID.isValid(id)){
               reject();
               return
            }

            let payments = await this.reusablePaymentQuery([
                { $match: { _id: new ObjectID(id) } }
            ]);
            
    
            if(payments.length){
                resolve(payments[0]);
            } else {
                reject("Sorry try later");
            }

        });
    }



    edit(id, admin){
        return new Promise( async (resolve, reject) => {

            try {

                if( admin.role == 'administrator'){

                    let status = await this.actuallyUpdate(id);
                    resolve(status);

                } else {
                    this.errors.push('Nie masz uprawnień');
                    reject();
                }

            } catch(e) {
                //ten catch wychwytuje to co w this.getPost zwróci reject()
                reject(e);
            }

        });
    }



    actuallyUpdate(id){
        return new Promise(async (resolve, reject) => {

            if(!this.errors.length){
                const x = await paymentsCollection.findOneAndUpdate(
                    { _id: new ObjectID(id) },
                    { $set: {status: 'verified'} }
                );
                console.log(x);
                resolve('success');
            } else {
                resolve('failure');
            }

        });
    }

}

module.exports = Payment