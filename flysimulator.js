"use strict";

const eye = vec3(1, 1, 1); // Aproximar a câmera
const at = vec3(0, 0, 0);  // Centralizar o ponto de vista
const up = vec3(0, 1, 0);

const LUZ = {
    pos: vec4(0.0, 3.0, 0.0, 1.0),
    amb: vec4(0.4, 0.4, 0.4, 1.0), // Aumentar a claridade da luz ambiente
    dif: vec4(1.0, 1.0, 1.0, 1.0),
    esp: vec4(1.0, 1.0, 1.0, 1.0),
};

const MAT_MESA = {
    amb: vec4(0.6, 0.4, 0.3, 1.0), // Aumentar a claridade da cor ambiente
    dif: vec4(0.6, 0.3, 0.2, 1.0),
    esp: vec4(0.2, 0.1, 0.05, 1.0),
    alfa: 50.0,
};

const MAT_TRONCO = {
    amb: vec4(0.8, 0.8, 0.8, 1.0), // Cinza claro
    dif: vec4(1.0, 1.0, 1.0, 1.0), // Branco
    esp: vec4(1.0, 1.0, 1.0, 1.0), // Branco brilhante
    alfa: 50.0,
};

// Definir cores para a toalha vermelha
const MAT_TOALHA = {
    amb: vec4(0.6, 0.1, 0.1, 1.0), // Vermelho escuro
    dif: vec4(0.8, 0.2, 0.2, 1.0), // Vermelho
    esp: vec4(0.9, 0.3, 0.3, 1.0), // Vermelho claro brilhante
    alfa: 50.0,
};

// Definir cores para o cilindro
const MAT_CILINDRO = {
    amb: vec4(0.1, 0.1, 0.6, 1.0), // Azul escuro
    dif: vec4(0.2, 0.2, 0.8, 1.0), // Azul claro
    esp: vec4(0.3, 0.3, 0.9, 1.0), // Azul claro brilhante
    alfa: 50.0,
};

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

// var gMesa = new Mesa();
var objetos = [];

var gShader = {
    aTheta: null,
};

var gCtx = {
    view: mat4(),
    perspective: mat4(),
    pause: true,
};

var gPositionOffset = vec3(0, 0, 0); // Posição global dos objetos

window.onload = main;

function main() {
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("Vixe! Não achei WebGL 2.0 aqui :-(");

    crieInterface();
    // gMesa.init();
    

    gl.viewport(0, 0, gCanvas.width, gCanvas.height);
    gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
    gl.enable(gl.DEPTH_TEST);

    document.addEventListener('keydown', handleKeyDown); // Adicionar evento de teclado

    crieShaders();
    desenharObjetos();
    render();
}

function handleKeyDown(event) {
    switch (event.key) {
        case 'a':
            gPositionOffset = add(gPositionOffset, vec3(-0.1, 0, 0)); // Mover para a esquerda
            break;
    }
}

function crieInterface() {
    document.getElementById("xButton").onclick = function () {
        objetos.forEach(obj => obj.axis = EIXO_X_IND);
        // gMesa.axis = EIXO_X_IND;
    };
    document.getElementById("yButton").onclick = function () {
        objetos.forEach(obj => obj.axis = EIXO_Y_IND);
        // gMesa.axis = EIXO_Y_IND;
    };
    document.getElementById("zButton").onclick = function () {
        objetos.forEach(obj => obj.axis = EIXO_Z_IND);
        // gMesa.axis = EIXO_Z_IND;
    };
    document.getElementById("pButton").onclick = function () {
        gCtx.pause = !gCtx.pause;
    };
    document.getElementById("alfaSlider").onchange = function (e) {
        gCtx.alfaEspecular = e.target.value;
        gl.uniform1f(gShader.uAlfaEsp, gCtx.alfaEspecular);
    };
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

    gCtx.view = lookAt(eye, at, up);
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    gShader.uLuzPos = gl.getUniformLocation(gShader.program, "uLuzPos");
    gl.uniform4fv(gShader.uLuzPos, LUZ.pos);

    // Uniforms para a mesa
    gShader.uCorAmbMesa = gl.getUniformLocation(gShader.program, "uCorAmbienteMesa");
    gShader.uCorDifMesa = gl.getUniformLocation(gShader.program, "uCorDifusaoMesa");
    gShader.uCorEspMesa = gl.getUniformLocation(gShader.program, "uCorEspecularMesa");
    gShader.uAlfaEspMesa = gl.getUniformLocation(gShader.program, "uAlfaEspMesa");

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

    // Uniforms para o prato (tronco)
    gShader.uCorAmbTronco = gl.getUniformLocation(gShader.program, "uCorAmbienteTronco");
    gShader.uCorDifTronco = gl.getUniformLocation(gShader.program, "uCorDifusaoTronco");
    gShader.uCorEspTronco = gl.getUniformLocation(gShader.program, "uCorEspecularTronco");
    gShader.uAlfaEspTronco = gl.getUniformLocation(gShader.program, "uAlfaEspTronco");
    gShader.uIsTronco = gl.getUniformLocation(gShader.program, "uIsTronco");

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

    
    // cores do tronco
    gl.uniform4fv(gShader.uCorAmbTronco, mult(LUZ.amb, MAT_TRONCO.amb));
    gl.uniform4fv(gShader.uCorDifTronco, mult(LUZ.dif, MAT_TRONCO.dif));
    gl.uniform4fv(gShader.uCorEspTronco, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspTronco, MAT_TRONCO.alfa);
}

