"use strict";

var camera = {
    pos: vec3(1, 1, 1),
    at: vec3(0, 0, 0), 
    up: vec3(0, 1, 0),
    theta: vec3(-35.3, 45, 0),
    vTrans: 0.0,
    dir: vec3(0, 0, -1) 
};

const LUZ = {
    pos: vec4(2.0, 15.0, 2.0, 1.0),
    amb: vec4(0.4, 0.4, 0.4, 1.0), 
    dif: vec4(1.0, 1.0, 1.0, 1.0),
    esp: vec4(1.0, 1.0, 1.0, 1.0),
};

const MAT_MESA = {
    amb: vec4(0.4, 0.3, 0.2, 1.0), // Marrom escuro
    dif: vec4(0.5, 0.4, 0.3, 1.0), 
    esp: vec4(0.2, 0.1, 0.05, 1.0), 
    alfa: 50.0,
};

const MAT_PRATO = {
    amb: vec4(1.0, 1.0, 1.0, 1.0), // Cinza claro
    dif: vec4(1.0, 1.0, 1.0, 1.0), 
    esp: vec4(1.0, 1.0, 1.0, 1.0), 
    alfa: 50.0,
};

const MAT_TOALHA = {
    amb: vec4(0.6, 0.1, 0.1, 1.0), // Vermelho escuro
    dif: vec4(0.8, 0.2, 0.2, 1.0), 
    esp: vec4(0.9, 0.3, 0.3, 1.0), 
    alfa: 50.0,
};

const MAT_CILINDRO = {
    amb: vec4(1.0, 1.0, 1.0, 1.0), // Cinza claro
    dif: vec4(1.0, 1.0, 1.0, 1.0), 
    esp: vec4(1.0, 1.0, 1.0, 1.0), 
    alfa: 50.0,
};

const MAT_CHAO = {
    amb: vec4(0.5, 0.5, 0.5, 1.0), // Cinza escuro
    dif: vec4(0.6, 0.6, 0.6, 1.0), 
    esp: vec4(0.3, 0.3, 0.3, 1.0), 
    alfa: 30.0,
};

const MAT_MOSCA = {
    amb: vec4(0.2, 0.2, 0.2, 1.0), // Cinza escuro
    dif: vec4(0.4, 0.4, 0.4, 1.0), 
    esp: vec4(0.8, 0.8, 0.8, 1.0), 
    alfa: 50.0,
};

const MAT_ASA = {
    amb: vec4(0.8, 0.8, 0.8, 1.0), // Cinza claro
    dif: vec4(0.9, 0.9, 0.9, 1.0), 
    esp: vec4(1.0, 1.0, 1.0, 1.0), 
    alfa: 50.0,
};

const URL_CHAO = "https://st2.depositphotos.com/4196725/6866/i/450/depositphotos_68663229-stock-photo-vintage-squared-floor-texture.jpg"
const URL_PAREDE = "https://i.imgur.com/mwoy3A0.png"
const FOVY = 60;
const ASPECT = 1;
const NEAR = 0.1;
const FAR = 50;

const FUNDO = [0.0, 0.0, 0.0, 1.0];
const EIXO_X_IND = 0;
const EIXO_Y_IND = 1;
const EIXO_Z_IND = 2;
const EIXO_X = vec3(1, 0, 0);
const EIXO_Y = vec3(0, 1, 0);
const EIXO_Z = vec3(0, 0, 1);

var gl;
var gCanvas;

var objetos = [];

var gShader = {
    aTheta: null,
};

var gCtx = {
    view: mat4(),
    perspective: mat4(),
    pause: false,
};

var gPositionOffset = vec3(0, 0, 0); 

window.onload = main;

function main() {
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("Vixe! Não achei WebGL 2.0 aqui :-(");

    gl.viewport(0, 0, gCanvas.width, gCanvas.height);
    gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
    gl.enable(gl.DEPTH_TEST);

    document.addEventListener('keydown', controlaCamera);


    crieShaders();
    desenharObjetos();
    render();
}

function controlaCamera(event) {
    switch (event.key.toLowerCase()) {
        case 'j': // Diminui velocidade de translação
            camera.vTrans -= 0.05;
            //console.log("Velocidade de translação diminuída: ", camera.vTrans);
            break;
        case 'l': // Aumenta velocidade de translação
            camera.vTrans += 0.05;
            //console.log("Velocidade de translação aumentada: ", camera.vTrans);
            break;
        case 'k': // Para a câmera
            camera.vTrans = 0;
            //console.log("Câmera parada");
            break;
        case 'w': // Incrementa rotação em x 
            camera.theta[0] += 1;
            //console.log("Rotação em X incrementada: ", camera.theta[0]);
            break;
        case 's': // Decrementa rotação em x
            camera.theta[0] -= 1;
            //console.log("Rotação em X decrementada: ", camera.theta[0]);
            break;
        case 'a': // Incrementa rotação em y
            camera.theta[1] += 1;
            //console.log("Rotação em Y incrementada: ", camera.theta[1]);
            break;
        case 'd': // Decrementa rotação em y
            camera.theta[1] -= 1;
            //console.log("Rotação em Y decrementada: ", camera.theta[1]);
            break;
    }
    atualizaDirecaoCamera(); 
}

function atualizaDirecaoCamera() {
    let radThetaX = radians(camera.theta[0]);
    let radThetaY = radians(camera.theta[1]);
    let radThetaZ = radians(camera.theta[2]);

    camera.dir = vec3(
        -Math.sin(radThetaY) * Math.cos(radThetaX),
        Math.sin(radThetaX),
        -Math.cos(radThetaY) * Math.cos(radThetaX)
    );

    camera.up = vec3(
        -Math.sin(radThetaZ),
        Math.cos(radThetaZ),
        0
    );

    camera.at = add(camera.pos, camera.dir);
}

function atualizaCamera(dt) {
    let deslocamento = scale(camera.vTrans * dt, camera.dir);
    camera.pos = add(camera.pos, deslocamento);
    atualizaDirecaoCamera();
}

