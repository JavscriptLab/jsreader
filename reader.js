
javascript: (function(w, d) {
    

    function getSelectionText() {
        
        var text = "";
        if (w.getSelection) {
            text = w.getSelection().toString();
        } else if (d.selection && d.selection.type != "Control") {
            text = d.selection.createRange().text;
        }
        if (text == "") {
            var element = d.getElementsByTagName("a"), index;
            for (index = element.length - 1; index >= 0; index--) {
                element[index].parentNode.removeChild(element[index]);
            }
            return d.body.innerText;
        };
        return text;
    };
debugger;
    var sentences = getSelectionText().replace(/([\n.?!])\s*(?=[A-Za-z])/g, "$1|").split("|");
    var noti = 0;
    var showednot = false;

    function notifyevent() {
        
        if (showednot == false) {
            showednot = true;
            noti++;
            if (sentences[noti]) {
                notify(sentences, noti);
            };
            setTimeout(function() {
                    showednot = false;
                },
                500);
            return true;
        } else {
            return false;
        }
    };
    var noticlicked = false;
    function notify() {
        
        var theBody = sentences[noti];
        var options = {
            body: theBody,
            requireInteraction: true,
            badge:true
        };

        var n = new Notification("", options);
        var synth = window.speechSynthesis;
        var voices = synth.getVoices();
        var msg = new window.SpeechSynthesisUtterance(theBody);
        msg.volume = 1;
        msg.voice = voices[4];
        
        synth.speak(msg);
        
        n.onclick = function(event) {
          
            event.preventDefault();
            n.close();
            if (notifyevent() == false) {
               
                setTimeout(function () {
                        notifyevent();
                    noticlicked = true;
                        setTimeout(function () {
                                noticlicked = false;
                            },
                            1000);
                    },
                    1000);
            }
            noticlicked = true;
            setTimeout(function () {
                    noticlicked = false;
                },
                1000);
        };
        n.onclose = function(event) {
        
            if (noticlicked == false) {
                post("https://translate.yandex.net/api/v1.5/tr.json/translate?" +
                    "key=trnsl.1.1.20170714T074814Z.bd31c09a2cd9c98c.589fb2caee26aea2ad57556b7cfefdeefa555ec8&" +
                    "text=" + n.body + "&" +
                    "lang=en-ml&" +
                    "format=text",
                    null,
                    function() {
                        if (noticlicked == false) {
                            if (this.readyState == 4 && this.status == 200) {
                                var myArr = JSON.parse(this.responseText);
                                
                                sentences.splice(noti + 1, 0, myArr.text.join());
                                sentences.splice(noti + 2, 0, sentences[noti]);
                                notifyevent();
                            }
                        }
                    });
                var pieces = n.body.split(" ");
                for (var m = 0; m < pieces.length; m++) {

                    var text = pieces[m].split("'")[0].split(",")[0].split(".")[0];
                    if (text.length > 4) {
                       dictionary(text.toLowerCase());
                    }
                }
            }
           
        };
    };

    var dictionaryvalues = {};

    function dictionary(text) {
       
        get(
            "http://proxy.hackeryou.com/?reqUrl=https://od-api.oxforddictionaries.com:443/api/v1/entries/en/" + text + "?" +
            "xmlToJSON=false&" +
            "proxyHeaders[Accept]=application/json&" +
            "proxyHeaders[app_id]=2ccd0586&" +
            "proxyHeaders[app_key]=7966de896f428640eb27d5798323098b",
            null,
            function () {
               
                    if (this.readyState == 4 && this.status == 200) {
                        var myArr = JSON.parse(this.responseText);
                        debugger;
                        loopthrough(myArr.results, text, text);
                        var mytext = dictionaryvalues[text];
                        var pieces = dictionaryvalues[text].split("\n");
                        var loopi = 0;
                        for (var mi = 0; mi < pieces.length; mi++) {
                            var content = pieces[mi];
                            var nextcontent = pieces[mi+1];
                            if (content.startsWith("definition") && nextcontent.startsWith("text")) {
                                loopi++;
                                sentences.splice(noti + 2, 0, text + "\n\n" + content + "\n\n" + nextcontent);
                            }
                            if (loopi > 2) {
                                break;
                            }

                        }

                        

                    }
                
            });
    };
    function loopthrough(myArr, text, keep) {

        if (myArr instanceof Array) {
            for (var q = 0; q < myArr.length; q++) {
                var obj = myArr[q];
                if (typeof obj == "object") {
                    loopthrough(obj, text, keep);
                }
                if (typeof obj == "string") {
                    dictionaryvalues[keep] += text + ":" + obj + "\n";
                }
            }
        } else {
            for (var key in myArr) {
                if (myArr.hasOwnProperty(key)) {
                    if (typeof myArr[key] == "object") {
                        loopthrough(myArr[key],key , keep);
                    } else {
                        dictionaryvalues[keep] += key + ":" + myArr[key] + "\n";
                    }
                }
            }
        }
        
    }
    function post(url,postdata,callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = callback;
        xmlhttp.open("POST", url, true);
        xmlhttp.send();
    }
    function get(url, postdata, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = callback;
        xmlhttp.open("GET", url);
       
        xmlhttp.send();
    }
    Notification.requestPermission().then(function(result) {
        if (result === 'denied') {
            return;
        };
        if (result === 'default') {
            notify(sentences, noti);
        };
        notify(sentences, noti);
    });
})(window, document);