function atualizarObjetos(dt) {
    objetos.forEach(obj => obj.atualizar(dt));
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!gCtx.pause) {
        let dt = 2.0;
        // atualizaCamera(dt);
        atualizarObjetos(dt);
    }

    objetos.forEach(obj => obj.desenhar());

    window.requestAnimationFrame(render);
}

function desenharObjetos(){
    var posicoes = [];
    var normal = [];
    var np = 0;
    var centro = vec3(0.1,0.1,0.1); // posicao global dos objetos
    const tamanhoTampo = 1.0;
    const alturaTampo = 0.1;
    const alturaPernas = 0.9;
    const espessuraPernas = 0.1;
    const deslocamentoY = -1.0;

    // Cria o tampo da mesa
    addCuboid(posicoes, normal, vec3(0, alturaPernas + deslocamentoY, 0), vec3(tamanhoTampo, alturaTampo, tamanhoTampo));

    // Cria as pernas da mesa
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
    addRectangle(posicoes, normal, vec3(0.35, alturaPernas + alturaTampo/2 + deslocamentoY + 0.01, 0), vec2(0.23, 0.33));
    addRectangle(posicoes, normal, vec3(-0.35, alturaPernas + alturaTampo/2 + deslocamentoY + 0.01, 0), vec2(0.23, 0.33));
    addRectangle(posicoes, normal, vec3(0, alturaPernas + alturaTampo/2 + deslocamentoY + 0.01, 0.35), vec2(0.33, 0.23));
    addRectangle(posicoes, normal, vec3(0, alturaPernas + alturaTampo/2 + deslocamentoY + 0.01, -0.35), vec2(0.33, 0.23));
    np = posicoes.length;
    objetos.push(new Toalha(np, centro, posicoes, normal));

    // Adiciona uma lata de refrigerante em cima da mesa
    posicoes = [];
    normal = [];
    addCylinder(posicoes, normal, vec3(0.14, alturaPernas + alturaTampo/2 + deslocamentoY + 0.01, -0.06), 0.05, 0.2, 36);
    np = posicoes.length;
    objetos.push(new Cilindro(np, centro, posicoes, normal));

    // Adiciona um prato com formato de tronco
    posicoes = [];
    normal = [];
    addTronco(posicoes, normal, vec3(0.35, alturaPernas + alturaTampo/2 + deslocamentoY + 0.04, 0), 0.07, 0.1, 0.04, 36);
    addTronco(posicoes, normal, vec3(-0.35, alturaPernas + alturaTampo/2 + deslocamentoY + 0.04, 0), 0.07, 0.1, 0.04, 36);
    addTronco(posicoes, normal, vec3(0, alturaPernas + alturaTampo/2 + deslocamentoY + 0.04, 0.35), 0.07, 0.1, 0.04, 36);
    addTronco(posicoes, normal, vec3(0, alturaPernas + alturaTampo/2 + deslocamentoY + 0.04, -0.35), 0.07, 0.1, 0.04, 36);
    np = posicoes.length;
    objetos.push(new Tronco(np, centro, posicoes, normal));
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

function addRectangle(pos, nor, center, size) {
    const x = size[0] / 2;
    const z = size[1] / 2;

    const vertices = [
        vec4(center[0] - x, center[1], center[2] + z, 1.0),
        vec4(center[0] - x, center[1], center[2] - z, 1.0),
        vec4(center[0] + x, center[1], center[2] - z, 1.0),
        vec4(center[0] + x, center[1], center[2] + z, 1.0),
    ];

    quad(pos, nor, vertices, 0, 1, 2, 3); // Top face
};

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

function addTronco(pos, nor, center, radiusBottom, radiusTop, height, segments) {
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

        // Top face - Removido

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
        this.theta[this.axis] += 2.0;
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
    }
}