function crieShaders() {
    gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
    gl.useProgram(gShader.program);

    gShader.uModel = gl.getUniformLocation(gShader.program, "uModel");
    gShader.uView = gl.getUniformLocation(gShader.program, "uView");
    gShader.uPerspective = gl.getUniformLocation(gShader.program, "uPerspective");
    gShader.uInverseTranspose = gl.getUniformLocation(gShader.program, "uInverseTranspose");

    gCtx.perspective = perspective(FOVY, ASPECT, NEAR, FAR);
    gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

    gCtx.view = lookAt(camera.pos, camera.at, camera.up);
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    gShader.uLuzPos = gl.getUniformLocation(gShader.program, "uLuzPos");
    gl.uniform4fv(gShader.uLuzPos, LUZ.pos);

    // Uniforms para o chão
    gShader.uCorAmbChao = gl.getUniformLocation(gShader.program, "uCorAmbienteChao");
    gShader.uCorDifChao = gl.getUniformLocation(gShader.program, "uCorDifusaoChao");
    gShader.uCorEspChao = gl.getUniformLocation(gShader.program, "uCorEspecularChao");
    gShader.uAlfaEspChao = gl.getUniformLocation(gShader.program, "uAlfaEspChao");
    gShader.uIsChao = gl.getUniformLocation(gShader.program, "uIsChao");

    // Uniforms para o chão
    loadTextureChao(URL_CHAO);
    gl.uniform1i(gl.getUniformLocation(gShader.program, "uTextureChao"), 1); 
    gShader.uIsChao = gl.getUniformLocation(gShader.program, "uIsChao");

    // Uniforms para as paredes e textura
    loadTexture(URL_PAREDE);
    gl.uniform1i(gl.getUniformLocation(gShader.program, "uTexture"), 0);
    gShader.uIsParede = gl.getUniformLocation(gShader.program, "uIsParede");

    // Uniforms para a mesa
    gShader.uCorAmbMesa = gl.getUniformLocation(gShader.program, "uCorAmbienteMesa");
    gShader.uCorDifMesa = gl.getUniformLocation(gShader.program, "uCorDifusaoMesa");
    gShader.uCorEspMesa = gl.getUniformLocation(gShader.program, "uCorEspecularMesa");
    gShader.uAlfaEspMesa = gl.getUniformLocation(gShader.program, "uAlfaEspMesa");
    gShader.uIsMesa = gl.getUniformLocation(gShader.program, "uIsMesa");

    // Uniforms para o cilindro
    gShader.uCorAmbCilindro = gl.getUniformLocation(gShader.program, "uCorAmbienteCilindro");
    gShader.uCorDifCilindro = gl.getUniformLocation(gShader.program, "uCorDifusaoCilindro");
    gShader.uCorEspCilindro = gl.getUniformLocation(gShader.program, "uCorEspecularCilindro");
    gShader.uAlfaEspCilindro = gl.getUniformLocation(gShader.program, "uAlfaEspCilindro");
    gShader.uIsCilindro = gl.getUniformLocation(gShader.program, "uIsCilindro");

    // Uniforms para a toalha
    gShader.uCorAmbToalha = gl.getUniformLocation(gShader.program, "uCorAmbienteToalha");
    gShader.uCorDifToalha = gl.getUniformLocation(gShader.program, "uCorDifusaoToalha");
    gShader.uCorEspToalha = gl.getUniformLocation(gShader.program, "uCorEspecularToalha");
    gShader.uAlfaEspToalha = gl.getUniformLocation(gShader.program, "uAlfaEspToalha");
    gShader.uIsToalha = gl.getUniformLocation(gShader.program, "uIsToalha");

    // Uniforms para o prato (Prato)
    gShader.uCorAmbPrato = gl.getUniformLocation(gShader.program, "uCorAmbientePrato");
    gShader.uCorDifPrato = gl.getUniformLocation(gShader.program, "uCorDifusaoPrato");
    gShader.uCorEspPrato = gl.getUniformLocation(gShader.program, "uCorEspecularPrato");
    gShader.uAlfaEspPrato = gl.getUniformLocation(gShader.program, "uAlfaEspPrato");
    gShader.uIsPrato = gl.getUniformLocation(gShader.program, "uIsPrato");

    // Uniforms para a mosca
    gShader.uCorAmbMosca = gl.getUniformLocation(gShader.program, "uCorAmbienteMosca");
    gShader.uCorDifMosca = gl.getUniformLocation(gShader.program, "uCorDifusaoMosca");
    gShader.uCorEspMosca = gl.getUniformLocation(gShader.program, "uCorEspecularMosca");
    gShader.uAlfaEspMosca = gl.getUniformLocation(gShader.program, "uAlfaEspMosca");
    gShader.uIsMosca = gl.getUniformLocation(gShader.program, "uIsMosca");

    // Uniforms para a asa
    gShader.uCorAmbAsa = gl.getUniformLocation(gShader.program, "uCorAmbienteAsa");
    gShader.uCorDifAsa = gl.getUniformLocation(gShader.program, "uCorDifusaoAsa");
    gShader.uCorEspAsa = gl.getUniformLocation(gShader.program, "uCorEspecularAsa");
    gShader.uAlfaEspAsa = gl.getUniformLocation(gShader.program, "uAlfaEspAsa");
    gShader.uIsAsa = gl.getUniformLocation(gShader.program, "uIsAsa");

    // cores do chão
    gl.uniform4fv(gShader.uCorAmbChao, mult(LUZ.amb, MAT_CHAO.amb));
    gl.uniform4fv(gShader.uCorDifChao, mult(LUZ.dif, MAT_CHAO.dif));
    gl.uniform4fv(gShader.uCorEspChao, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspChao, MAT_CHAO.alfa);

    // Definir cores para a mesa
    gl.uniform4fv(gShader.uCorAmbMesa, mult(LUZ.amb, MAT_MESA.amb));
    gl.uniform4fv(gShader.uCorDifMesa, mult(LUZ.dif, MAT_MESA.dif));
    gl.uniform4fv(gShader.uCorEspMesa, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspMesa, MAT_MESA.alfa);

    // cores do cilindro
    gl.uniform4fv(gShader.uCorAmbCilindro, mult(LUZ.amb, MAT_CILINDRO.amb));
    gl.uniform4fv(gShader.uCorDifCilindro, mult(LUZ.dif, MAT_CILINDRO.dif));
    gl.uniform4fv(gShader.uCorEspCilindro, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspCilindro, MAT_CILINDRO.alfa);

    // cores da toalha
    gl.uniform4fv(gShader.uCorAmbToalha, mult(LUZ.amb, MAT_TOALHA.amb));
    gl.uniform4fv(gShader.uCorDifToalha, mult(LUZ.dif, MAT_TOALHA.dif));
    gl.uniform4fv(gShader.uCorEspToalha, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspToalha, MAT_TOALHA.alfa);

    // cores do Prato
    gl.uniform4fv(gShader.uCorAmbPrato, mult(LUZ.amb, MAT_PRATO.amb));
    gl.uniform4fv(gShader.uCorDifPrato, mult(LUZ.dif, MAT_PRATO.dif));
    gl.uniform4fv(gShader.uCorEspPrato, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspPrato, MAT_PRATO.alfa);

    // cores da mosca
    gl.uniform4fv(gShader.uCorAmbMosca, mult(LUZ.amb, MAT_MOSCA.amb));
    gl.uniform4fv(gShader.uCorDifMosca, mult(LUZ.dif, MAT_MOSCA.dif));
    gl.uniform4fv(gShader.uCorEspMosca, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspMosca, MAT_MOSCA.alfa);

    // cores das asas
    gl.uniform4fv(gShader.uCorAmbAsa, mult(LUZ.amb, MAT_ASA.amb));
    gl.uniform4fv(gShader.uCorDifAsa, mult(LUZ.dif, MAT_ASA.dif));
    gl.uniform4fv(gShader.uCorEspAsa, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspAsa, MAT_ASA.alfa);
}

