var raiz = "";
var zip = "";
var api = "";
var pasta = "";
var contemPasta = false;
var baixa = "";
var pastaRaiz = "";
var conta = 4;

function loadClient() {
    gapi.client.setApiKey($("#api").val());
    return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest")
        .then(function() { console.log("GAPI client loaded for API"); },
            function(err) { console.error("Error loading GAPI client for API", err); });
}

function lerPasta(id, nome, extensao) {
    setTimeout(function() {
        conta++;
        return gapi.client.drive.files.list({
        "pageSize": 1000,
        "q": "'" + id + "' in parents",
        "spaces": "drive"
        }).then(function(response) {
            
            for (i = 0; i < response.result.files.length; i++) {
                if (response.result.files[i].mimeType.includes("video")) {
                    if (extensao === ".strm") {
                        zip.file(zip.folder(new RegExp(nome + "/"))[0].name + response.result.files[i].name + extensao, "https://www.googleapis.com/drive/v3/files/" + response.result.files[i].id + "?alt=media&key=" + api);
                    } else if (extensao === ".wax") {
                        zip.file(zip.folder(new RegExp(nome + "/"))[0].name + response.result.files[i].name + extensao, '<ASX><ENTRY><REF HREF = "https://www.googleapis.com/drive/v3/files/' + response.result.files[i].id + '?alt=media&key=' + api + '"/></ENTRY></ASX>');
                    }
                } else if (response.result.files[i].mimeType.includes("folder")) {
                    zip.folder(zip.folder(new RegExp(nome + "/"))[0].name + response.result.files[i].name);
                    lerPasta(response.result.files[i].id , response.result.files[i].name, extensao);
                }
            }
        },
        function(err) { console.error("Execute error", err); });
    }, 2000);
}

function checaPasta() {
    if (contemPasta) {
        $(".resultado").show("slow");
        $(".resultado").html('<button type="button" class="disabled baixar btn">Aguarde</button>');
        var texto = $(".baixar").text();
        j  = 0;
        var intervalo = setInterval(function() {
            $(".baixar").append(".");
            j++;
            if(j == 4){
                $(".baixar").html(texto);
                j = 0;
            }
        }, 500);
        var espera = setInterval(function() {
            conta--;
            if (conta === 0) {
                clearInterval(intervalo);
                $(".baixar").text("Baixar");
                $(".baixar").attr("onclick","baixar()");
                $(".baixar").removeClass("disabled");
                $(".baixar").addClass("bt-baixar");
                clearInterval(espera);
                conta = 4;
            }
        }, 1000);
    } else {
        $(".resultado").show("slow");
        $(".resultado").html('<button type="button" class="baixar btn bt-baixar" onclick="baixar()">Baixar</button>');
    }
}

function nomePastaRaiz() {
    return gapi.client.drive.files.get({
        "fileId": pasta
      }).then(function(response) {
            pastaRaiz = response.result.name;
        },
    function(err) { console.error("Execute error", err); });
}

function gerar(extensao) {
    baixa = extensao.toUpperCase().replace(".","");
    zip = new JSZip();
    $(".resultado").hide("slow");
    $(".resultado").html();
    api = $("#api").val();
    pasta = $("#pasta").val();
    if (pasta.includes("id")) {
        pasta = pasta.match("id=(.*)")[1];
    }

    if (pasta != "" && api != "") {
        nomePastaRaiz();
        return gapi.client.drive.files.list({
        "pageSize": 1000,
        "q": "'" + pasta + "' in parents",
        "spaces": "drive"
        }).then(function(response) {
            raiz = response;
            for (i = 0; i < response.result.files.length; i++) {
                if (response.result.files[i].mimeType.includes("video")) {
                    if (extensao === ".strm") {
                        zip.folder(pastaRaiz).file(response.result.files[i].name + extensao, "https://www.googleapis.com/drive/v3/files/" + response.result.files[i].id + "?alt=media&key=" + api);
                    } else if (extensao === ".wax") {
                        zip.folder(pastaRaiz).file(response.result.files[i].name + extensao, '<ASX><ENTRY><REF HREF = "https://www.googleapis.com/drive/v3/files/' + response.result.files[i].id + '?alt=media&key=' + api + '"/></ENTRY></ASX>');
                    }
                } else if (response.result.files[i].mimeType.includes("folder")) {
                    if (extensao === ".wax" || extensao === ".strm"){
                        zip.folder(pastaRaiz + "/" + response.result.files[i].name);
                        lerPasta(response.result.files[i].id, response.result.files[i].name, extensao);
                        contemPasta = true;
                    }
                }
            }
            checaPasta();
        },
        function(err) { console.error("Execute error", err); });
    }
}

function baixar() {
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, baixa + "-" + pastaRaiz + ".zip");
    });
}

function help(){
    $('#alertaModal').modal('hide');
    $("#alertamodal").modal();
}

$(window).on("load",function() {
    if (localStorage.getItem("p") === null) {
        localStorage.setItem("p","n");
        help();
    } else {
        $("#api").val(localStorage.getItem("api"));
        loadClient();
    }
    $("#gerador").submit(function( event ) {
        event.preventDefault();
    });

    $("#api").focusout(function(){
        if ($("#api").val() != "") {
            loadClient();
        }
    });
    
});

gapi.load("client");

window.onbeforeunload = function() {
    if ($("#api").val() != "") {
        localStorage.setItem("api", $("#api").val());
    }
}