const assetsCollection = require('../../db').db().collection("assets");
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const timezone = require('moment-timezone');
const sanitizeHtml = require('sanitize-html');

class Asset{
    constructor(data){
        this.data = data;
        this.errors = [];
    }


    cleanUp(){

        if(this.data.type == 'studio'){

            this.data = {
                type: this.data.type,
                purchase: parseFloat(this.data.purchase),
                rent: parseFloat(this.data.rent),
                deposit: this.data.deposit,
                meters: parseFloat(this.data.meters),
                register_nr: this.data.register_nr,
                street: this.data.street,
                apartment_nr: this.data.apartment_nr,
                city: this.data.city,
                postcode: this.data.postcode,
                court_city: this.data.court_city,
                components: this.data.components,
                basement: this.data.basement,
                equipment: this.data.equipment,
                spoldzielnia_name: this.data.spoldzielnia_name,
                light: this.data.light,
                gas: this.data.gas,
                water: this.data.water,
                pool_nr: parseInt(this.data.nr),
                details: sanitizeHtml(
                    this.data.details.trim(),
                    { allowedTags: ['strong', 'p', 'div', 'br'], allowedAttributes: {} }
                ),
                state: 'wolna',
                created_at: moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss')
            }
        }
    }



    create(){
        this.cleanUp();

        return new Promise((resolve, reject) => {
            if(!this.errors.length){

                assetsCollection.insertOne(this.data)
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



    getStudios(){
        return new Promise(async (resolve, reject) => {

            const studios = await assetsCollection.find({ type: 'studio' }).toArray();

            resolve(studios);
        });
    }


    all(){
        return new Promise(async (resolve, reject) => {

            const assets = await assetsCollection.find().toArray();

            resolve(assets);
        });
    }


    getProperty(id){
        return new Promise(async (resolve, reject) => {
    
            const property = await assetsCollection.findOne({_id: ObjectID(id)})
     
            if(property){
                //jakieś zdjęcia by się zdały
                 resolve(property);
             } else{
                 resolve(false);
             }
         });
    }


    getProperties(){
        return new Promise(async (resolve, reject) => {
            const properties = await this.getStudios();

            resolve(properties);
        });
    }



    getAsset(id){
        return new Promise(async (resolve, reject) => {
    
            const asset = await assetsCollection.findOne({_id: ObjectID(id)})
     
            if(asset){
                //jakieś zdjęcia by się zdały
                 resolve(asset);
             } else{
                 resolve(false);
             }
         });
    }
}

module.exports = Asset