function loadTexture(url) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
    var image = new Image();
    image.src = url;
    image.crossOrigin = "anonymous";
    image.addEventListener('load', function () {
        console.log("Carregou imagem", image.width, image.height);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    });

    return image;
}

function loadTextureChao(url) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    var image = new Image();
    image.src = url;
    image.crossOrigin = "anonymous";
    image.addEventListener('load', function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    });

    return image;
}

function atualizarObjetos(dt) {
    objetos.forEach(obj => obj.atualizar(dt));
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!gCtx.pause) {
        let dt = 1.0 / 60.0;
        atualizaCamera(dt);
        atualizarObjetos(dt);
    }
    gCtx.view = lookAt(camera.pos, camera.at, camera.up);
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    objetos.forEach(obj => obj.desenhar());

    window.requestAnimationFrame(render);
}

function desenharObjetos() {
    var posicoes = [];
    var normal = [];
    var texCoord = [];
    var np = 0;
    var centro = vec3(0.1, 0.1, 0.1);
    const tamanhoTampo = 1.0;
    const alturaTampo = 0.1;
    const alturaPernas = 0.9;
    const espessuraPernas = 0.1;
    const deslocamentoY = -1.0;

    // Dimensões da cozinha
    const larguraChao = 6;
    const profundidadeChao = 6;

    // Cria o chão
    posicoes = [];
    normal = [];
    texCoord = [];
    addRectangle(posicoes, normal, texCoord, vec3(0, deslocamentoY, 0), vec2(larguraChao, profundidadeChao));
    np = posicoes.length;
    objetos.push(new Chao(np, centro, posicoes, normal, texCoord));

    // Cria as paredes
    posicoes = [];
    normal = [];
    texCoord = [];
    const paredeAltura = 4;
    const paredeDeslocamentoY = deslocamentoY + paredeAltura / 2;

    addCuboidParede(posicoes, normal, texCoord, vec3(0, paredeDeslocamentoY, -profundidadeChao / 2), vec3(larguraChao, paredeAltura, 0.1), 'front'); // Parede de fundo
    addCuboidParede(posicoes, normal, texCoord, vec3(larguraChao / 2, paredeDeslocamentoY, 0), vec3(0.1, paredeAltura, profundidadeChao), 'right'); // Parede da direita
    addCuboidParede(posicoes, normal, texCoord, vec3(-larguraChao / 2, paredeDeslocamentoY, 0), vec3(0.1, paredeAltura, profundidadeChao), 'left'); // Parede da esquerda
    addCuboidParede(posicoes, normal, texCoord, vec3(0, paredeDeslocamentoY, profundidadeChao / 2), vec3(larguraChao, paredeAltura, 0.1), 'back'); // Parede da frente

    np = posicoes.length;
    objetos.push(new Parede(np, centro, posicoes, normal, texCoord));

    // Adiciona o tampo da mesa
    addCuboid(posicoes, normal, vec3(0, alturaPernas + deslocamentoY, 0), vec3(tamanhoTampo, alturaTampo, tamanhoTampo));

    // Adiciona as pernas da mesa
    const offsetX = (tamanhoTampo - espessuraPernas) / 2;
    const offsetZ = (tamanhoTampo - espessuraPernas) / 2;
    addCuboid(posicoes, normal, vec3(-offsetX, alturaPernas / 2 + deslocamentoY, -offsetZ), vec3(espessuraPernas, alturaPernas, espessuraPernas));
    addCuboid(posicoes, normal, vec3(offsetX, alturaPernas / 2 + deslocamentoY, -offsetZ), vec3(espessuraPernas, alturaPernas, espessuraPernas));
    addCuboid(posicoes, normal, vec3(-offsetX, alturaPernas / 2 + deslocamentoY, offsetZ), vec3(espessuraPernas, alturaPernas, espessuraPernas));
    addCuboid(posicoes, normal, vec3(offsetX, alturaPernas / 2 + deslocamentoY, offsetZ), vec3(espessuraPernas, alturaPernas, espessuraPernas));
    np = posicoes.length;
    objetos.push(new Mesa(np, centro, posicoes, normal));

    // Adiciona a toalha de mesa
    posicoes = [];
    normal = [];
    texCoord = [];
    addRectangle(posicoes, normal, texCoord, vec3(0.35, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.01, 0), vec2(0.23, 0.33));
    addRectangle(posicoes, normal, texCoord, vec3(-0.35, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.01, 0), vec2(0.23, 0.33));
    addRectangle(posicoes, normal, texCoord, vec3(0, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.01, 0.35), vec2(0.33, 0.23));
    addRectangle(posicoes, normal, texCoord, vec3(0, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.01, -0.35), vec2(0.33, 0.23));
    np = posicoes.length;
    objetos.push(new Toalha(np, centro, posicoes, normal));

    // Adiciona uma lata de refrigerante em cima da mesa
    posicoes = [];
    normal = [];
    addCylinder(posicoes, normal, vec3(0.14, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.01, -0.06), 0.05, 0.2, 36);
    np = posicoes.length;
    objetos.push(new Cilindro(np, centro, posicoes, normal));

    // Adiciona um prato
    posicoes = [];
    normal = [];
    addPrato(posicoes, normal, vec3(0.35, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.04, 0), 0.07, 0.1, 0.04, 36);
    addPrato(posicoes, normal, vec3(-0.35, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.04, 0), 0.07, 0.1, 0.04, 36);
    addPrato(posicoes, normal, vec3(0, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.04, 0.35), 0.07, 0.1, 0.04, 36);
    addPrato(posicoes, normal, vec3(0, alturaPernas + alturaTampo / 2 + deslocamentoY + 0.04, -0.35), 0.07, 0.1, 0.04, 36);
    np = posicoes.length;
    objetos.push(new Prato(np, centro, posicoes, normal));

    // Adiciona mosca
    const escala = 0.1; // Tamanho base do corpo da mosca
    posicoes = [];
    normal = [];
    let novaPosicao = add(camera.pos, scale(0.5, camera.dir));
    let centroMosca = vec3(novaPosicao[0], novaPosicao[1], novaPosicao[2]);
    
    // Corpo da mosca
    addSphere(posicoes, normal, vec3(0, escala * 0.6, 0), escala * 0.4, 36);
    np = posicoes.length;
    objetos.push(new Mosca(np, centroMosca, posicoes, normal));

    // Asas da mosca
    posicoes = [];
    normal = [];
    addAsa(posicoes, normal, vec3(0.06, escala * 0.5, 0), escala * 0.5, escala * 0.3);
    np = posicoes.length;
    objetos.push(new Asa(np, centroMosca, posicoes, normal, "direita"));

    posicoes = [];
    normal = [];
    addAsa(posicoes, normal, vec3(-0.06, escala * 0.5, 0), escala * 0.5, escala * 0.3);
    np = posicoes.length;
    objetos.push(new Asa(np, centroMosca, posicoes, normal, "esquerda"));

    // Cadeira
    const posicaoCadeira1 = vec3(tamanhoTampo / 2 - 0.5, deslocamentoY, 0.7);
    const rotacaoCadeira1 = vec3(0, 180, 0); 
    objetos.push(criarCadeira(posicaoCadeira1, rotacaoCadeira1));

    // Cadeira
    const posicaoCadeira2 = vec3(tamanhoTampo / 2 - 1.2, deslocamentoY, 0); 
    const rotacaoCadeira2 = vec3(0, 270, 0); 
    objetos.push(criarCadeira(posicaoCadeira2, rotacaoCadeira2));

    // Cadeira
    const posicaoCadeira3 = vec3(tamanhoTampo / 2 - 0.5, deslocamentoY, - 0.7); 
    const rotacaoCadeira3 = vec3(0, 0, 0); 
    objetos.push(criarCadeira(posicaoCadeira3, rotacaoCadeira3));

    // Cadeira
    const posicaoCadeira4 = vec3(tamanhoTampo / 2 + 0.2, deslocamentoY, 0); 
    const rotacaoCadeira4 = vec3(0, 90, 0); 
    objetos.push(criarCadeira(posicaoCadeira4, rotacaoCadeira4));

    // Adiciona o teto
    posicoes = [];
    normal = [];
    texCoord = [];
    addRectangle(posicoes, normal, texCoord, vec3(0, paredeDeslocamentoY + paredeAltura / 2, 0), vec2(larguraChao, profundidadeChao));
    np = posicoes.length;
    objetos.push(new Teto(np, centro, posicoes, normal, texCoord));
}

