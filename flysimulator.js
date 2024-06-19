"use strict";

const LUZ = {
    pos: vec4(0.0, 3.0, 0.0, 1.0),
    amb: vec4(0.3, 0.3, 0.3, 1.0), // Luz ambiente amb: vec4(0.2, 0.2, 0.2, 1.0)
    dif: vec4(1.0, 1.0, 1.0, 1.0), // Luz difusa
    esp: vec4(1.0, 1.0, 1.0, 1.0), // Luz especular
};

const MAT = {
    amb: vec4(0.6, 0.4, 0.3, 1.0), // Cor marrom ambiente amb: vec4(0.4, 0.2, 0.1, 1.0)
    dif: vec4(0.6, 0.3, 0.2, 1.0), // Cor marrom difusa
    esp: vec4(0.5, 0.1, 0.05, 1.0), // Cor marrom especular
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

var gMesa = new Mesa();

var gShader = {
    aTheta: null,
};

var gCtx = {
    view: mat4(),
    perspective: mat4(),
};

var camera = {
    pos: vec3(1,1,1),
    at: vec3(0, 0, 0), 
    up: vec3(0, 1, 0),
    theta: vec3(-30, 0, 0), 
    vTrans: 0.1,
    dir: vec3(0, 0, -1) 
};

window.onload = main;

function main() {
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("Vixe! Não achei WebGL 2.0 aqui :-(");

    crieInterface();
    gMesa.init();

    gl.viewport(0, 0, gCanvas.width, gCanvas.height);
    gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
    gl.enable(gl.DEPTH_TEST);

    crieShaders();
    window.addEventListener('keydown', controlaCamera);
    render();
}

function crieInterface() {
    document.getElementById("xButton").onclick = function () {
        gMesa.axis = EIXO_X_IND;
    };
    document.getElementById("yButton").onclick = function () {
        gMesa.axis = EIXO_Y_IND;
    };
    document.getElementById("zButton").onclick = function () {
        gMesa.axis = EIXO_Z_IND;
    };
    document.getElementById("pButton").onclick = function () {
        gMesa.rodando = !gMesa.rodando;
    };
    document.getElementById("alfaSlider").onchange = function (e) {
        gCtx.alfaEspecular = e.target.value;
        gl.uniform1f(gShader.uAlfaEsp, gCtx.alfaEspecular);
    };
}

function crieShaders() {
    gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
    gl.useProgram(gShader.program);

    var bufNormais = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gMesa.nor), gl.STATIC_DRAW);

    var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    var bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gMesa.pos), gl.STATIC_DRAW);

    var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

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

    // Definir cores para a mesa
    gl.uniform4fv(gShader.uCorAmbMesa, mult(LUZ.amb, MAT.amb));
    gl.uniform4fv(gShader.uCorDifMesa, mult(LUZ.dif, MAT.dif));
    gl.uniform4fv(gShader.uCorEspMesa, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspMesa, MAT.alfa);

    // Definir cores para o cilindro
    const MAT_CILINDRO = {
        amb: vec4(0.1, 0.1, 0.6, 1.0), // Azul escuro
        dif: vec4(0.2, 0.2, 0.8, 1.0), // Azul claro
        esp: vec4(0.3, 0.3, 0.9, 1.0), // Azul claro brilhante
        alfa: 50.0,
    };

    gl.uniform4fv(gShader.uCorAmbCilindro, mult(LUZ.amb, MAT_CILINDRO.amb));
    gl.uniform4fv(gShader.uCorDifCilindro, mult(LUZ.dif, MAT_CILINDRO.dif));
    gl.uniform4fv(gShader.uCorEspCilindro, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEspCilindro, MAT_CILINDRO.alfa);
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (gMesa.rodando) gMesa.theta[gMesa.axis] += 2.0;

    let model = mat4();
    model = mult(model, rotate(gMesa.theta[EIXO_X_IND], EIXO_X));
    model = mult(model, rotate(gMesa.theta[EIXO_Y_IND], EIXO_Y));
    model = mult(model, rotate(gMesa.theta[EIXO_Z_IND], EIXO_Z));

    let modelView = mult(gCtx.view, model);
    let modelViewInv = inverse(modelView);
    let modelViewInvTrans = transpose(modelViewInv);

    gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
    gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

    // Desenhar a mesa
    gl.uniform1i(gShader.uIsCilindro, false);
    gl.drawArrays(gl.TRIANGLES, 0, gMesa.np - gMesa.cylinderVertices);

    // Desenhar o cilindro
    gl.uniform1i(gShader.uIsCilindro, true);
    gl.drawArrays(gl.TRIANGLES, gMesa.np - gMesa.cylinderVertices, gMesa.cylinderVertices);

    window.requestAnimationFrame(render);
}