class Mesa extends Objects {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        // desenha mesa
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsTronco, false);
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
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, true);
        gl.uniform1i(gShader.uIsTronco, false);
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

        // desenha cilindro
        gl.uniform1i(gShader.uIsCilindro, true);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsTronco, false);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

//prato
class Tronco extends Objects {
    constructor(np, centro, posicoes, normais, axis, theta) {
        super(np, centro, posicoes, normais, axis, theta);
    }

    desenhar() {
        super.desenhar();

        // desenha prato
        gl.uniform1i(gShader.uIsCilindro, false);
        gl.uniform1i(gShader.uIsToalha, false);
        gl.uniform1i(gShader.uIsTronco, true);
        gl.drawArrays(gl.TRIANGLES, 0, this.np);
    }
}

var gVertexShaderSrc = `#version 300 es
in  vec4 aPosition;
in  vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uInverseTranspose;
uniform vec4 uLuzPos;
out vec3 vNormal;
out vec3 vLight;
out vec3 vView;
void main() {
    mat4 modelView = uView * uModel;
    gl_Position = uPerspective * modelView * aPosition;
    vNormal = mat3(uInverseTranspose) * aNormal;
    vec4 pos = modelView * aPosition;
    vLight = (uView * uLuzPos - pos).xyz;
    vView = -(pos.xyz);
}
`;

var gFragmentShaderSrc = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vLight;
in vec3 vView;
out vec4 corSaida;
uniform vec4 uCorAmbienteMesa;
uniform vec4 uCorDifusaoMesa;
uniform vec4 uCorEspecularMesa;
uniform vec4 uCorAmbienteCilindro;
uniform vec4 uCorDifusaoCilindro;
uniform vec4 uCorEspecularCilindro;
uniform vec4 uCorAmbienteToalha;
uniform vec4 uCorDifusaoToalha;
uniform vec4 uCorEspecularToalha;
uniform vec4 uCorAmbienteTronco;
uniform vec4 uCorDifusaoTronco;
uniform vec4 uCorEspecularTronco;
uniform float uAlfaEspMesa;
uniform float uAlfaEspCilindro;
uniform float uAlfaEspToalha;
uniform float uAlfaEspTronco;
uniform bool uIsCilindro;
uniform bool uIsToalha;
uniform bool uIsTronco;
void main() {
    vec4 uCorAmbiente = uIsCilindro ? uCorAmbienteCilindro : (uIsToalha ? uCorAmbienteToalha : (uIsTronco ? uCorAmbienteTronco : uCorAmbienteMesa));
    vec4 uCorDifusao = uIsCilindro ? uCorDifusaoCilindro : (uIsToalha ? uCorDifusaoToalha : (uIsTronco ? uCorDifusaoTronco : uCorDifusaoMesa));
    vec4 uCorEspecular = uIsCilindro ? uCorEspecularCilindro : (uIsToalha ? uCorEspecularToalha : (uIsTronco ? uCorEspecularTronco : uCorEspecularMesa));
    float uAlfaEsp = uIsCilindro ? uAlfaEspCilindro : (uIsToalha ? uAlfaEspToalha : (uIsTronco ? uAlfaEspTronco : uAlfaEspMesa));

    vec3 normalV = normalize(vNormal);
    vec3 lightV = normalize(vLight);
    vec3 viewV = normalize(vView);
    vec3 halfV = normalize(lightV + viewV);
    float kd = max(0.0, dot(normalV, lightV));
    vec4 difusao = kd * uCorDifusao;
    float ks = pow(max(0.0, dot(normalV, halfV)), uAlfaEsp);
    vec4 especular = ks * uCorEspecular;
    corSaida = difusao + especular + uCorAmbiente;
    corSaida.a = 1.0;
}
`;