function criarCadeira(posicao, rotacao) {
    const tamanhoAssento = 0.5;
    const alturaAssento = 0.05;
    const alturaTotalCadeira = 0.45; 
    const alturaPernasCad = alturaTotalCadeira - alturaAssento; 
    const espessuraPernasCad = 0.05;
    const alturaEncosto = 0.5;
    const espessuraEncosto = 0.05;

    var posicoes = [];
    var normal = [];

    // Assento da cadeira
    addCuboid(posicoes, normal, vec3(0, alturaPernasCad, 0), vec3(tamanhoAssento, alturaAssento, tamanhoAssento));

    // Pernas da cadeira
    const offsetXCad = (tamanhoAssento - espessuraPernasCad) / 2;
    const offsetZCad = (tamanhoAssento - espessuraPernasCad) / 2;
    addCuboid(posicoes, normal, vec3(-offsetXCad, alturaPernasCad / 2, -offsetZCad), vec3(espessuraPernasCad, alturaPernasCad, espessuraPernasCad));
    addCuboid(posicoes, normal, vec3(offsetXCad, alturaPernasCad / 2, -offsetZCad), vec3(espessuraPernasCad, alturaPernasCad, espessuraPernasCad));
    addCuboid(posicoes, normal, vec3(-offsetXCad, alturaPernasCad / 2, offsetZCad), vec3(espessuraPernasCad, alturaPernasCad, espessuraPernasCad));
    addCuboid(posicoes, normal, vec3(offsetXCad, alturaPernasCad / 2, offsetZCad), vec3(espessuraPernasCad, alturaPernasCad, espessuraPernasCad));

    // Encosto da cadeira
    addCuboid(posicoes, normal, vec3(0, alturaPernasCad + alturaAssento + alturaEncosto / 2, -offsetZCad), vec3(tamanhoAssento, alturaEncosto, espessuraEncosto));
    var np = posicoes.length;
    return new Cadeira(np, posicao, posicoes, normal, EIXO_Y_IND, rotacao);
}

