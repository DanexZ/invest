class Emit{
    constructor(){
        this.element = document.querySelector('#recipient_username_FromServer');
        this.handler();
    }

    handler(){

        let recipient_username;
        let value;

        if( this.element && this.element.value != ''){
            recipient_username = document.querySelector('#recipient_username_FromServer').value;
            value = document.querySelector('#amount_value_FromServer').value;

            this.socket = io();
            this.socket.emit('updateSubkonto', {
                recipient_username: recipient_username,
                value: value 
            });
        }
    }
}

export default Emit