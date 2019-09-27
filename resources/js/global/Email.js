var email = { send: function (a) { return new Promise(function (n, e) { a.nocache = Math.floor(1e6 * Math.random() + 1), a.Action = "Send"; var t = JSON.stringify(a); email.ajaxPost("https://smtpjs.com/v3/smtpjs.aspx?", t, function (e) { n(e) }) }) }, ajaxPost: function (e, n, t) { var a = email.createCORSRequest("POST", e); a.setRequestHeader("Content-type", "application/x-www-form-urlencoded"), a.onload = function () { var e = a.responseText; null != t && t(e) }, a.send(n) }, ajax: function (e, n) { var t = email.createCORSRequest("GET", e); t.onload = function () { var e = t.responseText; null != n && n(e) }, t.send() }, createCORSRequest: function (e, n) { var t = new XMLHttpRequest; return "withCredentials" in t ? t.open(e, n, !0) : "undefined" != typeof XDomainRequest ? (t = new XDomainRequest).open(e, n) : t = null, t } };

class Email{
    constructor(topic, body){
        this.topic = topic;
        this.body = body;
        this.sendEmail()
    }

    sendEmail(){
        email.send({
            Host : "moneyu.nazwa.pl",
            Username : "kontakt@moneyu.pl",
            Password : "392dd71;)5564#D",
            To : 'daniel.zawadzki4@gmail.com',
            From : "kontakt@moneyu.pl",
            Subject: this.topic,
            Body : this.body
        });
    }
}

export default Email