function addRectangle(pos, nor, tex, center, size) {
    const x = size[0] / 2;
    const z = size[1] / 2;

    const vertices = [
        vec4(center[0] - x, center[1], center[2] + z, 1.0),
        vec4(center[0] - x, center[1], center[2] - z, 1.0),
        vec4(center[0] + x, center[1], center[2] - z, 1.0),
        vec4(center[0] + x, center[1], center[2] + z, 1.0),
    ];

    const texCoords = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0),
    ];

    quadParede(pos, nor, tex, vertices, texCoords, 0, 1, 2, 3);
}

function addCuboidParede(pos, nor, tex, center, size, face) {
    const x = size[0] / 2;
    const y = size[1] / 2;
    const z = size[2] / 2;

    const vertices = [
        vec4(center[0] - x, center[1] - y, center[2] + z, 1.0), // 0
        vec4(center[0] - x, center[1] + y, center[2] + z, 1.0), // 1
        vec4(center[0] + x, center[1] + y, center[2] + z, 1.0), // 2
        vec4(center[0] + x, center[1] - y, center[2] + z, 1.0), // 3
        vec4(center[0] - x, center[1] - y, center[2] - z, 1.0), // 4
        vec4(center[0] - x, center[1] + y, center[2] - z, 1.0), // 5
        vec4(center[0] + x, center[1] + y, center[2] - z, 1.0), // 6
        vec4(center[0] + x, center[1] - y, center[2] - z, 1.0), // 7
    ];

    const texCoords = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0),
    ];

    if (face === 'front') {
        quadParede(pos, nor, tex, vertices, texCoords, 1, 0, 3, 2); // Front face
    } else if (face === 'right') {
        quadParede(pos, nor, tex, vertices, texCoords, 5, 4, 0, 1);
    } else if (face === 'back') {
        quadParede(pos, nor, tex, vertices, texCoords, 5, 4, 7, 6); // Back face
    } else if (face === 'left') {
        quadParede(pos, nor, tex, vertices, texCoords, 2, 3, 7, 6);
    }
}

function quadParede(pos, nor, tex, vert, texCoord, a, b, c, d) {
    var t1 = subtract(vert[b], vert[a]);
    var t2 = subtract(vert[c], vert[b]);
    var normal = cross(t1, t2);
    normal = normalize(vec3(normal));

    pos.push(vert[a]);
    nor.push(normal);
    tex.push(texCoord[0]);
    pos.push(vert[b]);
    nor.push(normal);
    tex.push(texCoord[1]);
    pos.push(vert[c]);
    nor.push(normal);
    tex.push(texCoord[2]);
    pos.push(vert[a]);
    nor.push(normal);
    tex.push(texCoord[0]);
    pos.push(vert[c]);
    nor.push(normal);
    tex.push(texCoord[2]);
    pos.push(vert[d]);
    nor.push(normal);
    tex.push(texCoord[3]);
}

function addCuboid(pos, nor, center, size) {
    const x = size[0] / 2;
    const y = size[1] / 2;
    const z = size[2] / 2;

    const vertices = [
        vec4(center[0] - x, center[1] - y, center[2] + z, 1.0),
        vec4(center[0] - x, center[1] + y, center[2] + z, 1.0),
        vec4(center[0] + x, center[1] + y, center[2] + z, 1.0),
        vec4(center[0] + x, center[1] - y, center[2] + z, 1.0),
        vec4(center[0] - x, center[1] - y, center[2] - z, 1.0),
        vec4(center[0] - x, center[1] + y, center[2] - z, 1.0),
        vec4(center[0] + x, center[1] + y, center[2] - z, 1.0),
        vec4(center[0] + x, center[1] - y, center[2] - z, 1.0),
    ];

    quad(pos, nor, vertices, 1, 0, 3, 2); // Front face
    quad(pos, nor, vertices, 2, 3, 7, 6); // Right face
    quad(pos, nor, vertices, 3, 0, 4, 7); // Bottom face
    quad(pos, nor, vertices, 6, 5, 1, 2); // Top face
    quad(pos, nor, vertices, 4, 5, 6, 7); // Back face
    quad(pos, nor, vertices, 5, 4, 0, 1); // Left face
};

function quad(pos, nor, vert, a, b, c, d) {
    var t1 = subtract(vert[b], vert[a]);
    var t2 = subtract(vert[c], vert[b]);
    var normal = cross(t1, t2);
    normal = normalize(vec3(normal));

    pos.push(vert[a]);
    nor.push(normal);
    pos.push(vert[b]);
    nor.push(normal);
    pos.push(vert[c]);
    nor.push(normal);
    pos.push(vert[a]);
    nor.push(normal);
    pos.push(vert[c]);
    nor.push(normal);
    pos.push(vert[d]);
    nor.push(normal);
}

function addCylinder(pos, nor, center, radius, height, segments) {
    const angleStep = 2 * Math.PI / segments;

    for (let i = 0; i < segments; i++) {
        const angle = i * angleStep;
        const nextAngle = (i + 1) * angleStep;

        const x0 = center[0] + radius * Math.cos(angle);
        const z0 = center[2] + radius * Math.sin(angle);
        const x1 = center[0] + radius * Math.cos(nextAngle);
        const z1 = center[2] + radius * Math.sin(nextAngle);

        const yTop = center[1] + height / 2;
        const yBottom = center[1] - height / 2;

        // Side face
        pos.push(vec4(x0, yBottom, z0, 1.0));
        pos.push(vec4(x0, yTop, z0, 1.0));
        pos.push(vec4(x1, yTop, z1, 1.0));
        pos.push(vec4(x0, yBottom, z0, 1.0));
        pos.push(vec4(x1, yTop, z1, 1.0));
        pos.push(vec4(x1, yBottom, z1, 1.0));

        // Normals for the side face
        const normal = normalize(vec3(Math.cos(angle), 0, Math.sin(angle)));
        nor.push(normal);
        nor.push(normal);
        nor.push(normal);
        nor.push(normal);
        nor.push(normal);
        nor.push(normal);

        // Top face
        pos.push(vec4(center[0], yTop, center[2], 1.0));
        pos.push(vec4(x1, yTop, z1, 1.0));
        pos.push(vec4(x0, yTop, z0, 1.0));

        // Normals for the top face
        nor.push(vec3(0, 1, 0));
        nor.push(vec3(0, 1, 0));
        nor.push(vec3(0, 1, 0));

        // Bottom face
        pos.push(vec4(center[0], yBottom, center[2], 1.0));
        pos.push(vec4(x0, yBottom, z0, 1.0));
        pos.push(vec4(x1, yBottom, z1, 1.0));

        // Normals for the bottom face
        nor.push(vec3(0, -1, 0));
        nor.push(vec3(0, -1, 0));
        nor.push(vec3(0, -1, 0));
    }
};

