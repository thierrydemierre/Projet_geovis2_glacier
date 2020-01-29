var mymap = L.map('map').setView([46.6, 8.6], 8);



// Définir les différentes couches de base:
var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});
var fond_glaciers= L.tileLayer('https://api.mapbox.com/styles/v1/tdemierr/cjpo46dnz0acr2rp99nd81wye/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGRlbWllcnIiLCJhIjoiY2phMTFsMGR3ODYyMjJ3b3JoYTY4bmo3NiJ9.iJuCcFzuVQL4WoTfy40WBA',{
  attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> contributors'
});
fond_glaciers.addTo(mymap);

var baseLayers = {
  "Fond de carte Mapbox": fond_glaciers,
  "Fond de carte OpenStreetMap": osmLayer
};
var overlays = {};


// Ajouter la couche de base par défaut à la carte.
L.control.layers(baseLayers, overlays).addTo(mymap);

var marqueurs = [];
var icones = {};

icones['rouge'] = L.icon({
  iconUrl: 'https://github.com/christiankaiser/map-marker-icons/raw/master/icons/plain-red.png',
  iconSize: [28, 41]
});

icones['bleu'] = L.icon({
  iconUrl: 'https://github.com/christiankaiser/map-marker-icons/raw/master/icons/plain-blue.png',
  iconSize: [28, 41]
});


function show_glaciers(){

  var url = '/glaciers_info.json';

  $.getJSON(url, function(data){
    var dict={};
    for (var i=0; i <data.length; i++){
      var glacier = data[i];
      var glacier_name= glacier.nom.replace("'", ' ');
      dict[glacier_name]=ajouter_marqueur_glacier(glacier);
    }
        GlacierDictionary =dict; // store Globale
    autocomplete(document.getElementById("myInput"), Object.keys(dict));

    $('#glacier_form').on('submit', function(e){
      e.preventDefault();
      dict[$('#myInput').val()].fire("click");
    });
    });
}

show_glaciers();

//coordonnées
mymap.on('mousemove', function(e){
  var coord = e.latlng;
  $('#coordonnees').html('Coordonnées: ' + coord.lat.toFixed(5) +' / '+ coord.lng.toFixed(5));
});

//ajout des marqueurs
var glacier_selectionne = null;
function ajouter_marqueur_glacier(glacier){
  var id_glacier = glacier.id.replace('/', '-');
  var icone_marqueur = icones['bleu'];
   if (id_glacier == "A10g-05" || id_glacier == "A22-02" || id_glacier == "A50d-01" || id_glacier == "A50i-06" || id_glacier == "A50i-07" || id_glacier == "A50i-19" ||
   id_glacier == "A51e-08" || id_glacier == "A51e-12" || id_glacier == "A55f-03" || id_glacier == "B16-01" || id_glacier == "B22-01" || id_glacier == "B36-26" || id_glacier == "B43-03" ||
   id_glacier == "B45-04" || id_glacier == "B52-17" || id_glacier == "B52-20" || id_glacier == "B52-24" || id_glacier == "B52-29" || id_glacier == "B52-32" || id_glacier == "B52-33" ||
   id_glacier == "B56-03" || id_glacier == "B82-14" || id_glacier == " B83-03" || id_glacier == "C14-10" || id_glacier == "C83-12" || id_glacier == "C84-16" || id_glacier == "E23-16" ||
   id_glacier == "E23-18"){
     icone_marqueur = icones['rouge'];
 }
  var m = L.marker([glacier.y, glacier.x], {icon:icone_marqueur}).addTo(mymap);
  marqueurs.push(m)
  m.on('click', function(e){
    var html = '<td>les glaciers suisse</td>';
    $('infobox').html(html);
    mymap.panTo(([glacier.y, glacier.x]),{animate: true});
    mymap.flyTo(([glacier.y, glacier.x]),14);
    $('#menu_param option').prop("disabled",true);

    if(icone_marqueur == icones['rouge']){
      $('#menu_param option').prop("disabled",false);
    }
    if(icone_marqueur == icones['bleu']){
      $('#menu_param option').first().prop("disabled",false);
      $('#menu_param option').first().prop("selected",true);
    }
    glacier_selectionne = glacier;
    dessineGraphique();
  })
  return m;
}

