//---- CALIBRACION----
let AMP_MIN = 0.01;
let AMP_MAX = 0.3;
let FREC_MIN = 125;
let FREC_MAX = 270;
let volumen;

//----AUDIO----
let manchas = [];
let layer = [];
let anchoImagen, altoImagen;

let moveManchas = false; // Variable para controlar el movimiento de las manchas
let yOffsets = [100, 100, 100, 100]; // Desplazamientos verticales iniciales para cada capa
let mostrarCapas = false; // Variable para controlar si se deben mostrar las capas
let backgrounds = [];
let timers = []; // Array para almacenar los temporizadores de las capas
let mic, fft; // Agregar FFT
let mostrarTexto = true;
let textoMostrado = false;
let fondoCargado = false; // Variable para controlar si se ha cargado el fondo
let numeroDeSilbido = 0;
let silbidoDetectado = false; // Bandera para registrar la detección de "silbido" en el ciclo actual


let amp;
let ampCruda;
let frec;

let gestorAmp;
let gestorFrec;
let audioContext;
const pichModel = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

let classifier;
const options = { probabilityThreshold: 0.9 };
let label;
// Teachable Machine model URL:
let soundModel = 'https://teachablemachine.withgoogle.com/models/YoxZR5sR31/';




function preload() {
  for (let i = 0; i < 39; i++) {
    let nombre = "imagenes/mancha" + nf(i, 2) + ".png";
    manchas[i] = loadImage(nombre);
  }

  for (let i = 1; i < 13; i++) {
    backgrounds.push(loadImage("imagenes/fondo" + nf(i, 2) + ".png"));
  }

   // Load SpeechCommands18w sound classifier model
   classifier = ml5.soundClassifier(soundModel + 'model.json', options);

}



function setup() {
  createCanvas(2045, 1150);
  colorMode(HSB, 255, 255, 255, 255);

  audioContext = getAudioContext();
  mic = new p5.AudioIn();
  mic.start(startPitch);

  userStartAudio(); // forzar el inicio del audio en el navegador
  
  classifier.classify(gotResult);

  gestorAmp = new GestorSenial(AMP_MIN, AMP_MAX);
  gestorFrec = new GestorSenial(FREC_MIN, FREC_MAX);

  fft = new p5.FFT();
  fft.setInput(mic);
  
  // Crear las capas de gráficos
  for (let i = 0; i < 4; i++) {
    layer[i] = createGraphics(2045, 1150);
  }

  // Redimensionar todas las imágenes
  anchoImagen = width / 5;
  altoImagen = height;

}



  function draw() {
    // Actualizar el nivel de amplitud del micrófono
    gestorAmp.actualizar(mic.getLevel());
    ampCruda = mic.getLevel();
    amp = gestorAmp.filtrada;
    volumen = mic.getLevel();
  
    // Mostrar mensaje inicial y cargar fondo aleatorio
    if (!textoMostrado && mostrarTexto) {
      textSize(40);
      textAlign(CENTER);
      fill(0);
      text("Di mmm... para comenzar", width / 2, height / 2);
      textoMostrado = true;
    }
  
    if (!fondoCargado && !mostrarTexto) {
      let randomIndex = floor(random(backgrounds.length));
      background(backgrounds[randomIndex]);
      fondoCargado = true;
    }
  
    // Mostrar el volumen
    
  
    // Obtener el espectro de frecuencias
    let spectrum = fft.analyze();
    let bass = fft.getEnergy("bass");
    let treble = fft.getEnergy("treble");
    let freqValue = map(bass, 0, 255, 0, 1);
    let freqValueTreble = map(treble, 0, 255, 0, 1);
  
    // Clasificar el sonido y actuar en consecuencia
    if (label === "mmm") {
      if (!mic.started) {
        mic.start();
      }
      mostrarTexto = false;
    }
  
    // Mostrar las capas gradualmente si se detecta "ahhh"
    if (label === "ahhh") {
      mostrarCapas = true;
      mostrarCapasGraduadas();
    }
  
    // Mostrar las manchas en movimiento si se detecta "silbido"
    if (label === "silbido") {
      if (!silbidoDetectado) {
        numeroDeSilbido++;
        silbidoDetectado = true;
        moveManchas = true; // Activar el movimiento de las manchas cuando se hace clic
  

      }
    } else {
      silbidoDetectado = false;
    }
  
    // Dibujar las capas en el lienzo principal si se deben mostrar
    if (mostrarCapas) {
      for (let i = 0; i < 4; i++) {
        if (yOffsets[i] === 0) {
          layer[i].clear();
          let x = 0;
          let y = yOffsets[i];
          for (let j = 0; j < 5; j++) {
            let imagen = manchas[i * 5 + j];
         
              if (moveManchas) {
                if (i === 0) {
                  y += map(mic.getLevel(), 0.01, 80, 2, 5) * sin(frameCount * map(freqValue, 0, 1, 0.01, 0.4));
                  x -= map(mic.getLevel(), 0.01, 80, 2, 6) * sin(frameCount * map(freqValue, 0, 1, 0.01, 0.3));
                } else if (i === 1) {
                  y += map(mic.getLevel(), 0.01, 80, 2, 5) * sin(frameCount * map(freqValue, 0, 1, 0.01, 0.5));
                  x -= map(mic.getLevel(), 0.01, 80, 2, 8) * sin(frameCount * map(freqValue, 0, 1, 0.01, 0.4));
                } else if (i === 2) {
                  y += map(mic.getLevel(), 0.01, 80, 2, 4) * sin(frameCount * map(freqValueTreble, 0, 1, 0.01, 0.6));
                  x -= map(mic.getLevel(), 0.01, 80, 2, 7) * sin(frameCount * map(freqValueTreble, 0, 1, 0.01, 0.5));
                } else if (i === 3) {
                  y += map(mic.getLevel(), 0.01, 80, 2, 6) * sin(frameCount * map(freqValueTreble, 0, 1, 0.01, 0.4));
                  x -= map(mic.getLevel(), 0.01, 80, 2, 5) * sin(frameCount * map(freqValueTreble, 0, 1, 0.01, 0.3));
                
                }
            }
  
            if (i === 1) {
              if (numeroDeSilbido % 2 === 0) {
                let valueCapa2 = map(mic.getLevel(), 0.01, 6.60, 40, 0);
                layer[i].tint(valueCapa2, 255);
              } else {
                let aclararCapa2 = map(mic.getLevel(), 0.01, 8.40, 120, 60);
                layer[i].tint(color(20, 255, aclararCapa2, 255));
              }
            } else if (i === 2) {
              if (numeroDeSilbido % 2 === 0) {
                layer[i].tint(color(38, 165, 255, 255));
              } else {
                layer[i].tint(color(42, 165, 190, 255));
              }
            } else if (i === 3) {
              if (numeroDeSilbido % 2 === 0) {
                let valorCapa4 = map(mic.getLevel(), 0.01, 7.40, 200, 100);
                layer[i].tint(color(170, 185, valorCapa4, 255));
              } else {
                let aclararCapa2 = map(mic.getLevel(), 0.01, 8.40, 255, 200);
                layer[i].tint(color(170, aclararCapa2, 255, 255));
              }
            }
  
            layer[i].image(imagen, x + 60, y + 60, anchoImagen - 120, altoImagen - 120);
            x += anchoImagen;
          }
        }
      }
  
      for (let i = 0; i < 4; i++) {
        if (yOffsets[i] === 0) {
          image(layer[i], 0, 0);
        }
      }
  
      if (yOffsets[0] === 0) {
        let mouseGray = map(freqValue, 0, 1, 70, 150);
        for (let j = 0; j < 5; j++) {
          let imagen = manchas[j];
          layer[0].tint(mouseGray);
          layer[0].image(imagen, j * anchoImagen + 60, 30);
        }
      }
    }
    
    if (label === "aplauso" && volumen > 1) {
      ReiniciarLienzo();
      moveManchas = false;
    }
  }




