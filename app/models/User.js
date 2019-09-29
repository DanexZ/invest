const usersCollection = require('../../db').db().collection("users");
const validator = require('validator');
const bcrypt = require('bcryptjs');
const md5 = require('md5');
const moment = require('moment');
const timezone = require('moment-timezone');
const ObjectID = require('mongodb').ObjectID;

class User{
    constructor(data){
        this.data = data;
        this.errors = [];
    }



    cleanUp(){
        if(typeof(this.data.username) != 'string'){ this.data.username = '' }
        if(typeof(this.data.email) != 'string'){ this.data.email = '' }
        if(typeof(this.data.password) != 'string'){ this.data.password = '' }

        //get rid of any bonus properties
        this.data = {
            username: this.data.username.trim(),
            email: this.data.email.trim().toLowerCase(),
            password: this.data.password
        }
    }



    validate(){

        return new Promise( async (resolve, reject) => {

            let validUsername = true;
            let validEmail = true;
    
            if(this.data.username == ""){
                this.errors.push("Należy ustawić nazwę użytkownika");
                validUsername = false;
            }
            if(this.data.username.length > 0 && this.data.username.length < 3){
                this.errors.push("Nazwa użytkownika musi zawierać co namniej 3 znaki");
                validUsername = false;
            }
            if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){
                this.errors.push("Nazwa użytkownika może zawierać tylko litery i cyfry");
                validUsername = false;
            }
            if(this.data.username.length > 20){
                this.errors.push("Nazwa użytkownika nie może być dłuższa niż 20 znaków");
                validUsername = false;
            }
            if(!validator.isEmail(this.data.email)){
                this.errors.push("Wprowadź koniecznie poprawny e-mail");
                validEmail = false;
            }
            if(this.data.password == ""){
                this.errors.push("Musisz wprowadzić hasło");
            }
            if(this.data.password.length > 0 && this.data.password.length < 10){
                this.errors.push("Hasło musi się składać z co najmniej 10 znaków");
            }
            if(this.data.password.length > 50){
                this.errors.push("Hasło nie może być dłuższe niż 50 znaków");
            }

            const specialChars = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '|', '{', '}', '[', ']', ':', ';', '"', "'", ',', '<', '.', '>', '/', '?' ];
            const bigLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'Y', 'W', 'Q', 'V', 'X', 'Z'];
            const smallLetters = 'abcdefghijklmnoprstwuyxqz';
            const digits = '1234567890';

            let flag1 = false; 
            let flag2 = false; 
            let flag3 = false;
            let flag4 = false;

            for(let i=0; i<this.data.password.length; i++){
                for(let m=0; m<specialChars.length; m++){
                    if(this.data.password[i] === specialChars[m]){
                        flag1 = true;
                    }
                }

                for(let m=0; m<bigLetters.length; m++){
                    if(this.data.password[i] === bigLetters[m]){
                        flag2 = true;
                    }
                }

                for(let m=0; m<smallLetters.length; m++){
                    if(this.data.password[i] === smallLetters.charAt(m)){
                        flag3 = true;
                    }
                }

                for(let m=0; m<digits.length; m++){
                    if(this.data.password[i] === digits.charAt(m)){
                        flag4 = true;
                    }
                }
            }

            if(!flag1) this.errors.push('Hasło musi zawierać co najmniej jeden znak specjalny');
            if(!flag2) this.errors.push('Hasło musi zawierać co najmniej jedną dużą literę');
            if(!flag3) this.errors.push('Hasło musi zawierać co najmniej jedną małą literę');
            if(!flag4) this.errors.push('Hasło musi zawierać co najmniej jedną cyfrę');

            
            // Only if username is valid then check if already exists in database
            if(validUsername){
                let usernameExists = await usersCollection.findOne({username: this.data.username});
    
                if(usernameExists){
                    this.errors.push("Ta nazwa użytkownika jest już zajęta");
                }
            }
    
            if(validEmail){
                let userEmail = await usersCollection.findOne({email: this.data.username});
    
                if(userEmail){
                    this.errors.push('Ten e-mail istnieje już w bazie danych');
                }
            }

