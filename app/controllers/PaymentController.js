const Payment = require('../models/Payment');

exports.edit = (req, res) => {
    let payment = new Payment();

    payment.edit(req.params.id, req.session.user)

    .then((status) => {

        if(status == 'success'){

            req.flash("success", "Płatność została zatwierdzona");

        } else {
            payment.errors.forEach(function(error){
                req.flash('errors', error);
            });
        }

        req.session.save(function(){
            res.redirect('/dashboard/admin');
        });

    })

    .catch((errors) => {
        req.flash("errors", "Nie masz uprawnień");
        req.session.save(function(){
            res.redirect('/');
        })
    })
}


exports.create = (req, res) => {

    let payment = new Payment(req.body);

    const backURL = req.header('Referer') || '/dashboard';

    payment.create()

    .then((inpayment_id) => {

        req.flash('success', "Płatność została dodana i oczekuje na zatwierdzenie przez Administratora");
        req.session.save(() => res.redirect(backURL));

    })

    .catch((errors) => {
        console.log(errors);
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });

}