function addPrato(pos, nor, center, radiusBottom, radiusTop, height, segments) {
    const angleStep = 2 * Math.PI / segments;

    for (let i = 0; i < segments; i++) {
        const angle = i * angleStep;
        const nextAngle = (i + 1) * angleStep;

        const x0b = center[0] + radiusBottom * Math.cos(angle);
        const z0b = center[2] + radiusBottom * Math.sin(angle);
        const x1b = center[0] + radiusBottom * Math.cos(nextAngle);
        const z1b = center[2] + radiusBottom * Math.sin(nextAngle);

        const x0t = center[0] + radiusTop * Math.cos(angle);
        const z0t = center[2] + radiusTop * Math.sin(angle);
        const x1t = center[0] + radiusTop * Math.cos(nextAngle);
        const z1t = center[2] + radiusTop * Math.sin(nextAngle);

        const yTop = center[1] + height / 2;
        const yBottom = center[1] - height / 2;

        // Side face
        pos.push(vec4(x0b, yBottom, z0b, 1.0));
        pos.push(vec4(x0t, yTop, z0t, 1.0));
        pos.push(vec4(x1t, yTop, z1t, 1.0));
        pos.push(vec4(x0b, yBottom, z0b, 1.0));
        pos.push(vec4(x1t, yTop, z1t, 1.0));
        pos.push(vec4(x1b, yBottom, z1b, 1.0));

        // Normals for the side face
        const normal = normalize(vec3((x0t + x0b) / 2, 0, (z0t + z0b) / 2));
        nor.push(normal);
        nor.push(normal);
        nor.push(normal);
        nor.push(normal);
        nor.push(normal);
        nor.push(normal);

        // Bottom face
        pos.push(vec4(center[0], yBottom, center[2], 1.0));
        pos.push(vec4(x0b, yBottom, z0b, 1.0));
        pos.push(vec4(x1b, yBottom, z1b, 1.0));

        // Normals for the bottom face
        nor.push(vec3(0, -1, 0));
        nor.push(vec3(0, -1, 0));
        nor.push(vec3(0, -1, 0));
    }
}

function addAsa(pos, nor, center, width, height, lado) {
    const segments = 36;
    const angleStep = 2 * Math.PI / segments;
    const flip = lado === "esquerda" ? 1 : -1;

    for (let i = 0; i < segments; i++) {
        const angle = i * angleStep;
        const nextAngle = (i + 1) * angleStep;

        const x0 = center[0] + width * Math.cos(angle);
        const z0 = center[2] + flip * height * Math.sin(angle);
        const x1 = center[0] + width * Math.cos(nextAngle);
        const z1 = center[2] + flip * height * Math.sin(nextAngle);

        pos.push(vec4(center[0], center[1], center[2], 1.0));
        nor.push(vec3(0.0, 1.0, 0.0));
        pos.push(vec4(x0, center[1], z0, 1.0));
        nor.push(vec3(0.0, 1.0, 0.0));
        pos.push(vec4(x1, center[1], z1, 1.0));
        nor.push(vec3(0.0, 1.0, 0.0));
    }
}

function addSphere(pos, nor, center, radius, segments) {
    const angleStep = Math.PI / segments;
    const sliceStep = 2 * Math.PI / segments;

    for (let i = 0; i < segments; i++) {
        const theta = i * angleStep;
        const nextTheta = (i + 1) * angleStep;

        for (let j = 0; j < segments; j++) {
            const phi = j * sliceStep;
            const nextPhi = (j + 1) * sliceStep;

            const p0 = vec4(
                center[0] + radius * Math.sin(theta) * Math.cos(phi),
                center[1] + radius * Math.cos(theta),
                center[2] + radius * Math.sin(theta) * Math.sin(phi),
                1.0
            );
            const p1 = vec4(
                center[0] + radius * Math.sin(nextTheta) * Math.cos(phi),
                center[1] + radius * Math.cos(nextTheta),
                center[2] + radius * Math.sin(nextTheta) * Math.sin(phi),
                1.0
            );
            const p2 = vec4(
                center[0] + radius * Math.sin(nextTheta) * Math.cos(nextPhi),
                center[1] + radius * Math.cos(nextTheta),
                center[2] + radius * Math.sin(nextTheta) * Math.sin(nextPhi),
                1.0
            );
            const p3 = vec4(
                center[0] + radius * Math.sin(theta) * Math.cos(nextPhi),
                center[1] + radius * Math.cos(theta),
                center[2] + radius * Math.sin(theta) * Math.sin(nextPhi),
                1.0
            );

            quad(pos, nor, [p0, p1, p2, p3], 0, 1, 2, 3);
        }
    }
}

class Objects {
    constructor(np, centro, posicoes, normais, axis, theta) {
        this.bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normais), gl.STATIC_DRAW);

        this.bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(posicoes), gl.STATIC_DRAW);

        this.np = np;
        this.centro = centro || vec3(0, 0, 0);
        this.pos = posicoes || [];
        this.nor = normais || [];

        this.axis = axis || EIXO_Z_IND;
        this.theta = theta || vec3(0, 0, 0);
        this.rodando = false;
    }
    
    atualizar() {
        //console.log('atualiza objetos');
    }
    
    desenhar() {
        let model = mat4();
        model = mult(model, translate(this.centro[0], this.centro[1], this.centro[2]));
        model = mult(model, rotate(this.theta[EIXO_X_IND], EIXO_X));
        model = mult(model, rotate(this.theta[EIXO_Y_IND], EIXO_Y));
        model = mult(model, rotate(this.theta[EIXO_Z_IND], EIXO_Z));

        let modelView = mult(gCtx.view, model);
        let modelViewInv = inverse(modelView);
        let modelViewInvTrans = transpose(modelViewInv);

        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormais);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        var aTexCoord = gl.getAttribLocation(gShader.program, "aTexCoord");
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);
    }
}

