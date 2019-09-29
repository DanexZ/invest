const Transfer = require('../models/Transfer');
const Functions = require('../Functions');

const functions = new Functions(); 

exports.create = async (req, res) => {

    if(!req.body.recipient_username.includes('#')){
        //jeżeli transfer na poczet zbiórki to autoryzacja nie jest potrzebna

        //autoryzacja
        if(!functions.autorizeUser(req.body.password, req.session.user.password)){
            const backURL = req.header('Referer') || '/dashboard';

            req.flash('errors', 'Niepoprawne hasło');
            
            return req.session.save(() => res.redirect(backURL));
        }
    }
    /** ---------------------------------------------------------------- */
 

    const transfer = new Transfer(req.body, req.session.user._id, req.session.user.username);
    const p_s = await functions.calculate_subkonto(req.session.user._id);
    const backURL = req.header('Referer') || '/dashboard';

    transfer.create(p_s.subkonto)

    .then((transfer_id) => {

        req.flash('success', "Operacja wykonana");
        req.flash('recipient_username', req.body.recipient_username);
        req.flash('value', req.body.amount);
        req.session.save(() => res.redirect(backURL));

    })

    .catch((errors) => {
        console.log(errors);

        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });

}

exports.back = (req, res) => {

    const backURL = req.header('Referer') || '/dashboard';
    const transfer = new Transfer(req.body);
    
    transfer.back()

    .then((transfer_id) => {

        req.flash('success', "Operacja wykonana");
        req.session.save(() => res.redirect(backURL));

    })

    .catch((errors) => {
        console.log(errors);

        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}