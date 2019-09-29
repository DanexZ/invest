class Transfer{
    constructor(){
        this.form = document.querySelector('#transfer-form');
        this.password = document.querySelector('#password');
        this.asset_id = document.querySelector('#asset_id');
        this.amount = document.querySelector('#amount');
        this.username = document.querySelector('#username');
        this.title = document.querySelector('#title');
        this.events();
    }


    events(){
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.showConfirmBox();

        });
    }



    showConfirmBox(){

        let data = null;

        if(this.asset_id){
            data = {
                amount: this.amount.value,
                username: this.username.value,
                title: this.title.value
            }
        }

        this.injectHTML(data);

        const confirmBtn = document.querySelector('#confirmBtn');

        confirmBtn.addEventListener('click', e => {

            const password = document.querySelector('#autorizePassword').value;
            this.password.value = password;

            if(this.data){
                const secondAmount = document.querySelector('#secondAmount').value;
                this.amount.value = secondAmount;
            }

            this.form.submit();
        });

    }



    injectHTML(data=null){

        let node = document.createElement('div');
        node.classList.add('confirmBox');

        let content = 
            `<span class="exit">x</span>
            <h2>Autoryzacja</h2>
            <div class="inputBox">
                <input type="password" id="autorizePassword">
                <label for="autorizePassword">Twoje hasło do konta</label>
            </div>
            <button id="confirmBtn" class="btn">Prześlij</button>`;

        if(data){
            content =
                `<span class="exit">x</span>
                <h2>Autoryzacja</h2>
                <div class="inputBox">
                    <input type="password" id="autorizePassword">
                    <label for="autorizePassword">Twoje hasło do konta</label>
                </div>

                <h2>Dane transferu</h2>

                <div class="inputBox">
                    <input type="number" id="secondAmount" value="${data.amount}" min="0" max="${data.amount}" step="0.01">
                    <label for="secondAmount">Kwota</label>
                </div>

                <p>Odbiorca: <span style="font-weight: 700">${data.username}</span></p>
                <p>Tytuł: <span style="font-weight: 700">${data.title}</span></p>

                <button id="confirmBtn" class="btn">Prześlij</button>`;
        }

        node.innerHTML = content;

        const wrapper = document.querySelector('#confirmBox-wrapper');

        node = wrapper.appendChild(node);

        if(data){
            this.data = data;
        }

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