// zoom depuis la BARRE


// function zoom_barre(glacier){
// $('#myInput').on('change', function(e){
//   var id_glacier = $('#myInput').val();
//   if (id_glacier == "") return;
//   var glacier = glacier[id_glacier];
//   mymap.panTo(([glacier.y, glacier.x]), {animate: true});
//    mymap.flyTo(([glacier.y, glacier.x]),14);
// });
// }



function dessineGraphique(){
  var quelGraphique = $('#menu_param').val();
  if (quelGraphique == '') return;
  else if (glacier_selectionne == null) return ;
   else afficher_graphique_glacier(glacier_selectionne, quelGraphique);
}


//affichage des différents graphiques
function afficher_graphique_glacier(glacier, type_graphique){
  var id_glacier = glacier.id.replace('/', '-'); //transformation des / en - car ils peuvent poser problème
  if (type_graphique ==  "2") {
      $.getJSON('/ela/'+id_glacier+'.json', function(data){
        draw_graphique_ela(data);
      //on peut appeler la fonction de création des marqueurs pour qu'ils changent en fonction du paramètre
    });
  } else if (type_graphique == "3") {
    $.getJSON('/mass_balance/'+id_glacier+'.json', function(data){
        draw_graphique_mass_balance(data);
});
} else if (type_graphique == "4") {
  $.getJSON('/winter_mass_balance/'+id_glacier+'.json', function(data){
    draw_graphique_winter_mass_balance(data);
  });
} else if (type_graphique == "5") {
  $.getJSON('/summer_mass_balance/'+id_glacier+'.json', function(data){
    draw_graphique_summer_mass_balance(data);
  });
  }  else {
      $.getJSON('/length/'+id_glacier+'.json', function(data){
        draw_graphique_length(data);
    });
  }
}


//CREATION DES DIFFERENTS GRAPHIQUES
//LENGTH


function draw_graphique_length(data){

  //paramètres de base
  var margin = {top: 20, right: 20, bottom: 50, left: 46};
  var width = 400;
  var height = 200;

  var parseTime = d3.timeParse("%Y-%m-%d");
  var dateFormat = d3.timeFormat("%d.%m.%Y");

  //projection pour les axes
  var x = d3.scaleTime().range([10, 350]);
  var y = d3.scaleLinear().range([180, 10]);

    //fonction qui définira la courbe du graphique
   var line = d3.line()
     .x(function(d) { return x(parseTime(d.date)); }) // la fonction se fait sur les données on reprend la ligne 0 et 1 du length.json pour avoir les données
     .y(function(d) { return y(d.length); });

  // création du svg
  $('#graph_length').html(''); // on reprend le div du graphe
  var svg = d3.select("#graph_length")
    .append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

    function make_x_gridlines() {
        return d3.axisBottom(x)
            .ticks(15)
    }

    // lignes grilles
    function make_y_gridlines() {
        return d3.axisLeft(y)
            .ticks(10)
    }


  x.domain(d3.extent(data.lengths, function(d) { return parseTime(d.date); })); //même chose pour ses deux lignes où on reprends les données
  y.domain(d3.extent(data.lengths, function(d) { return d.length; }));

  // Ajout de l'axe X
  svg.append("g")
      .attr("transform", "translate(40," + y(0) + ")")
      .call(d3.axisBottom(x))

  // Ajout de l'axe Y et du texte associé pour la légende
  svg.append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(y))
       .append("text")
           .attr("fill", "#000")
           .attr("transform", "rotate(-90)")
           .attr("y", 0 -margin.left)
           .attr("x",  0-(height/2))
           .attr("dy", "0.71em")
           .style("text-anchor", "middle")
           .text("Longueur");