class Mesa extends Objects {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

class Toalha extends Objects {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        // desenha toalha
        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, true);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

// refrigerante
class Cilindro extends Objects {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        // desenha  cilindro
        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, true);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

//prato
class Prato extends Objects {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        // desenha prato
        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, true);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

class ObjetoTextura {
    constructor(np, centro, posicoes, normais, texturas, axis, theta) {
        this.bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normais), gl.STATIC_DRAW);

        this.bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(posicoes), gl.STATIC_DRAW);
        
        this.bufTextura = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTextura);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texturas), gl.STATIC_DRAW);

        this.np = np;
        this.centro = centro || vec3(0, 0, 0);
        this.pos = posicoes || [];
        this.nor = normais || [];
        this.tex = texturas || [];

        this.axis = axis || EIXO_Z_IND;
        this.theta = theta || vec3(0, 0, 0);
        this.rodando = false;
    }
    
    atualizar() {
        //console.log('atualiza objetos');
    }
    
    desenhar() {
        let model = mat4();
        model = mult(model, translate(this.centro[0], this.centro[1], this.centro[2]));
        model = mult(model, rotate(this.theta[EIXO_X_IND], EIXO_X));
        model = mult(model, rotate(this.theta[EIXO_Y_IND], EIXO_Y));
        model = mult(model, rotate(this.theta[EIXO_Z_IND], EIXO_Z));

        let modelView = mult(gCtx.view, model);
        let modelViewInv = inverse(modelView);
        let modelViewInvTrans = transpose(modelViewInv);

        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormais);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);
        
        var aTexCoord = gl.getAttribLocation(gShader.program, "aTexCoord");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTextura);
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);
    }
}

class Parede extends ObjetoTextura {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, true);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

class Chao extends ObjetoTextura {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        // desenha o chão
        gl.uniform1i(gShader.uIsChao, true);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

class Mosca {
    constructor(np, centro, posicoes, normais, axis, theta) {
        this.bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normais), gl.STATIC_DRAW);

        this.bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(posicoes), gl.STATIC_DRAW);

        this.np = np;
        this.centro = centro || vec3(0, 0, 0);
        this.pos = posicoes || [];
        this.nor = normais || [];

        this.axis = axis || EIXO_Z_IND;
        this.theta = theta || vec3(0, 0, 0);
        this.rodando = false;

        this.tempo = 0;
    }
    
    atualizar(dt) {
        this.tempo += dt;
        let novaPosicao = add(camera.pos, scale(0.5, camera.dir));
        this.centro = vec3(novaPosicao[0], novaPosicao[1] + Math.sin(this.tempo * 2 * Math.PI) * 0.03, novaPosicao[2]);

        // Alinha a mosca com a câmera
        let dir = normalize(camera.dir);
        let yaw = Math.atan2(dir[0], -dir[2]) * 180 / Math.PI;
        this.theta[EIXO_Y_IND] = yaw;
        this.theta[EIXO_X_IND] = 0; 
    }
    
    desenhar() {
        let model = mat4();
        model = mult(model, translate(this.centro[0], this.centro[1], this.centro[2]));
        model = mult(model, rotate(this.theta[EIXO_X_IND], EIXO_X));
        model = mult(model, rotate(this.theta[EIXO_Y_IND], EIXO_Y));
        model = mult(model, rotate(this.theta[EIXO_Z_IND], EIXO_Z));

        let modelView = mult(gCtx.view, model);
        let modelViewInv = inverse(modelView);
        let modelViewInvTrans = transpose(modelViewInv);

        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormais);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        var aTexCoord = gl.getAttribLocation(gShader.program, "aTexCoord");
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);
        
        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, true);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

class Asa extends Objects {
    constructor(np, centro, posicoes, normais, lado, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
        this.lado = lado;
        this.angulo = 0;
        this.velocidadeBatida = 4000;

        this.tempo = 0;
    }

    atualizar(dt) {
        this.tempo += dt;
        let novaPosicao = add(camera.pos, scale(0.5, camera.dir));
        this.centro = vec3(novaPosicao[0], novaPosicao[1] + Math.sin(this.tempo * 2 * Math.PI) * 0.03, novaPosicao[2]);
        
        // Alinha as asas com a câmera
        let dir = normalize(camera.dir);
        let yaw = Math.atan2(dir[0], -dir[2]) * 180 / Math.PI;
        this.theta[EIXO_Y_IND] = yaw;
        this.theta[EIXO_X_IND] = 0; 

        // Movimento das asas
        this.angulo += this.velocidadeBatida * dt;
        if (this.angulo > 360) {
            this.angulo -= 360;
        }

        // Rotaciona as asas
        let amplitude = 30;
        let deslocamento = Math.sin(radians(this.angulo)) * amplitude;

        // Asa direita ou esquerda
        if (this.lado === "direita") {
            this.theta[EIXO_Z_IND] = deslocamento; 
        } else {
            this.theta[EIXO_Z_IND] = -deslocamento; 
        }
    }

    desenhar() {
        let model = mat4();
        model = mult(model, translate(this.centro[0], this.centro[1], this.centro[2]));
        model = mult(model, rotate(this.theta[EIXO_X_IND], EIXO_X));
        model = mult(model, rotate(this.theta[EIXO_Y_IND], EIXO_Y));
        model = mult(model, rotate(this.theta[EIXO_Z_IND], EIXO_Z));

        let modelView = mult(gCtx.view, model);
        let modelViewInv = inverse(modelView);
        let modelViewInvTrans = transpose(modelViewInv);

        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

        var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormais);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertices);
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);
        
        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, true);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

