import $ from 'jquery';
import Alert from '../../global/Alert';

class Flash{
    constructor(){
        this.danger = $('.alert-danger');
        this.success = $('.alert-success');
        this.handler();
    }

    handler(){

        let flag = false;

        if(this.danger.length){
            new Alert('warning', this.danger.text());
            flag = 1;
        }

        if(this.success.length){
            new Alert('success', this.success.text());
            flag = 1
        }

        this.flag = flag;
    }

}

export default Flash