//ajout des grilles en X
           svg.append("g")
               .attr("class", "grid")
               .attr("stroke", "lightgrey")
               .attr("opacity", 0.7)
               .attr("stroke-width", 0.2)
               .attr("transform", "translate(40," + 180 + ")")
               .call(make_x_gridlines()
                   .tickSize(-height)
                   .tickFormat("")
               )

           // ajout des grilles en Y
           svg.append("g")
               .attr("class", "grid")
               .attr("stroke", "lightgrey")
               .attr("opacity", 0.7)
               .attr("stroke-width", 0.2)
               .attr("transform", "translate(50,0)")
               .call(make_y_gridlines()
                   .tickSize(-width)
                   .tickFormat("")
               )

  // titre
  svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Value vs Date Graph");

  // Ajout d'un path calculé par la fonction line à partir des données de notre fichier.
  svg.append("path")
      .datum(data.lengths)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("class", "line")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .attr("transform", "translate(50,0)");
    }





//EQUILIBRIUM LINE


function draw_graphique_ela(data){

  //paramètres de base
  var margin = {top: 20, right: 20, bottom: 50, left: 46};
  var width = 400;
  var height = 200;

  var parseTime = d3.timeParse("%Y-%m-%d");
  var dateFormat = d3.timeFormat("%d.%m.%Y");

  //projection pour les axes
  var x = d3.scaleTime().range([10, 350]);
  var y = d3.scaleLinear().range([180, 10]);

    //fonction qui définira la courbe du graphique
   var line = d3.line()
     .x(function(d) { return x(parseTime(d.date)); }) // la fonction se fait sur les données on reprend la ligne 0 et 1 du length.json pour avoir les données
     .y(function(d) { return y(d.ela); });

  // création du svg
  $('#graph_length').html(''); // on reprend le div du graphe
  var svg = d3.select("#graph_length")
    .append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

    function make_x_gridlines() {
        return d3.axisBottom(x)
            .ticks(15)
    }

    function make_y_gridlines() {
        return d3.axisLeft(y)
            .ticks(10)
    }

  x.domain(d3.extent(data.elas, function(d) { return parseTime(d.date); })); //même chose pour ses deux lignes où on reprends les données
  y.domain(d3.extent(data.elas, function(d) { return d.ela; }));

  // Ajout de l'axe X
  svg.append("g")
      .attr("transform", "translate(40," + height/1.1 + ")")
      .call(d3.axisBottom(x));

  // Ajout de l'axe Y et du texte associé pour la légende
  svg.append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(y))
       .append("text")
           .attr("fill", "#000")
           .attr("transform", "rotate(-90)")
           .attr("y", 0-margin.left)
           .attr("x", 0-(height/2))
           .attr("dy", "0.71em")
           .style("text-anchor", "middle")
           .text("Altitude de la ligne d'équilibre");


           svg.append("g")
               .attr("class", "grid")
               .attr("stroke", "lightgrey")
               .attr("opacity", 0.7)
               .attr("stroke-width", 0.2)
               .attr("transform", "translate(40," + 180 + ")")
               .call(make_x_gridlines()
                   .tickSize(-height)
                   .tickFormat("")
               )

           svg.append("g")
               .attr("class", "grid")
               .attr("stroke", "lightgrey")
               .attr("opacity", 0.7)
               .attr("stroke-width", 0.2)
               .attr("transform", "translate(50,0)")
               .call(make_y_gridlines()
                   .tickSize(-width)
                   .tickFormat("")
               )

  // Ajout d'un path calculé par la fonction line à partir des données de notre fichier.
  svg.append("path")
      .datum(data.elas)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("class", "line")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .attr("transform", "translate(50,0)");
}



//MASSE BALANCE


