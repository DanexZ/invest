import axios from 'axios';;

class RegistrationForm{
    constructor(){
    this._csrf = document.querySelector('[name=_csrf]').value;
    this.form = document.querySelector('#registration-form');
    this.allFields = document.querySelectorAll('#registration-form .form-group');
    this.insertValidationElements();
    this.nick = document.querySelector('#username-register');
    this.email = document.querySelector('#email-register');
    this.email.value = ''; //Clean beacause of autocomplete
    this.password = document.querySelector('#password-register');
    this.password.value = '';
    this.confirmPassword = document.querySelector('#confirm-password-register');
    this.nick.previousValue = '';
    this.email.previousValue = '';
    this.password.previousValue = '';
    this.nick.isUnique = false;
    this.email.isUnique = false;
    this.events();
}



    events(){
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.formHandler();
        });

        this.nick.addEventListener('keyup', e => {
            this.isDifferent(this.nick, this.nickHandler);
        });

        this.nick.addEventListener('blur', e => {
            this.isDifferent(this.nick, this.nickHandler);
        });

        this.email.addEventListener('keyup', e => {
            this.isDifferent(this.email, this.emailHandler);
        });

        this.email.addEventListener('blur', e => {
            this.isDifferent(this.email, this.emailHandler);
        });

        this.password.addEventListener('keyup', e => {
            this.isDifferent(this.password, this.passwordHandler);
        });

        this.password.addEventListener('blur', e => {
            this.isDifferent(this.password, this.passwordHandler);
        });

        this.confirmPassword.addEventListener('keyup', e => {
            this.isDifferent(this.confirmPassword, this.confirmPasswordHandler);
        });

        this.confirmPassword.addEventListener('blur', e => {
            this.isDifferent(this.confirmPassword, this.confirmPasswordHandler);
        });
    }



    isDifferent(el, handler){
        if(el.previousValue != el.value){
            handler.call(this);
        }
        el.previousValue = el.value;
    }



    nickHandler(){
        this.nick.errors = false;
        this.nickImmediately();
        clearTimeout(this.nick.timer);
        this.nick.timer = setTimeout(() => this.nickAfterDelay(), 900);
    }



    nickImmediately(){
        if(this.nick.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.nick.value) ){
            this.showValidationError(this.nick, "Nick może zawierać tylko litery i cyfry");
        }

        if(this.nick.value.length > 20){
            this.showValidationError(this.nick, "Nick nie może przekraczać 20 znaków")
        }

        if(!this.nick.errors){
            this.hideValidationError(this.nick);
        }
    }



    nickAfterDelay(){

        if(this.nick.value == ''){
            return this.hideValidationError(this.nick);
        }

        if(this.nick.value.length < 3){
            this.showValidationError(this.nick, "Nick musi składać się z conajmniej 3 znaków")
        }

        if(!this.nick.errors){

            axios.post('doesUsernameExist', {username: this.nick.value, _csrf: this._csrf})

            .then(response => {
                if(response.data){
                    this.showValidationError(this.nick, "Ta nazwa użytkownika jest już zajęta");
                    this.nick.isUnique = false;
                } else {
                    this.nick.isUnique = true;
                }
            })

            .catch(() => {
                console.log('Please try again later');
            });
        }
    }



    emailHandler(){
        this.email.errors = false;
        clearTimeout(this.email.timer);
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 900);
    }



    emailAfterDelay(){
        if(!/^\S+@\S+$/.test(this.email.value)){
            this.showValidationError(this.email, "Wprowadź poprawny e-mail");
        } else {
            this.hideValidationError(this.email);
        }

        if(this.email.value == ''){
            this.hideValidationError(this.email);
        }

        if(!this.email.errors){
            
            axios.post('/doesEmailExist', {email: this.email.value, _csrf: this._csrf})

            .then(response => {
                if(response.data) {
                    this.email.isUnique = false;
                    this.showValidationError(this.email, "Ten e-mail istnieje już w bazie danych");
                } else {
                    this.email.isUnique = true;
                    this.hideValidationError(this.email);
                }
            })

            .catch(() => {
                console.log("Try try again later");
            });
        }
    }



    passwordHandler(){
        this.password.errors = false;
        this.passwordImmediately();
        clearTimeout(this.password.timer);
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 900);
    }



    passwordImmediately(){
        if(this.password.value.length > 30){
            this.showValidationError(this.password, "Maksymalna długość hasła to 30 znaków");
        }

        if(!this.password.errors){
            this.hideValidationError(this.password);
        }
    }



    passwordAfterDelay(){

        if(this.password.value.length == ''){
            return this.hideValidationError(this.paasword);
        }

        if(this.password.value.length < 10){
            this.showValidationError(this.password, "Minimalna długość hasła to 10 znaków");
        }

        const specialChars = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '|', '{', '}', '[', ']', ':', ';', '"', "'", ',', '<', '.', '>', '/', '?' ];
        const bigLetters = 'ABCDEFGHIJKLMNOPRSTWUQVXYZ';
        const smallLetters = 'abcdefghijklmnoprstwuyxqz';
        const digits = '1234567890';

        let flag1 = false; 
        let flag2 = false; 
        let flag3 = false;
        let flag4 = false;

        for(let i=0; i<this.password.value.length; i++){
            for(let m=0; m<specialChars.length; m++){
                if(this.password.value[i] === specialChars[m]){
                    flag1 = true;
                }
            }

            for(let m=0; m<bigLetters.length; m++){
                if(this.password.value[i] === bigLetters.charAt(m)){
                    flag2 = true;
                }
            }

            for(let m=0; m<smallLetters.length; m++){
                if(this.password.value[i] === smallLetters.charAt(m)){
                    flag3 = true;
                }
            }

            for(let m=0; m<digits.length; m++){
                if(this.password.value[i] === digits.charAt(m)){
                    flag4 = true;
                }
            }
        }

        if(!flag1){
            return this.showValidationError(this.password, "Hasło musi zawierać co najmniej jeden znak specjalny");
        }
        
        if(!flag2){
            return this.showValidationError(this.password, "Hasło musi zawierać co najmniej jedną dużą literę");
        }

        if(!flag3){
            return this.showValidationError(this.password, "Hasło musi zawierać co najmniej jedną małą literę");
        }

        if(!flag4){
            this.showValidationError(this.password, 'Hasło musi zawierać co najmniej jedną cyfrę');

        }

    }



    confirmPasswordHandler(){
        this.confirmPassword.errors = false;
        this.conrifmPasswordImmediately();
    }



    conrifmPasswordImmediately(){

        if(this.confirmPassword.value == ''){
            return this.hideValidationError(this.confirmPassword);
        }

        const cp = this.confirmPassword.value;
        let chank = '';

        for(let i=0; i<cp.length; i++){
            chank += this.password.value.charAt(i);
        }

        if(chank != cp ){
            this.showValidationError(this.confirmPassword, "Hasła nie pasują do siebie");
        } else {
            this.hideValidationError(this.confirmPassword);
        }
    }



    hideValidationError(el){
        el.nextElementSibling.classList.remove('liveValidateMessage--visible');
    }



    showValidationError(el, message){
        el.nextElementSibling.innerHTML = message;
        el.nextElementSibling.classList.add('liveValidateMessage--visible');
        el.errors = true;
    }



    formHandler(){
        this.nickImmediately();
        this.nickAfterDelay();
        this.emailAfterDelay();
        this.passwordImmediately();
        this.passwordAfterDelay();
        this.conrifmPasswordImmediately();

        if(this.nick.isUnique && !this.nick.errors && this.email.isUnique && !this.email.errors && !this.password.errors && !this.confirmPassword.errors){

            this.form.submit(); 
        }
    }



    insertValidationElements(){
        this.allFields.forEach(function(el){
            el.insertAdjacentHTML('beforeend', '<div class="form-alert alert-danger small liveValidateMessage"></div>');
        })
    }

}

export default RegistrationForm