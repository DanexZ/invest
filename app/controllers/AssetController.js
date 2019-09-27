const Asset = require('../models/Asset');
const Functions = require('../Functions');

const functions = new Functions();

exports.create = (req, res) => {

    const backURL = req.header('Referer') || '/dashboard';
    const asset = new Asset(req.body);

    if(req.session.user.role != 'administrator'){

        req.flash('errors', "Nie masz uprawnień");

        return req.session.save(() => res.redirect(backURL));
    };
    

    asset.create()

    .then((created_id) => {

        req.flash('success', "Aktywo dodane!");
        req.session.save(() => res.redirect(backURL));
    })

    .catch((errors) => {
        console.log(errors);
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}