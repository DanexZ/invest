const Pool = require('../models/Pool');

exports.create = (req, res) => {

    let pool = new Pool(req.body);

    pool.create()

    .then((inpool_id) => {

        req.flash('success', "Zbiórka utworzona");
        req.session.save(() => res.redirect('/dashboard/admin/pools'), {
            user: req.session.user
        });

    })

    .catch((errors) => {
        console.log(errors);
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect('/dashboard/admin/pools'));
    });

}


exports.edit = (req, res) => {

    const pool = new Pool();
    const backURL = req.header('Referer') || '/dashboard';

    if(req.session.user.role != 'administrator'){

        const errors = ['Nie masz uprawnień'];

        errors.forEach(error => req.flash('errors', error));
        return req.session.save(() => res.redirect(backURL));
    };

    pool.edit(req.params.id, req.body)

    .then((status) => {

        if(status == 'success'){
            req.flash('success', "Zbiórkę dodano do zakończonych");
        } else {
            req.flash('errors', "Ups jakiś błąd");
        }

        req.session.save(() => res.redirect(backURL));

    })

    .catch((errors) => {
        console.log(errors);
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}