            resolve();

        });
    }



    register(){
        return new Promise( async (resolve, reject) => {

            this.cleanUp();
            await this.validate().then(async (result) => {
    
                //If no errors add new user
                if(!this.errors.length){
                    
                    let salt = bcrypt.genSaltSync(10); //dowiedz się o ten parametr
                    this.data.password = bcrypt.hashSync(this.data.password, salt);
                
                    //ustawiam domyślną rolę użytkownika i inne dane
                    this.data.role = 'user';
                    this.data.name = '';
                    this.data.surname = '';
                    this.data.pesel = '';
                    this.data.id_card = '';
                    this.data.phone_nr = '';
                    this.data.account = '';
                    this.data.status = 'new';
                    this.data.type = 'person'; //typ konta domyślnie person
                    this.data.created_at = moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss');
    
                    await usersCollection.insertOne(this.data);
                    resolve();

                } else {
                    reject(this.errors);
                }

            }); 
        });
    }



    login(){
        return new Promise((resolve, reject) => {

            this.cleanUp();
            //dzięki funkcji strzałkwej mam dostęp do this bo nie odnosi sie globalnego obiektu
            usersCollection.findOne({username: this.data.username})
            
            .then((attemptedUser) => {
                if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
                    this.data = attemptedUser;
                    resolve("Congrats");
                } else {
                    reject("Invalid username / password");
                }
                
            }).catch(function(){
                reject("Please try later");
            });
        });
    }



    findUserByUsername(username){
        return new Promise( (resolve, reject) => {
            if(typeof(username) != 'string'){
                reject();
                return
            }

            usersCollection.findOne({username: username})

            .then((userDoc) => {
                if(userDoc){

                    resolve(userDoc);
                } else {
                    resolve(false);
                }
                
            })

            .catch(function(e){
                reject("Please try later");
            })
        });
    }



    doesEmailExist(email){
        return new Promise( (resolve, reject) => {

            if(typeof(email) != 'string'){
                reject();
                return
            }

            usersCollection.findOne({email: email})

            .then((userDoc) => {
                if(userDoc){
                    resolve(true);
                } else {
                    reject(false);
                }
            })

            .catch((err) => {
                reject(err);
            })
        })
    }



    with_transfers(uniqueOperations, visitorId=null) {
        return new Promise( async (resolve, reject) => {

            /*let out_transfers = [
                { $lookup: {from: 'transfers', localField: "_id", foreignField: "author_id", as: "InTransfer"} },
                { $project: {
                    status: 1,
                    amount: 1,
                    created_at: 1,
                    author_id: '$_id',
                    author: {$arrayElemAt: ['$InTransfer', 0]} //to 0 to pozycja w tablicy
                } }
            ];*/

            let in_transfers = [
                { $lookup: {from: 'transfers', localField: "_id", foreignField: "recipient_id", as: "OutTransfer"} },
                { $project: {
                    amount: 1,
                    created_at: 1,
                    recipient_id: '$_id',
                    author: {$arrayElemAt: ['$OutTransfer', 0]} //to 0 to pozycja w tablicy
                } }
            ]

            let aggOperations = uniqueOperations.concat(in_transfers)//.concat(in_transfers);

            let transfers = await usersCollection.aggregate(aggOperations).toArray();

            resolve(transfers);
        });
    }



    getUsers(){
        return new Promise(async (resolve, reject) => {

            const users = await usersCollection.find().toArray();

            resolve(users);
        });
    }



    edit(user_id, body){
        return new Promise( async (resolve, reject) => {

            if(typeof(body.name) != 'string' ||
               typeof(body.surname) != 'string' ||
               typeof(body.pesel) != 'string' ||
               typeof(body.id_card) != 'string' ||
               typeof(body.status) != 'string'){

                this.errors.push('Coś nie tak')
            }

            if(!this.errors.length){
                await usersCollection.findOneAndUpdate(
                    { _id: ObjectID(user_id) },
                    { $set: {
                        name: body.name,
                        surname: body.surname,
                        pesel: body.pesel,
                        id_card: body.id_card,
                        status: body.status
                        } 
                    }
                );
                resolve('success');
            } else {
                resolve('failure');
            }
        });
    }



    changePassword(user_id, username, body){
        return new Promise( async (resolve, reject) => {

            const user = await this.findUserByUsername(username);
            
            if(!bcrypt.compareSync(body.currentPassword, user.password)){
                this.errors.push("Niepoprawne aktualne hasło");
            }

            if(body.newPassword != body.newPasswordRepeat){
                this.errors.push('Hasła się nie zgadzają');
            }

            if(body.newPassword == ""){
                this.errors.push("Musisz wprowadzić hasło");
            }

            if(body.newPassword.length > 0 && body.newPassword.length < 10){
                this.errors.push("Hasło musi się składać z co najmniej 10 znaków");
            }

            if(body.newPassword.length > 50){
                this.errors.push("Hasło nie może być dłuższe niż 50 znaków");
            }

            const specialChars = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '|', '{', '}', '[', ']', ':', ';', '"', "'", ',', '<', '.', '>', '/', '?' ];
            const bigLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'Y', 'W', 'Q', 'V', 'X', 'Z'];
            const smallLetters = 'abcdefghijklmnoprstwuyxqz';
            const digits = '1234567890';

            let flag1 = false; 
            let flag2 = false; 
            let flag3 = false;
            let flag4 = false;

            for(let i=0; i<body.newPassword.length; i++){
                for(let m=0; m<specialChars.length; m++){
                    if(body.newPassword[i] === specialChars[m]){
                        flag1 = true;
                    }
                }

                for(let m=0; m<bigLetters.length; m++){
                    if(body.newPassword[i] === bigLetters[m]){
                        flag2 = true;
                    }
                }

                for(let m=0; m<smallLetters.length; m++){
                    if(body.newPassword[i] === smallLetters.charAt(m)){
                        flag3 = true;
                    }
                }

                for(let m=0; m<digits.length; m++){
                    if(body.newPassword[i] === digits.charAt(m)){
                        flag4 = true;
                    }
                }
            }

            if(!flag1) this.errors.push('Hasło musi zawierać co najmniej jeden znak specjalny');
            if(!flag2) this.errors.push('Hasło musi zawierać co najmniej jedną dużą literę');
            if(!flag3) this.errors.push('Hasło musi zawierać co najmniej jedną małą literę');
            if(!flag4) this.errors.push('Hasło musi zawierać co najmniej jedną cyfrę');

            if(!this.errors.length){

                const salt = bcrypt.genSaltSync(10); //dowiedz się o ten parametr
                body.newPassword = bcrypt.hashSync(body.newPassword, salt);

                await usersCollection.findOneAndUpdate(
                    { _id: ObjectID(user_id) },
                    { $set: {
                        password: body.newPassword } 
                    }
                );
                resolve('success');
            } else {
                resolve(this.errors);
            }
        });
    }

}

module.exports = User