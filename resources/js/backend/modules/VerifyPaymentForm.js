class VerifyPaymentForm{
    constructor(id){
        this.id = id.slice(4);
        this.form = document.querySelector('#form' + this.id);
        this.events();
    }

    events(){
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.showConfirmBox();

        });
    }


    showConfirmBox(){

        this.injectHTML(this.id);

        const value = document.querySelector('#input'+ this.id).value;
        const user_id = document.querySelector('#author' + this.id).value;
        const box = document.querySelector('#btn' + this.id);

        box.addEventListener('click', e => {
            
            const form = document.querySelector('#form' + this.id);

            this.socket = io();

            this.socket.emit('updateSubkonto', {
                user_id: user_id,
                value: value });

            form.submit();
        });

    }



    injectHTML(id){

        let node = document.createElement('div');
        node.classList.add('confirmBox');
        node.innerHTML = 
            `<span class="exit">x</span>
            <h2>Na pewno zatwierdzasz tą płatność?</h2>
            <button id="btn${id}" class="btn">Zatwierdź</button>`;

        const wrapper = document.querySelector('#confirmBox-wrapper');

        node = wrapper.appendChild(node);

        const exit = document.querySelector('.exit');
        exit.addEventListener('click', () => {
            wrapper.removeChild(node);
            wrapper.style.display = 'none';
            wrapper.classList.remove('confirmBox-wrapper-visible');
        });

        wrapper.style.display = 'block';
        wrapper.classList.add('confirmBox-wrapper-visible');
    }
}

export default VerifyPaymentForm