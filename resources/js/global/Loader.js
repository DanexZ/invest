class Loader{
    constructor(total, amount){
        this.loader = document.querySelector('#loader').getContext('2d');
        this.total = total;
        this.amount = amount
        this.cw = this.loader.canvas.width;
        this.ch = this.loader.canvas.height;
        this.fill();
    }


    fill(){

        let percentage = (this.total/this.amount);

        const diff = ( (percentage) * Math.PI * 2 * 10);

        this.loader.lineWidth = 15;
        this.loader.fillStyle = '#000';
        this.loader.strokeStyle = 'rgb(145, 191, 41)';
        this.loader.textAlign = 'center';
        this.loader.font = '20px Helvetica';

        let a;

        if(percentage != 1 && percentage != 0){
            a = (percentage * 100).toFixed(2);
        } else if(percentage == 1) {
            a = 100;
        } else if( percentage == 0 ){
            a = 0;
        } else if( percentage > 99.99 && percentage < 100 ){
            a = 99.99;
        }

        this.loader.fillText(a +'%', 75, 80);
        this.loader.beginPath();
        this.loader.arc(75,75,60, 1.5*Math.PI, (1.5 * Math.PI) + (6.282)*percentage );
        this.loader.stroke();
    }
}

export default Loader