function Mesa() {
    this.np = 0;
    this.pos = [];
    this.nor = [];
    this.cylinderVertices = 0;

    this.axis = EIXO_Z_IND;
    this.theta = vec3(0, 0, 0);
    this.rodando = false;

    this.init = function () {
        const tamanhoTampo = 1.0;
        const alturaTampo = 0.1;
        const alturaPernas = 0.9;
        const espessuraPernas = 0.1;
        const deslocamentoY = -1.0;

        // Cria o tampo
        this.addCuboid(this.pos, this.nor, vec3(0, alturaPernas + deslocamentoY, 0), vec3(tamanhoTampo, alturaTampo, tamanhoTampo));

        // Cria as pernas
        const offsetX = (tamanhoTampo - espessuraPernas) / 2;
        const offsetZ = (tamanhoTampo - espessuraPernas) / 2;
        this.addCuboid(this.pos, this.nor, vec3(-offsetX, alturaPernas / 2 + deslocamentoY, -offsetZ), vec3(espessuraPernas, alturaPernas, espessuraPernas));
        this.addCuboid(this.pos, this.nor, vec3(offsetX, alturaPernas / 2 + deslocamentoY, -offsetZ), vec3(espessuraPernas, alturaPernas, espessuraPernas));
        this.addCuboid(this.pos, this.nor, vec3(-offsetX, alturaPernas / 2 + deslocamentoY, offsetZ), vec3(espessuraPernas, alturaPernas, espessuraPernas));
        this.addCuboid(this.pos, this.nor, vec3(offsetX, alturaPernas / 2 + deslocamentoY, offsetZ), vec3(espessuraPernas, alturaPernas, espessuraPernas));

        // Adiciona uma lata de refrigerante em cima da mesa
        const initialLength = this.pos.length;
        this.addCylinder(this.pos, this.nor, vec3(0, alturaPernas + alturaTampo + deslocamentoY , 0), 0.1, 0.25, 36);
        this.cylinderVertices = this.pos.length - initialLength;

        this.np = this.pos.length;
    };

    this.addCuboid = function (pos, nor, center, size) {
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

    this.addCylinder = function (pos, nor, center, radius, height, segments) {
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
}



function quad(pos, nor, vert, a, b, c, d) {
    var t1 = subtract(vert[b], vert[a]);
    var t2 = subtract(vert[c], vert[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

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
    atualizaDirecaoCamera();

    let deslocamento = scale(camera.vTrans * dt, camera.dir);
    
    camera.pos = add(camera.pos, deslocamento);
}

function controlaCamera(event) {
    switch (event.key.toLowerCase()) {
        case 'j': // Diminui velocidade de translação
            camera.vTrans -= 0.5;
            console.log("Velocidade de translação diminuída: ", camera.vTrans);
            break;
        case 'l': // Aumenta velocidade de translação
            camera.vTrans += 0.5;
            console.log("Velocidade de translação aumentada: ", camera.vTrans);
            break;
        case 'k': // Para a câmera
            camera.vTrans = 0;
            console.log("Câmera parada");
            break;
        case 'w': // Incrementa rotação em x 
            camera.theta[0] += 1;
            console.log("Rotação em X incrementada: ", camera.theta[0]);
            break;
        case 'x': // Decrementa rotação em x
            camera.theta[0] -= 1;
            console.log("Rotação em X decrementada: ", camera.theta[0]);
            break;
        case 'a': // Incrementa rotação em y
            camera.theta[1] += 1;
            console.log("Rotação em Y incrementada: ", camera.theta[1]);
            break;
        case 'd': // Decrementa rotação em y
            camera.theta[1] -= 1;
            console.log("Rotação em Y decrementada: ", camera.theta[1]);
            break;
        case 'z': // Incrementa rotação em z 
            camera.theta[2] += 1;
            console.log("Rotação em Z incrementada (sentido anti-horário): ", camera.theta[2]);
            break;
        case 'c': // Decrementa rotação em z 
            camera.theta[2] -= 1;
            console.log("Rotação em Z decrementada (sentido horário): ", camera.theta[2]);
            break;
    }
    atualizaDirecaoCamera(); 
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

// var gFragmentShaderSrc = `#version 300 es
// precision highp float;
// in vec3 vNormal;
// in vec3 vLight;
// in vec3 vView;
// out vec4 corSaida;
// uniform vec4 uCorAmbiente;
// uniform vec4 uCorDifusao;
// uniform vec4 uCorEspecular;
// uniform float uAlfaEsp;
// void main() {
//     vec3 normalV = normalize(vNormal);
//     vec3 lightV = normalize(vLight);
//     vec3 viewV = normalize(vView);
//     vec3 halfV = normalize(lightV + viewV);
//     float kd = max(0.0, dot(normalV, lightV));
//     vec4 difusao = kd * uCorDifusao;
//     float ks = pow(max(0.0, dot(normalV, halfV)), uAlfaEsp);
//     vec4 especular = vec4(1, 0, 0, 1);
//     if (kd > 0.0) {
//         especular = ks * uCorEspecular;
//     }
//     corSaida = difusao + especular + uCorAmbiente;
//     corSaida.a = 1.0;
// }
// `;

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
uniform float uAlfaEspMesa;
uniform float uAlfaEspCilindro;
uniform bool uIsCilindro;
void main() {
    vec4 uCorAmbiente = uIsCilindro ? uCorAmbienteCilindro : uCorAmbienteMesa;
    vec4 uCorDifusao = uIsCilindro ? uCorDifusaoCilindro : uCorDifusaoMesa;
    vec4 uCorEspecular = uIsCilindro ? uCorEspecularCilindro : uCorEspecularMesa;
    float uAlfaEsp = uIsCilindro ? uAlfaEspCilindro : uAlfaEspMesa;

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


