class Exit{
    constructor(){
        this.exits = document.getElementsByClassName('exit');
        this.events();
    }


    events(){

        for(let i=0; i< this.exits.length; i++){
            this.exits[i].addEventListener('click', e => {
                e.target.parentElement.style.display = 'none';
            });
        }
    }
}

export default Exit