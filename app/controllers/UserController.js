const User = require('../models/User');
const Payment = require('../models/Payment');



exports.login = async function(req, res){

    let payment = new Payment();
    let user = new User(req.body);

    user.login()

    .then(async (result) => {

        req.session.user = {
            _id: user.data._id,
            username: user.data.username,
            password: user.data.password,
            role: user.data.role,
            status: user.data.status,
            account: user.data.account,
            type: user.data.type,
            targetAge: user.data.targetAge,
            targetPension: user.data.targetPension,
            birth: user.data.birth
        }

        req.session.save(function(){
            res.redirect('/dashboard');
        });
    })

    .catch((e) => {
        req.flash('errors', e);
        req.session.save(function(){
            res.redirect('/');
        })
    });
}



exports.logout = function(req, res){
    req.session.destroy(function(){
        res.redirect('/');
    });
}



exports.register = function(req, res){
    let user = new User(req.body);

    user.register().
    
    then(function(result){
        req.session.user = {
            _id: user.data._id,
            username: user.data.username,
            password: user.data.password,
            role: user.data.role,
            status: user.data.status,
            account: user.data.account,
            type: user.data.type,
            targetAge: user.data.targetAge,
            targetPension: user.data.targetPension,
            birth: user.data.birth
        }
        req.session.save(function(e){
            res.redirect('/dashboard');
        });
    })
    
    .catch((regErrors) => {
        req.flash('regErrors', regErrors);
        req.session.save(function(e){
            res.redirect('/');
        });
    });
    
}



exports.mustBeLoggedIn = function(req, res, next){
    if(req.session.user){
        next();
    } else {
        req.flash('errors', "Musisz być zalogowany");
        req.session.save(function(){
            res.redirect('/');
        })
    }
}



exports.mustBeAdmin = function(req, res, next){
    if(req.session.user.role === 'administrator'){
        next();
    } else {
        req.flash('errors', "Nie masz uprawnień");
        req.session.save(function(){
            res.redirect('/dashboard');
        })
    }
}



exports.access = (req, res, next) => {
    
    if(req.session.user.username === req.params.username || req.session.user.role === 'administrator'){
        next();
    } else {
        req.flash('errors', "Nie masz uprawnień");
        req.session.save(function(){
            res.redirect('/dashboard');
        })
    }
}



exports.edit = async (req, res) => {
    const backURL = req.header('Referer') || '/dashboard';

    const user = new User();

    user.edit(req.body.user_id, req.body)

    .then((status) => {

        if(status == 'success'){
            req.flash('success', "Operacja wykonana");
        } else {
            req.flash('errors', 'Coś nie tak');
        }

        req.session.save(() => res.redirect(backURL));

    })

    .catch((errors) => {
        console.log(errors);

        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}


exports.update_emerytura = (req, res) => {
    const backURL = req.header('Referer') || '/dashboard';

    const user = new User();

    user.updateEmeryturaTargets(req.session.user._id, req.body)

    .then((status) => {

        if(status == 'success'){
            req.flash('success', "Operacja wykonana");
        } else {
            user.errors.forEach(error => req.flash('errors', error));
        }

        req.session.save(() => res.redirect(backURL));

    })

    .catch((errors) => {
        console.log(errors);

        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}



exports.changePassword = async (req, res) => {
    const backURL = req.header('Referer') || '/dashboard';

    const user = new User();

    user.changePassword(req.session.user._id, req.session.user.username, req.body)

    .then((result) => {

        if(result == 'success'){
            req.flash('success', "Hasło do konta zostało zmienione");
        } else {
            result.forEach(error => req.flash('errors', error));
        }

        req.session.save(() => res.redirect(backURL));

    })

    .catch((errors) => {
        console.log(errors);

        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}



exports.doesUsernameExist = function(req, res){
    let user = new User();
    user.findUserByUsername(req.body.username)

    .then(bool => {
        res.json(bool);
    })

    .catch(() => {
        res.json(false);
    });
}

exports.doesEmailExist = function(req, res){
    let user = new User();
    user.doesEmailExist(req.body.email)

    .then(() => {
        res.json(true);
    })

    .catch(() => {
        res.json(false);
    });
}
