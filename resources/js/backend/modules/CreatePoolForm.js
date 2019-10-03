class CreatePoolForm{
    constructor(){
        this.form = document.querySelector('#first-calculate');
        this.budget = document.querySelector('#amount');
        this.rent = document.querySelector('#rent');
        this.tax = document.querySelector('#tax');
        this.spoldzielnia = document.querySelector('#spoldzielnia');
        this.commision = document.querySelector('#commision');
        this.profit_netto = document.querySelector('#profit_netto');
        this.profitability = document.querySelector('#profitability');
        this.events();
    }


    events(){
        this.form.addEventListener('submit', e => {
            e.preventDefault();

            this.calculate();
        });
    }



    calculate(){

        //wyliczenie kosztów
        const tax = this.tax.value * (this.rent.value - this.spoldzielnia.value);
        const commision = (this.rent.value - tax - this.spoldzielnia.value) * this.commision.value;
        const costs = tax + parseFloat(this.spoldzielnia.value) + commision;

        //wyliczenie zysku nominalnego i rentowności
        const profit_netto = Math.floor((this.rent.value - costs)*100)/100;
        const profitability = this.round((profit_netto * 12)/this.budget.value*100, 2);

        this.profit_netto.value = profit_netto;
        this.profitability.value = profitability;

        this.injectHTML(profit_netto, profitability);

        const confirmBox = document.querySelector('#confirmBtn');
        confirmBox.addEventListener('click', () => {

            this.form.submit();
        });

    }



    injectHTML(profit_netto, profitability){

        let node = document.createElement('div');
        node.classList.add('confirmBox');
        node.innerHTML = 
            `<span class="exit">x</span>
            <p>Zysk inwestycyjny netto z czynszu:
            <strong>${profit_netto} zł</strong></p>
            <p>Rentowność roczna wynosi:</h4>
            <strong>${profitability}%</strong></p>
            <h4>Utworzyć zbiórkę z takimi parametrami?</h4>
            <button id="confirmBtn" class="btn">Tak utwórz</button>`;

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



    round(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }
}

export default CreatePoolForm