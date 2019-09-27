import Swal from 'sweetalert2';

class Alert{
    constructor(status, message){
        this.status = status;
        this.message = message;
        this.handler();
    }


    handler(){
        if( this.status == 'success' ){

            let text = 'Dane zapisane';
    
            if ( this.message != null ){
                text = this.message;
            }
    
            Swal.fire({
                title: "Sukces",
                text: text,
                type: "success",
                confirmButtonText: "Ok"
            });
    
        } else if( status == 'warning' ){
    
            Swal.fire({
                title: "Coś nie tak",
                text: this.message,
                type: "warning",
                confirmButtonText: "Ok"
            });
        } else {
    
            Swal.fire({
                title: "Błąd",
                text: this.message,
                type: "error",
                confirmButtonText: "Ok"
            });
        }

    }

}

export default Alert