//----- DETECCION DE FRECUENCIA-----
function startPitch() {
  pitch = ml5.pitchDetection(pichModel, audioContext , mic.stream, modelLoaded);
}

function modelLoaded() {
  getPitch();
}

function getPitch() {
  pitch.getPitch(function(err, frequency) {
    if (frequency) {
      gestorFrec.actualizar(frequency);
      frec = gestorFrec.filtrada;
    } else {
    }
    getPitch();
  })
}


// Función para mezclar las imágenes aleatoriamente
function mezclarImages() {
  for (let i = manchas.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [manchas[i], manchas[j]] = [manchas[j], manchas[i]];
  }
}

// Función para mostrar las capas gradualmente
function mostrarCapasGraduadas() {
  const delayInSeconds = 10; // Retardo de 10 segundos entre cada capa
  const delayInMilliseconds = delayInSeconds * 100; // Convertir segundos a milisegundos

  for (let i = 0; i < layer.length; i++) {
    // Guardar los temporizadores para poder cancelarlos si es necesario
    timers[i] = setTimeout(() => {
      yOffsets[i] = 0; // Ajustar el desplazamiento vertical de la capa
    }, i * delayInMilliseconds); // Aumentar el retardo para cada capa
  }
}


function ReiniciarLienzo() {
  mostrarCapas = false; // Ocultar las capas
  numeroDeSilbido = 0;
  moveManchas = false;
  yOffsets = [100, 100, 100, 100]; // Restablecer los desplazamientos verticales
  mezclarImages(); // Volver a mezclar las imágenes

  // Cancelar cualquier temporizador en progreso para mostrar las capas
  for (let i = 0; i < timers.length; i++) {
    clearTimeout(timers[i]); // Detener el temporizador
  }
  timers = []; // Reiniciar la lista de temporizadores

  // Ocultar las capas estableciendo los yOffsets a valores distintos de 0
  for (let i = 0; i < layer.length; i++) {
    yOffsets[i] = 100; // Restablecer el desplazamiento para cada capa
  }

  // Seleccionar un fondo aleatorio y aplicarle el tint con opacidad del 50%
  let randomIndex = floor(random(backgrounds.length));
  background(backgrounds[randomIndex]);
}

function limpiarVolumenTexto() {
  // Limpiar el área donde se muestra el valor del volumen
  fill(255); // Rellenar con blanco
  noStroke();
  rect(0, 0, width, 40); // Rectángulo para el fondo del número
}


//-------- CLASIFICADOR------
function gotResult(error, results) {
  // Display error in the console
  if (error) {
    console.error(error);
    return;
  }

  // Loop through all results
  for (let i = 0; i < results.length; i++) {
    const label = results[i].label;
   
   
   
  }
  
  // Log the results for debugging purposes
  console.log(results);
  label = results[0].label;
  console.log(label);
  console.log("Número de silbidos:", numeroDeSilbido);
}