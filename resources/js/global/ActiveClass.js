class ActiveClass{
    constructor(){
        this.page = document.querySelector('#page').textContent;
        this.addClass();
    }
    

    addClass(){
        console.log(this.page);
        if(this.page == 'send_money'){
            document.querySelector('#send_money_li').classList.add('active');
        } else if(this.page == 'inpay') {
            document.querySelector('#inpay_li').classList.add('active');
        } else if(this.page == 'subkonto_history' ) {
            document.querySelector('#subkonto_history_li').classList.add('active'); 
        } else if(this.page == 'pools_currentPool'){
            document.querySelector('#pools_currentPool_li').classList.add('active'); 
        } else if(this.page == 'pools_history'){
            document.querySelector('#pools_history_li').classList.add('active');
        } else if(this.page == 'admin_pools'){
            document.querySelector('#admin_pools_li').classList.add('active');
            document.querySelector('#admin_pools_index_li').classList.add('active');
        } else if(this.page == 'admin_pools_create'){
            document.querySelector('#admin_pools_li').classList.add('active');
            document.querySelector('#admin_pools_create_li').classList.add('active');
        } else if(this.page == 'assets'){
            document.querySelector('#assets_li').classList.add('active');
        } else if(this.page == 'properties'){
            document.querySelector('#properties_li').classList.add('active');
        } else if(this.page == 'machines'){
            document.querySelector('#machines_li').classList.add('active');
        } else if(this.page == 'my_products'){
            document.querySelector('#my_products_li').classList.add('active');
        } else if(this.page == 'properties'){
            document.querySelector('#properties_li').classList.add('active');
        } else if(this.page == 'account'){
            document.querySelector('#account_li').classList.add('active');
        } else if(this.page == 'password'){
            document.querySelector('#password_li').classList.add('active');
        } else if(this.page == 'account_documents'){
            document.querySelector('#account_documents_li').classList.add('active');
        } else if(this.page == 'account_emerytura'){
            document.querySelector('#emerytura_li').classList.add('active');
        } else if(this.page == 'information'){
            document.querySelector('#information_li').classList.add('active');
        } else if(this.page == 'information_regulamin'){
            document.querySelector('#information_regulamin_li').classList.add('active');
        } else if(this.page == 'information_faq'){
            document.querySelector('#information_faq_li').classList.add('active');
        } else if(this.page == 'information_mission'){
            document.querySelector('#information_mission_li').classList.add('active');
        } else if(this.page == 'money'){
            document.querySelector('#money_li').classList.add('active');
        } else if(this.page == 'money_history'){
            document.querySelector('#money_history_li').classList.add('active');
        }
    }
}

export default ActiveClass