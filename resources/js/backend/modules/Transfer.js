class Transfer{
    constructor(){
        this.form = document.querySelector('#transfer-form');
        this.password = document.querySelector('#password');
        this.events();
    }


    events(){
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.showConfirmBox();

        });
    }



    showConfirmBox(){

        this.injectHTML();

        const value = document.querySelector('#amount').value;
        const author_id = document.querySelector('#author_id').value;
        const recipient_username = document.querySelector('#username').value;
        const confirmBtn = document.querySelector('#confirmBtn');

        confirmBtn.addEventListener('click', e => {

            const password = document.querySelector('#autorizePassword').value;
            this.password.value = password;

            this.form.submit();
        });

    }



    injectHTML(){

        let node = document.createElement('div');
        node.classList.add('confirmBox');
        node.innerHTML = 
            `<span class="exit">x</span>
            <h2>Autoryzacja</h2>
            <div class="inputBox">
                <input type="password" id="autorizePassword">
                <label for="autorizePassword">Twoje haslo do konta</label>
            </div>
            <button id="confirmBtn" class="btn">Prześlij</button>`;

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

export default Transfer