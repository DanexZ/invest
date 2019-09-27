class AddAssetForms{
    constructor(){
        this._csrf = document.querySelector('[name=_csrf]').value;
        this.selectInput = document.querySelector('#choose-asset');
        this.place = document.querySelector('#specyfic-asset');
        this.kawalerkaForm(this.selectInput.value);
        this.events();
    }


    events(){
        this.selectInput.addEventListener('change', e => {
            const value = e.target.value;

            if(value == 'studio'){
                this.kawalerkaForm(value);
            }

        });
    }

    kawalerkaForm(type){
        
        this.place.innerHTML =

            `<form id="assets-form" action="/dashboard/asset/create" method="POST" style="width: 250px">
                <h4>Kawalerka</h4>
                <label for="purchase">Cena kupna</label>
                <input id="purchase" type="number" name="purchase" min="0" step="0.01" required>

                <label for="rent">Ustaw czynsz</label>
                <input id="rent" type="number" name="rent" min="0" step="0.01" required>

                <label for="deposit">Kaucja</label>
                <input id="deposit" type="number" name="deposit" min="0" step="0.01" required>

                <label for="meters">Metraż</label>
                <input type="number" id="meters" name="meters" min="0" step="0.01" required>

                <label for="register_nr">Numer księgi wieczystej</label>
                <input type="text" id="register_nr" name="register_nr>

                <label for="street">Ulica (Bielska 8)</label>
                <input type="text" id="street" name="street" required>

                <label for="apartment_nr">Nr mieszkania (27)</label>
                <input type="number" id="apartment_nr" name="apartment_nr">

                <label for="postcode">Kod pocztowy</label>
                <input type="text" id="postcode" name="postcode"required>

                <label for="city">Miasto</label>
                <input type="text" id="city" name="city"required>

                <label for="court_city">Miasto sądu rejonowego</label>
                <input type="text" id="court_city" name="court_city"required>

                <label for="components">Pomieszczenia</label>
                <textarea name="components" id="components" cols="30" rows="10"></textarea>

                <label for="basement">Piwnica</label>
                <select id="basement" name="basement">
                    <option value="przynalezna" selected="selected" >Przynależna</option>
                    <option value="wspoldzielona">Współdzielona</option>
                </select>

                <label for="equipment">Sprzęty</label>
                <textarea name="equipment" id="equipment" cols="30" rows="10"></textarea>

                <label for="spoldzielnia_name">Nazwa spółdzielni mieszkaniowej</label>
                <input type="text" id="spoldzielnia_name" name="spoldzielnia_name"required>

                <label for="light">Licznik prądu</label>
                <input type="number" id="light" name="light">

                <label for="gas">Licznik gazu</label>
                <input type="number" id="gas" name="gas">

                <label for="water">Licznik wody</label>
                <input type="number" id="water" name="water">

                <label for="details">Szczegóły/Adnotacje</label>
                <textarea name="details" id="details" cols="30" rows="10"></textarea>

                <label for="nr">Nr powiązanej zbiórki</label>
                <input id="nr" type="number" name="nr" min="0" required>

                <input type="hidden" id="type" name="type" value="${type}">
                <input type="hidden" name="_csrf" value="${this._csrf}">

                <button class="btn">Utwórz</button>
            </form>`;
    }
}

export default AddAssetForms