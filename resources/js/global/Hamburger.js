class Hamburger{
    constructor(){
        this.hamburger = document.getElementsByClassName('hamburger')[0];
        this.menu = document.getElementsByClassName('left')[0];
        this.flag = false;
        this.event();
    }

    event(){
        this.hamburger.addEventListener('click', () => {
            this.slideMenu();
        })
    }


    showMenu(){

        this.menu.classList.add('visible-menu');
        this.flag = true;
    }


    hideMenu(){
        this.menu.classList.remove('visible-menu');
        this.flag = false;
    }


    slideMenu(){

        if( this.flag ){
            this.hideMenu();
        } else {
            this.showMenu();
        }
    }

}

export default Hamburger