class Cadeira extends Objects {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, true);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

class Teto extends ObjetoTextura {
    constructor(np, centro, posicoes, normais, texturas, axis, theta) {
        super(np, centro, posicoes, normais, texturas, axis, theta);
    }

    desenhar() {
        super.desenhar();

        gl.uniform1i(gShader.uIsChao, false);
        gl.uniform1i(gShader.uIsParede, false);
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsPrato, false);
        gl.uniform1i(gShader.uIsMosca, false);
        gl.uniform1i(gShader.uIsAsa, false);
        gl.uniform1i(gShader.uIsCadeira, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

var gVertexShaderSrc = `#version 300 es
in  vec4 aPosition;
in  vec3 aNormal;
in  vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uInverseTranspose;
uniform vec4 uLuzPos;
uniform bool uIsParede;

out vec3 vNormal;
out vec3 vLight;
out vec3 vView;
out vec2 vTexCoord; 

void main() {
    mat4 modelView = uView * uModel;
    if (uIsParede) {
        gl_Position = uPerspective * modelView * vec4(aPosition.xyz, 1.0);
    } else {
        gl_Position = uPerspective * modelView * aPosition;
    }
    vNormal = mat3(uInverseTranspose) * aNormal;
    vec4 pos = modelView * aPosition;
    vLight = (uView * uLuzPos - pos).xyz;
    vView = -(pos.xyz);
    vTexCoord = aTexCoord; 
}
`;

var gFragmentShaderSrc = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vLight;
in vec3 vView;
in vec2 vTexCoord;

out vec4 corSaida;

uniform sampler2D uTexture;
uniform sampler2D uTextureChao;
uniform vec4 uCorAmbienteMesa;
uniform vec4 uCorDifusaoMesa;
uniform vec4 uCorEspecularMesa;

uniform vec4 uCorAmbienteCilindro;
uniform vec4 uCorDifusaoCilindro;
uniform vec4 uCorEspecularCilindro;

uniform vec4 uCorAmbienteToalha;
uniform vec4 uCorDifusaoToalha;
uniform vec4 uCorEspecularToalha;

uniform vec4 uCorAmbientePrato;
uniform vec4 uCorDifusaoPrato;
uniform vec4 uCorEspecularPrato;

uniform vec4 uCorAmbienteChao;
uniform vec4 uCorDifusaoChao;
uniform vec4 uCorEspecularChao;

uniform vec4 uCorAmbienteMosca;
uniform vec4 uCorDifusaoMosca;
uniform vec4 uCorEspecularMosca;

uniform vec4 uCorAmbienteAsa;
uniform vec4 uCorDifusaoAsa;
uniform vec4 uCorEspecularAsa;

uniform vec4 uCorAmbienteCadeira;
uniform vec4 uCorDifusaoCadeira;
uniform vec4 uCorEspecularCadeira;

uniform vec4 uCorAmbienteTeto;
uniform vec4 uCorDifusaoTeto;
uniform vec4 uCorEspecularTeto;

uniform float uAlfaEspMesa;
uniform float uAlfaEspCilindro;
uniform float uAlfaEspToalha;
uniform float uAlfaEspPrato;
uniform float uAlfaEspChao;
uniform float uAlfaEspMosca;
uniform float uAlfaEspAsa;
uniform float uAlfaEspCadeira;
uniform float uAlfaEspTeto;

uniform bool uIsCilindro;
uniform bool uIsToalha;
uniform bool uIsPrato;
uniform bool uIsChao;
uniform bool uIsParede;
uniform bool uIsMosca;
uniform bool uIsAsa;
uniform bool uIsCadeira;
uniform bool uIsTeto;

void main() {
    vec4 uCorAmbiente = uIsCilindro ? uCorAmbienteCilindro : (uIsToalha ? uCorAmbienteToalha : (uIsPrato ? uCorAmbientePrato : (uIsChao ? uCorAmbienteChao : (uIsMosca ? uCorAmbienteMosca : (uIsAsa ? uCorAmbienteAsa : (uIsCadeira ? uCorAmbienteCadeira : uCorAmbienteMesa))))));
    vec4 uCorDifusao = uIsCilindro ? uCorDifusaoCilindro : (uIsToalha ? uCorDifusaoToalha : (uIsPrato ? uCorDifusaoPrato : (uIsChao ? uCorDifusaoChao : (uIsMosca ? uCorDifusaoMosca : (uIsAsa ? uCorDifusaoAsa : (uIsCadeira ? uCorDifusaoCadeira : uCorDifusaoMesa))))));
    vec4 uCorEspecular = uIsCilindro ? uCorEspecularCilindro : (uIsToalha ? uCorEspecularToalha : (uIsPrato ? uCorEspecularPrato : (uIsChao ? uCorEspecularChao : (uIsMosca ? uCorEspecularMosca : (uIsAsa ? uCorEspecularAsa : (uIsCadeira ? uCorEspecularCadeira : uCorEspecularMesa))))));
    float uAlfaEsp = uIsCilindro ? uAlfaEspCilindro : (uIsToalha ? uAlfaEspToalha : (uIsPrato ? uAlfaEspPrato : (uIsChao ? uAlfaEspChao : (uIsMosca ? uAlfaEspMosca : (uIsAsa ? uAlfaEspAsa : (uIsCadeira ? uAlfaEspCadeira : uAlfaEspMesa))))));

    vec3 normalV = normalize(vNormal);
    vec3 lightV = normalize(vLight);
    vec3 viewV = normalize(vView);
    vec3 halfV = normalize(lightV + viewV);

    float kd = max(0.0, dot(normalV, lightV));
    float ks = pow(max(0.0, dot(normalV, halfV)), uAlfaEsp);

    vec4 difusao = kd * uCorDifusao;
    vec4 especular = ks * uCorEspecular;

    if (uIsParede) {
        corSaida = texture(uTexture, vTexCoord);
    } else if (uIsChao) {
        corSaida = texture(uTextureChao, vTexCoord);
    } else {
        corSaida = difusao + especular + uCorAmbiente;
    }
    corSaida.a = 1.0;
}
`;
