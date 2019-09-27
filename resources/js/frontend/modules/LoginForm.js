import Alert from '../../global/Alert';

class LoginForm{
    constructor(){
        this.form = document.querySelector('#login-form');
        this.login = document.querySelector('#login');
        this.password = document.querySelector('#password');
        this.events();
    }


    events(){
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.formHandler();
        })
    }


    formHandler(){
        this.passwordValidation();
        this.loginValidation();

        if(!this.login.error && !this.password.error){
            this.form.submit();
        }
    }


    loginValidation(){

        if( this.login.value.length < 3 ){
            this.login.error = true;
            return new Alert('warning', 'Niepoprawny login. (Za krótki)');
        }

        if(this.login.value.length > 30){
            this.login.error = true;
            return new Alert('warning', "Niepoprawny login. (Za długi)");
        }

        this.login.error = false;
    }


    passwordValidation(){
        if(this.password.value.length < 6){
            this.password.error = true;
            return new Alert('warning', "Niepoprawne hasło")
        }

        if(this.password.value.length > 50){
            this.password.error = true;
            return new Alert('warning', "Niepoprawne hasło")
        }

        this.password.error = false;
    }

}

export default LoginForm