function draw_graphique_mass_balance(data){

  //paramètres de base
  var margin = {top: 20, right: 20, bottom: 50, left: 46};
  var width = 400;
  var height = 200;

  var parseTime = d3.timeParse("%Y-%m-%d");
  var dateFormat = d3.timeFormat("%d.%m.%Y");

  //projection pour les axes
  var x = d3.scaleTime().range([10, 350]);
  var y = d3.scaleLinear().range([180, 10]);

    //fonction qui définira la courbe du graphique
   var line = d3.line()
     .x(function(d) { return x(parseTime(d.date)); }) // la fonction se fait sur les données on reprend la ligne 0 et 1 du length.json pour avoir les données
     .y(function(d) { return y(d.mass_balance); });

  // création du svg
  $('#graph_length').html(''); // on reprend le div du graphe
  var svg = d3.select("#graph_length")
    .append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

    function make_x_gridlines() {
        return d3.axisBottom(x)
            .ticks(15)
    }

    function make_y_gridlines() {
        return d3.axisLeft(y)
            .ticks(10)
    }


  x.domain(d3.extent(data.mass_balances, function(d) { return parseTime(d.date); })); //même chose pour ses deux lignes où on reprends les données
  y.domain(d3.extent(data.mass_balances, function(d) { return d.mass_balance; }));

  // Ajout de l'axe X
  svg.append("g")
      .attr("transform", "translate(40," + height/1.1 + ")")
      .call(d3.axisBottom(x));

  // Ajout de l'axe Y et du texte associé pour la légende
  svg.append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(y))
       .append("text")
           .attr("fill", "#000")
           .attr("transform", "rotate(-90)")
           .attr("y", 0-margin.left)
           .attr("x", 0- (height/2))
           .attr("dy", "0.71em")
           .style("text-anchor", "middle")
           .text("Bilan de masse");

                      svg.append("g")
                          .attr("class", "grid")
                          .attr("stroke", "lightgrey")
                          .attr("opacity", 0.7)
                          .attr("stroke-width", 0.2)
                          .attr("transform", "translate(40," + 180 + ")")
                          .call(make_x_gridlines()
                              .tickSize(-height)
                              .tickFormat("")
                          )

                      svg.append("g")
                          .attr("class", "grid")
                          .attr("stroke", "lightgrey")
                          .attr("opacity", 0.7)
                          .attr("stroke-width", 0.2)
                          .attr("transform", "translate(50,0)")
                          .call(make_y_gridlines()
                              .tickSize(-width)
                              .tickFormat("")
                          )

  // Ajout d'un path calculé par la fonction line à partir des données de notre fichier.
  svg.append("path")
      .datum(data.mass_balances)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("class", "line")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .attr("transform", "translate(50,0)");
}



// WINTER MASS BALANCE

function draw_graphique_winter_mass_balance(data){

  //paramètres de base
  var margin = {top: 20, right: 20, bottom: 50, left: 46};
  var width = 400;
  var height = 200;

  var parseTime = d3.timeParse("%Y-%m-%d");
  var dateFormat = d3.timeFormat("%d.%m.%Y");

  //projection pour les axes
  var x = d3.scaleTime().range([10, 350]);
  var y = d3.scaleLinear().range([180, 10]);

    //fonction qui définira la courbe du graphique
   var line = d3.line()
     .x(function(d) { return x(parseTime(d.date)); }) // la fonction se fait sur les données on reprend la ligne 0 et 1 du length.json pour avoir les données
     .y(function(d) { return y(d.winter_mass_balance); });

  // création du svg
  $('#graph_length').html(''); // on reprend le div du graphe
  var svg = d3.select("#graph_length")
    .append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

    function make_x_gridlines() {
        return d3.axisBottom(x)
            .ticks(15)
    }

    function make_y_gridlines() {
        return d3.axisLeft(y)
            .ticks(10)
    }


  x.domain(d3.extent(data.winter_mass_balances, function(d) { return parseTime(d.date); })); //même chose pour ses deux lignes où on reprends les données
  y.domain(d3.extent(data.winter_mass_balances, function(d) { return d.winter_mass_balance; }));

  // Ajout de l'axe X
  svg.append("g")
      .attr("transform", "translate(40," + height/1.1 + ")")
      .call(d3.axisBottom(x));

  // Ajout de l'axe Y et du texte associé pour la légende
  svg.append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(y))
       .append("text")
           .attr("fill", "#000")
           .attr("transform", "rotate(-90)")
           .attr("y", 0-margin.left)
           .attr("x", 0- (height/2))
           .attr("dy", "0.71em")
           .style("text-anchor", "middle")
           .text("Bilan de masse en hiver");

                      svg.append("g")
                          .attr("class", "grid")
                          .attr("stroke", "lightgrey")
                          .attr("opacity", 0.7)
                          .attr("stroke-width", 0.2)
                          .attr("transform", "translate(40," + 180 + ")")
                          .call(make_x_gridlines()
                              .tickSize(-height)
                              .tickFormat("")
                          )

                      svg.append("g")
                          .attr("class", "grid")
                          .attr("stroke", "lightgrey")
                          .attr("opacity", 0.7)
                          .attr("stroke-width", 0.2)
                          .attr("transform", "translate(50,0)")
                          .call(make_y_gridlines()
                              .tickSize(-width)
                              .tickFormat("")
                          )

  // Ajout d'un path calculé par la fonction line à partir des données de notre fichier.
  svg.append("path")
      .datum(data.winter_mass_balances)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("class", "line")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .attr("transform", "translate(50,0)");
}



