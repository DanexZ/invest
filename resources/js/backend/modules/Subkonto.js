class Subkonto{
    constructor(user_id, username){
        this.user_id = user_id;
        this.username = username;
        this.spans = document.getElementsByClassName('subkonto-value');
        this.openConnection();
    }



    openConnection(){

        this.socket = io();
        this.socket.on('updateSubkontoFromServer', (data) => {
            
            if( data.recipient == this.user_id || data.recipient == this.username ){
                this.updateValue(data);
            }
        });
    }



    updateValue(data){

        let old_value = this.spans[0].textContent;
        old_value = parseFloat( old_value.replace(/\s/g, '').replace(/zł/, '') );

        const updatedValue = old_value + parseFloat(data.value);
        
        for(let i=0; i<this.spans.length; i++){
            this.spans[i].textContent = updatedValue;
        }

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

    }
}

export default Subkonto