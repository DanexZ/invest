class UmowaNajmu{
    constructor(id){
        this.id = id.slice(5);
        this.form = document.querySelector('#order' + this.id);
        this.events();
    }


    events(){
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.handler();
        });
    }


    handler(){
        this.rent = document.querySelector('#rent' + this.id);
        this.deposit = document.querySelector('#deposit' + this.id);
        this.termin = document.querySelector('#termin' + this.id);
        //this.bezterminowo = document.querySelector('#bezterminowo' + this.id);
        //this.place = document.querySelector('#place' + this.id);
        //Parametry lokalu
        this.city = document.querySelector('#city' + this.id);
        this.postcode = document.querySelector('#postcode' + this.id);
        this.street = document.querySelector('#street' + this.id);
        this.apartment_nr = document.querySelector('#apartment_nr' + this.id);
        this.meters = document.querySelector('#meters' + this.id);
        this.register_nr = document.querySelector('#register_nr' + this.id);
        this.court_city = document.querySelector('#court_city' + this.id);
        this.spoldzielnia_name = document.querySelector('#spoldzielnia_name' + this.id);
        this.components = document.querySelector('#components' + this.id);
        this.basement = document.querySelector('#basement' + this.id);
        this.equipment = document.querySelector('#equipment' + this.id);
        this.light = document.querySelector('#light' + this.id);
        this.gas = document.querySelector('#gas' + this.id);
        this.water = document.querySelector('#water' + this.id);
        //Owner
        this.owner_name = document.querySelector('#owner_name' + this.id);
        this.owner_surname = document.querySelector('#owner_surname' + this.id);
        this.owner_account = document.querySelector('#owner_account' + this.id);
        //Tenant
        this.tenant_name = document.querySelector('#tenant_name' + this.id);
        this.tenant_surname = document.querySelector('#tenant_surname' + this.id);
        //this.birthday = document.querySelector('#birthday' + this.id);
        this.id_card = document.querySelector('#id_card' + this.id);
        this.pesel = document.querySelector('#pesel' + this.id);
        this.phone_nr = document.querySelector('#phone_nr' + this.id);
        this.email = document.querySelector('#email' + this.id);


        const current_day = currentDate(); //zwraca równą datę bez sekund
        const single_day = 1000*60*60*24;
        let basement_paragraph;
        let termin_paragraph;


        if(this.basement.value == 'przynalezna'){
            basement_paragraph = 'Zgodnie z wpisem do KW piwnica ma charakter pomieszczenia przynależnego, opłaty zaś wynikające z regulaminu rozliczania kosztów gospodarowania zasobami mieszkaniowymi oraz ustalania opłat za użytkowanie lokali Spółdzielni Mieszkaniowej ' + this.spoldzielnia_name.value + ' są już wliczone w kwotę czynszu, o którym mowa w pkt 1 §4';
        } else {
            basement_paragraph = 'Zgodnie z wpisem do KW piwnica ma charakter powierzchni współdzielonej, opłaty zaś są już w liczone w kwotę czynszu, o którym mowa w pkt 1 §4.';
        }

        //if(this.bezterminowo.checked){
            termin_paragraph = 'Umowa najmu lokalu mieszkalnego zostaje zawarta na czas nieokreślony';
        //}

    
        /** obliczenie ewentualnych odsetek karnych */
        /** =============================== */

        /** Format numeru konta */
        const owner_account = formatAccount(this.owner_account.value);
        /** =============================== */

        /** Data urodzenia i płeć na podstawie pesel */
        let aInt = new Array();

        for (let i=0; i<11; i++){
            aInt[i] = parseInt(this.pesel.value.substring(i,i+1));
        }

        let year = 1900+aInt[0]*10+aInt[1];

        if (aInt[2]>=2 && aInt[2]<8){
            year+=Math.floor(aInt[2]/2)*100;
        }
            
        if (aInt[2]>=8){
            year-=100;
        }

        let month = (aInt[2]%2)*10+aInt[3];
        let day = aInt[4]*10+aInt[5];

        if(month < 10) month = '0'+month;
        if(day < 10 ) day = '0'+day;

        const birthday = day+'-'+month+'-'+year;
        /** ================================ */

        const plec = (aInt[9]%2==1)?"M":"K";
            
        const data = {
            rent: parseFloat(this.rent.value).toFixed(2),
            deposit: this.deposit.value.toFixed(2),
            place: 'Bolesławiec',

            city: this.city.value,
            postcode: this.postcode.value,
            street: this.street.value,
            apartment_nr: this.apartment_nr.value,
            meters: this.meters.value,
            register_nr: this.register_nr.value,
            court_city: this.court_city.value,
            spoldzielnia_name: this.spoldzielnia_name.value,
            components: this.components.value,
            equipment: this.equipment.value,
            light: this.light.value,
            gas: this.gas.value,
            water: this.water.value,

            owner_name: this.owner_name.value,
            owner_surname: this.owner_surname.value,
            owner_account: owner_account,

            tenant_name: this.tenant_name.value,
            tenant_surname: this.tenant_surname.value,
            id_card: this.id_card.value,
            birthday: birthday, 
            pesel: this.pesel.value,
            phone_nr: this.phone_nr.value,
            email: this.email.value,
            //pay_date: currentDate('specyfic_date', this.termin.value),
            currentDate: current_day,

            basement_paragraph: basement_paragraph,
            termin_paragraph: termin_paragraph
        }

        const pdf = this.createDocument(data);

        this.render(pdf);
    }



    createDocument(data){

        const pdf = {
            content: [
                {text: "Umowa najmu lokalu mieszkalnego\n\n", style: "h1"},
                {text: [
                    `Zawarta w dniu `,
                    {text: `${data.currentDate} `, bold: true},
                    `w `,
                    {text: `${data.place} `, bold: true},
                    `(miejscowość, w której znajduje się lokal) pomiędzy:\n\n`

                ]},
                {text: [
                    `Imię i nazwisko: `,
                    {text: `${data.owner_name} ${data.owner_surname}\n`, bold: true }
                      
                ]},
                {text: '(dane Wynajmującego)\n\n', style: 'h3'},
                'zwanym dalej "Wynajmującym" oraz:\n',
                {text: [
                    `Imię i nazwisko: `,
                    {text: `${data.tenant_name} ${data.tenant_surname}\n`, bold: true}
                ]},
                {text: [
                    `Data urodzenia: `,
                    {text: `${data.birthday}\n`, bold: true}
                ]},
                {text: [
                    `Nr dowodu osobistego `,
                    {text: `${data.id_card}\n`, bold: true}
                ]},
                {text: [
                    `PESEL: `,
                    {text: `${data.pesel}\n`, bold: true}
                ]},
                {text: [
                    `Nr telefonu: `,
                    {text: `${data.phone_nr}\n`, bold: true}
                ]},
                {text: [
                    `Adres poczty elektronicznej: `,
                    {text: `${data.email}\n\n`, bold: true}
                ]},

                {text: '(dane Najemcy)\n\n', style: 'h3'},
                `zwanym dalej "Najemcą", została zawarta umowa następującej treści:\n\n`,

                {text: `§1\n\n`, style: 'h2'},

                {text: [
                    `1. Przedmiotem niniejszej Umowy jest lokal mieszkalny znajdujący się pod adresem: `,
                    {text: `${data.street}/${data.apartment_nr} ${data.postcode} ${data.city}\n`, bold: true},
                    `("zwany dalej lokalem mieszkalnym").\n`
                ]},

                `2. Wynajmujący oświadczył, że jest właścicielem lokalu mieszkalnego, o którym mowa w pkt 1.\n`,
                
                `3. Lokal mieszkalny składa się z następujących pomieszczeń: ${data.components} \n`,

                {text: [
                    `4. Powierzchnia użytkowa lokalu mieszkalnego, o którym mowa w pkt 1 stanowi `,
                    {text: `${data.meters}. `, bold: true},
                    `Lokal jest objęty wpisem do Księgi Wieczystej o numerze `,
                    {text: `${data.register_nr} `, bold: true},
                    `(zwanym dalej “wpisem do KW”) prowadzonej przez Sąd Rejonowy w `,
                    {text: `${data.court_city}.`, bold: true}
                ]},

                `5. ${data.basement_paragraph}\n`,

                {text: [
                    `Wyposażenie lokalu mieszkalnego w chwili oddawania go do używania Najemcy stanowi: `,
                    {text: `${data.equipment}\n`, bold: true}
                ]},

                {text: `§2\n\n`, style: 'h2'},

                `1. Wynajmujący oddaje Najemcy do używania ww. lokal mieszkalny wraz z wyposażeniem, o którym mowa w pkt 5 §1.\n`,
                `2. Najemca oświadcza, że zobowiązuje się płacić Wynajmującemu ustalony czynsz.\n\n`,

                {text: `§3\n\n`, style: 'h2'},

                `1. ${data.termin_paragraph}\n\n`,

                {text: `§4\n\n`, style: 'h2'},

                {text: [
                    `1. Strony ustaliły, że czynsz najmu za jeden miesiąc wynosi `,
                    {text: `${data.rent} `, bold: true},
                    `złotych i płatny będzie razem z opłatami eksploatacyjnymi, o których mowa w pkt 1 §5 do 11 dnia miesiąca, który następuje po miesiącu, za który wymienione należności są należne.\n\n`
                ]},

                {text: `§5\n\n`, style: 'h2'},

                 `1. Najemca, poza zapłatą czynszu na rzecz Wynajmującego, obowiązany będzie dokonywać opłat wynikających z zużycia wody, energii elektrycznej i gazu.\n`,
                 `2. Stan liczników w chwili zawierania niniejszej umowy jest następujący:\n`,
                 `- energia elektryczna: ${data.light}\n`,
                 `- gaz: ${data.gas}\n`,
                 `- woda: ${data.water}\n`,
                 `3. Najemca, zgodnie z art. 681 KC, będzie na własny koszt dokonywał drobnych nakładów na rzecz lokalu mieszkalnego.\n\n`,

                 {text: `§6\n\n`, style: 'h2'},

                {text: [
                    `1. Na poczet nieopłaconych należności z tytułu najmu lokalu mieszkalnego Najemca wpłaca Wynajmującemu kaucję w wysokości `,
                    {text: `${data.deposit} `, bold: true},
                    `złotych, którą to kaucję Wynajmujący ma obowiązek zwrócić w kwocie pomniejszonej o niespłacone przez najemcę zobowiązania.\n\n`
                ]},

                {text: `§7\n\n`, style: 'h2'},

                `1. Wynajmujący zobowiązuje się przedstawiać Najemcy bieżące rachunki obejmujące opłaty eksploatacyjne, o których mowa w pkt 1 §5 w terminie co najmniej 7 dni przed terminem płatności.\n\n`,

                {text: `§8\n\n`, style: 'h2'},

                `1. Najemca nie ma prawa do podnajmowania mieszkania ani jego części osobom trzecim.\n\n`,

                {text: `§9\n\n`, style: 'h2'},

                `1. O nadchodzącej na nazwisko Wynajmującego korespondencji i sprawach wymagających jego udziału Najemca będzie niezwłocznie informował Wynajmującego telefonicznie lub mailowo.\n\n`,

                {text: `§10\n\n`, style: 'h2'},

                `1. Najemca nie dokona żadnych zmian budowlanych w lokalu mieszkalnym bez uprzedniej zgody Wynajmującego otrzymanej w formie pisemnej.\n\n`,

                {text: `§11\n\n`, style: 'h2'},

                `1. Wynajmującemu przysługuje prawo wypowiedzenia umowy najmu z minimum miesięcznym wyprzedzeniem (liczonym od końca miesiąca kalendarzowego, w którym wypowiedzenie zostało dostarczone) w następujących wypadkach:\n\n`,

                `- jeżeli Najemca pomimo pisemnego upomnienia nadal używa lokalu w sposób sprzeczny z umową lub niezgodnie z jego przeznaczeniem lub zaniedbuje obowiązki, dopuszczając do powstawania szkód lub niszczy urządzenia przeznaczone do wspólnego korzystania przez mieszkańców albo wykracza w sposób rażący lub uporczywy przeciwko porządkowi domowemu, czyniąc uciążliwym korzystanie z innych lokali, lub:\n\n`,
                `- jeżeli, pomimo pisemnego uprzedzenia o zamiarze wypowiedzenia umowy najmu i wyznaczenia dodatkowego terminu spłaty, Najemca zalega z płatnościami czynszu za przynajmniej 3 pełne okresy, lub:\n\n`,
                `- jeżeli Najemca wynajął, podnajął albo oddał do bezpłatnego użytku lokal mieszkalny lub jego część osobom trzecim bez zgody Wynajmującego.\n\n`,

                {text: `§12\n\n`, style: 'h2'},

                `1. Jakiekolwiek zmiany dotyczące przedmiotu najmu, w szczególności dotyczące zakresu użytkowania, kondycji lokalu mieszkalnego, warunków płatności czy wypowiedzenia, wymagają zachowania formy pisemnej pod rygorem nieważności.\n\n`,

                {text: `§13\n\n`, style: 'h2'},

                `W sprawach nieuregulowanych niniejszą umową zastosowanie mają przepisy ustawy o ochronie praw lokatorów, mieszkaniowym zasobie gminy i o zmianie Kodeksu cywilnego oraz przepisy Kodeksu cywilnego.\n\n`,

                {text: `§14\n\n`, style: 'h2'},

                `Niniejsza umowa zostaje zawarta drogą elektroniczną w serwisie znajdującym się pod adresem internetowym https://moneyu.pl/`
            ],
            styles: {
                h1: {
                    alignment: 'center',
                    fontSize: 18,
                    bold: true
                },
                h2: {
                    alignment: 'center',
                    fontSize: 12,
                    bold: true
                },
                h3: {
                    alignment: 'center',
                    fontSize: 10,
                    bold: true
                },
                account: {
                    alignment: 'center',
                    bold: true
                },
                defaultStyle: {
                    fontSize: 10
                }
            }
        }
        
        return pdf
    }



    render(pdf){ 
        pdfMake.createPdf(pdf).download('umowa_najmu.pdf');
    }
    
}

export default UmowaNajmu