//SUMMER MASS balance

function draw_graphique_summer_mass_balance(data){

  //paramètres de base
  var margin = {top: 20, right: 20, bottom: 50, left: 46};
  var width = 400;
  var height = 200;

  var parseTime = d3.timeParse("%Y-%m-%d");
  var dateFormat = d3.timeFormat("%d.%m.%Y");

  //projection pour les axes
  var x = d3.scaleTime().range([10, 350]);
  var y = d3.scaleLinear().range([180, 10]);

    //fonction qui définira la courbe du graphique
   var line = d3.line()
     .x(function(d) { return x(parseTime(d.date)); }) // la fonction se fait sur les données on reprend la ligne 0 et 1 du length.json pour avoir les données
     .y(function(d) { return y(d.summer_mass_balance); });

  // création du svg
  $('#graph_length').html(''); // on reprend le div du graphe
  var svg = d3.select("#graph_length")
    .append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

    function make_x_gridlines() {
        return d3.axisBottom(x)
            .ticks(15)
    }

    function make_y_gridlines() {
        return d3.axisLeft(y)
            .ticks(10)
    }


  x.domain(d3.extent(data.summer_mass_balances, function(d) { return parseTime(d.date); })); //même chose pour ses deux lignes où on reprends les données
  y.domain(d3.extent(data.summer_mass_balances, function(d) { return d.summer_mass_balance; }));

  // Ajout de l'axe X
  svg.append("g")
      .attr("transform", "translate(40," + height/1.1 + ")")
      .call(d3.axisBottom(x));

  // Ajout de l'axe Y et du texte associé pour la légende
  svg.append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(y))
       .append("text")
           .attr("fill", "#000")
           .attr("transform", "rotate(-90)")
           .attr("y", 0-margin.left)
           .attr("x", 0-(height/2))
           .attr("dy", "0.71em")
           .style("text-anchor", "middle")
           .text("Bilan de masse en été");

           svg.append("g")
               .attr("class", "grid")
               .attr("stroke", "lightgrey")
               .attr("opacity", 0.7)
               .attr("stroke-width", 0.2)
               .attr("transform", "translate(40," + 180 + ")")
               .call(make_x_gridlines()
                   .tickSize(-height)
                   .tickFormat("")
               )

           svg.append("g")
               .attr("class", "grid")
               .attr("stroke", "lightgrey")
               .attr("opacity", 0.7)
               .attr("stroke-width", 0.2)
               .attr("transform", "translate(50,0)")
               .call(make_y_gridlines()
                   .tickSize(-width)
                   .tickFormat("")
               )

  // Ajout d'un path calculé par la fonction line à partir des données de notre fichier.
  svg.append("path")
      .datum(data.summer_mass_balances)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("class", "line")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .attr("transform", "translate(50,0)");
}




//BARRE DE RECHERCHE AUTOCOMPLETE

function autocomplete(inp, arr) {

  var currentFocus;
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      this.parentNode.appendChild(a);
      for (i = 0; i < arr.length; i++) {
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          b = document.createElement("DIV");
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
              b.addEventListener("click", function(e) {
              inp.value = this.getElementsByTagName("input")[0].value;
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        currentFocus++;
        addActive(x);
      } else if (e.keyCode == 38) {
        currentFocus--;
        addActive(x);
      } else if (e.keyCode == 13) {
        e.preventDefault();
        if (currentFocus > -1) {
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}
document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});
}
