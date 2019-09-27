import Logoutform from './modules/LogoutForm';
import VerifyPaymentForm from './modules/VerifyPaymentForm';
import Exit from '../global/Exit';
import Loader from '../global/Loader';
import Subkonto from './modules/Subkonto';
import ActiveClass from '../global/ActiveClass';
import Transfer from './modules/Transfer';
import CreatePoolForm from './modules/CreatePoolForm';
import AddAssetForms from './modules/AddAssetForms';
import UmowaNajmu from './modules/UmowaNajmu';
import Emit from './modules/Emit';
import Hamburger from '../global/Hamburger';

const formatter = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2
});

const moneys = document.getElementsByClassName('money');
for(let i=0; i<moneys.length; i++){
    let value = formatter.format(moneys[i].textContent);
    moneys[i].textContent = value;
}

new Hamburger();

if(document.querySelector('#logout-form')){
    new Logoutform();
}

if(document.querySelector('.alert')){
    document.querySelector('.alert').style.display = 'block';
}

if(document.querySelector('.exit')){
    new Exit();
}

if(document.querySelector('#page')){
    new ActiveClass();
}

const verifyForms = document.getElementsByClassName('verify-payment-form');

if(verifyForms.length){

    for(let i=0; i<verifyForms.length; i++){
        new VerifyPaymentForm(verifyForms[i].id);
    }
}

const umowa_najmu_forms = document.getElementsByClassName('umowa_najmu_form');

if(umowa_najmu_forms.length){
    for(let i=0; i<umowa_najmu_forms.length; i++){
        new UmowaNajmu(umowa_najmu_forms[i].id);
    }
}

if(document.querySelector('#transfer-form')){
    new Transfer();
}

if(document.querySelector('#loader')){
    const total = parseFloat(document.querySelector('#total').textContent);
    const amount = parseFloat(document.querySelector('#currentPool-amount').textContent);
    new Loader(total, amount);
}

const user_id = document.querySelector('#user_id').textContent;
const username = document.querySelector('#user_username').textContent

new Subkonto(user_id, username);

if(document.querySelector('#first-calculate')){
    new CreatePoolForm();
}

if(document.querySelector('#specyfic-asset')){
    new AddAssetForms();
}

new Emit();
