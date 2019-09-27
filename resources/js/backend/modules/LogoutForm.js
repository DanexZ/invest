class LogoutForm{
    constructor(){
        this.form = document.querySelector('#logout-form');
        this.submitBtn = document.querySelector('#logoutBtn');
        this.events();
    }

    events(){
        this.submitBtn.addEventListener('click', () => {
            this.form.submit();
        });
    }
}

export default LogoutForm