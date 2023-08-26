var width;
var height;

var canvas;
var ctx;
var canvasZArray;

var goofy = false;
var move = true;
var wireframe = false;


function nameToRgba(name) {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    context.fillStyle = name;
    context.fillRect(0,0,1,1);
    let data = context.getImageData(0,0,1,1).data;
    delete canvas;
    return data;
}

function rgb(values) {
    return 'rgb(' + values.join(', ') + ')';
}

function clearCanvas()
{
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < canvasZArray.length; i++)
        canvasZArray[i] = Infinity;
}

function initCanvas(x, y)
{
    width = x;
    height = y;

    canvas = document.getElementById("canvas");
    canvas.width = width;
    canvas.height = height;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx = canvas.getContext("2d");

    // remove alias
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;

    canvasZArray = new Array(width * height);

    clearCanvas();
}

function drawLine(x1, y1, x2, y2, col)
{
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function fillTriangle(x1, y1, x2, y2, x3, y3, col)
{
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);

    ctx.fillStyle = col;
    ctx.fill();
    ctx.closePath();
}

function getZ(x0,y0,z0,x1,y1,z1,x2,y2,z2,x,y)
{
    // average the distances and normalize them
    // then multiply by respective z and add together

    //console.log("A");

    //console.log(x0,y0,z0,x1,y1,z1,x2,y2,z2,x,y)

    let d1 = Math.sqrt((x - x0) ** 2 + (y - y0) ** 2);
    let d2 = Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
    let d3 = Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);

    //console.log(d1, d2, d3);

    let dTotal = d1 + d2 + d3;

    //console.log(dTotal);

    let d1Norm = d1 / dTotal;
    let d2Norm = d2 / dTotal;
    let d3Norm = d3 / dTotal;

    //console.log(d1Norm, d2Norm, d3Norm);

    let z = d1Norm * z0 + d2Norm * z1 + d3Norm * z2;

    //console.log(z);

    return z;
}

function fillTriangleSimple(x0, y0, z0, x1, y1, z1, x2, y2, z2, color)
{
    // sort the points vertically
    if (y1 > y2)
    {
        [x1, x2] = [x2, x1];
        [y1, y2] = [y2, y1];
        [z1, z2] = [z2, z1];
    }
    if (y0 > y1)
    {
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
        [z0, z1] = [z1, z0];
    }
    if (y1 > y2)
    {
        [x1, x2] = [x2, x1];
        [y1, y2] = [y2, y1];
        [z1, z2] = [z2, z1];
    }

    const step = 1;

    let dx_far = (x2 - x0) / (y2 - y0 + 1);
    let dx_upper = (x1 - x0) / (y1 - y0 + 1);
    let dx_low = (x2 - x1) / (y2 - y1 + 1);
    let xf = x0;
    let xt = x0 + dx_upper; // if y0 == y1, special case

    let doSubStuff = (__x, __y, size) =>
    {
        for (let y = __y; y < __y + size; y++)
        {
            for (let x = __x; x < __x + size; x++)
            {
                let _x = x | 0;
                let _y = y | 0;
                let _z = getZ(x0,y0,z0,x1,y1,z1,x2,y2,z2,x,y);

                if (canvasZArray[_x + _y * width] > _z)
                {
                    drawPixel([_x, _y], color, step);
                    canvasZArray[_x + _y * width] = _z;
                }
            }
        }
    }


    for (let y = y0; y <= y2; y += step)
    {
        if (y >= 0)
        {
            let xf2 = (xf > 0) ? xf : 0;
            let xt2 = (xt > 0) ? xt : 0;

            for (let x = xf2; x <= xt; x += step)
            {
                doSubStuff(x, y, step);
            }

            for (let x = xf; x >= xt2; x -= step)
            {
                doSubStuff(x, y, step);
            }
        }
        xf += dx_far;
        if (y < y1)
            xt += dx_upper;
        else
            xt += dx_low;
    }
}

function rasterize3DTriangle(tri3D, color)
{
    let tri2D = triangleTo2D(tri3D);

    let point1 = tri2D[0];
    let point2 = tri2D[1];
    let point3 = tri2D[2];

    //drawLine(point1[0], point1[1], point2[0], point2[1], color);
    //drawLine(point2[0], point2[1], point3[0], point3[1], color);
    //drawLine(point3[0], point3[1], point1[0], point1[1], color);

    fillTriangleSimple(
        point1[0], point1[1], tri3D[0][2],
        point2[0], point2[1], tri3D[1][2],
        point3[0], point3[1], tri3D[2][2],
        color);

}
function drawDot([x, y], col)
{
    ctx.beginPath();
    ctx.fillStyle = col;
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, 1, 1);
    ctx.closePath();
}


function drawPixel([x, y], col, size)
{
    if (!size)
        size = 1;

    ctx.beginPath();
    ctx.fillStyle = col;
    ctx.lineWidth = 1;
    ctx.fillRect(x - size/2, y- size/2, size, size);
    ctx.closePath();
}


function rotatePointAroundPointWith3Angles(point, center, angles, inverseAngles)
{
    let x = point[0];
    let y = point[1];
    let z = point[2];

    let cx = center[0];
    let cy = center[1];
    let cz = center[2];

    let ax = angles[0];
    let ay = angles[1];
    let az = angles[2];

    if (inverseAngles)
    {
        ax *= -1;
        ay *= -1;
        az *= -1;
    }

    let x2 = x - cx;
    let y2 = y - cy;
    let z2 = z - cz;

    let x3 = x2;
    let y3 = y2 * Math.cos(ax) - z2 * Math.sin(ax);
    let z3 = y2 * Math.sin(ax) + z2 * Math.cos(ax);

    let x4 = x3 * Math.cos(ay) + z3 * Math.sin(ay);
    let y4 = y3;
    let z4 = -x3 * Math.sin(ay) + z3 * Math.cos(ay);

    let x5 = x4 * Math.cos(az) - y4 * Math.sin(az);
    let y5 = x4 * Math.sin(az) + y4 * Math.cos(az);
    let z5 = z4;

    let x6 = x5 + cx;
    let y6 = y5 + cy;
    let z6 = z5 + cz;

    return [x6, y6, z6];
}

function rotatePointAroundPointWith2Angles(point, center, angles, inverseAngles)
{
    let x = point[0];
    let y = point[1];
    let z = point[2];

    let cx = center[0];
    let cy = center[1];
    let cz = center[2];

    [x, z] = [z, x];
    [cx, cz] = [cz, cx];

    let ax = angles[0];
    let ay = angles[1];

    if (inverseAngles)
    {
        ax *= -1;
        ay *= -1;
    }

    let x2 = x - cx;
    let y2 = y - cy;
    let z2 = z - cz;

    let x3 = x2 * Math.cos(ax) + z2 * Math.sin(ax);
    let y3 = y2;
    let z3 = -x2 * Math.sin(ax) + z2 * Math.cos(ax);

    let x4 = x3 * Math.cos(ay) - y3 * Math.sin(ay);
    let y4 = x3 * Math.sin(ay) + y3 * Math.cos(ay);
    let z4 = z3;

    let x5 = x4 + cx;
    let y5 = y4 + cy;
    let z5 = z4 + cz;

    [x5, z5] = [z5, x5];

    return [x5, y5, z5];
}

function rotatePointAroundPointWithAngles(point, center, angles, inverseAngles)
{
    return rotatePointAroundPointWith2Angles(point, center, angles, inverseAngles);
}

function offsetPoint(point, offset, mult)
{
    let x = point[0];
    let y = point[1];
    let z = point[2];

    let ox = offset[0];
    let oy = offset[1];
    let oz = offset[2];

    ox *= mult;
    oy *= mult;
    oz *= mult;

    return [x + ox, y + oy, z + oz];
}

function offsetTriangle(triangle, offset, mult)
{
    let point1 = offsetPoint(triangle[0], offset, mult);
    let point2 = offsetPoint(triangle[1], offset, mult);
    let point3 = offsetPoint(triangle[2], offset, mult);

    return [point1, point2, point3];
}

function rotateTriangleAroundPointWithAngles(triangle, center, angles)
{
    let point1 = rotatePointAroundPointWithAngles(triangle[0], center, angles);
    let point2 = rotatePointAroundPointWithAngles(triangle[1], center, angles);
    let point3 = rotatePointAroundPointWithAngles(triangle[2], center, angles);

    return [point1, point2, point3];
}

function pointTo2D(point)
{
    let x = point[0];
    let y = point[1];
    let z = point[2];

    let x2 = x * pFov / (z + pFov);
    let y2 = y * pFov / (z + pFov);

    x2 += width / 2;
    y2 += height / 2;

    return [x2, y2];
}

function triangleTo2D(triangle)
{
    let point1 = pointTo2D(triangle[0]);
    let point2 = pointTo2D(triangle[1]);
    let point3 = pointTo2D(triangle[2]);

    return [point1, point2, point3];
}

function drawTriangle(triangle, col, fill)
{
    let point1 = triangle[0];
    let point2 = triangle[1];
    let point3 = triangle[2];

    drawLine(point1[0], point1[1], point2[0], point2[1], col);
    drawLine(point2[0], point2[1], point3[0], point3[1], col);
    drawLine(point3[0], point3[1], point1[0], point1[1], col);

    if (fill)
    {
        fillTriangle(point1[0], point1[1], point2[0], point2[1], point3[0], point3[1], col);
    }
}



let globTriangles = [];
let pPosition = [0, -30, -200];
let pRotation = [0, 0, 0];
let pFov = 300;

let p2AxisRotation = [0, 0];


function addTriangle(x1, y1, z1, x2, y2, z2, x3, y3, z3, col)
{
    let point1 = [x1, y1, z1];
    let point2 = [x2, y2, z2];
    let point3 = [x3, y3, z3];

    let tri = {color: nameToRgba(col), points: [point1, point2, point3]};
    globTriangles.push(tri);
    return tri;
}


function drawTriangles()
{
    clearCanvas();

    let tempPos = [pPosition[0], pPosition[1], pPosition[2] + pFov];
    let tempRot = [pRotation[0], pRotation[1]];

    let tempTriangles = [];

    for(let i = 0; i < globTriangles.length; i++)
    {
        let _tri = globTriangles[i];
        let tri = _tri.points;
        let tri2 = tri;//offsetTriangle(tri, pPosition, -1);
        let tri3 = rotateTriangleAroundPointWithAngles(tri2, pPosition, tempRot);
        let tri4 = offsetTriangle(tri3, tempPos, -1);

        // check if any point is negative z
        let inBounds = true;
        for (let j = 0; j < tri4.length; j++)
        {
            let point = tri4[j];
            if (point[2] + pFov < 0)
            {
                inBounds = false;
                break;
            }
        }

        if (!inBounds)
            continue;

        let tAdd = (i * 13 % 200) - 100;
        tAdd /= 2;

        let tCol1 = _tri.color;
        let tCol2 = [tCol1[0], tCol1[1], tCol1[2]];

        for (let x = 0; x < 3; x++)
        {
            tCol2[x] = tCol2[x] + tAdd;
            if (tCol2[x] > 255)
                tCol2[x] = 255;
            if (tCol2[x] < 0)
                tCol2[x] = 0;
        }

        let tCol3 = rgb(tCol2);

        tempTriangles.push({color: tCol3, points: tri4});
    }

    tempTriangles.sort(
        (a, b) =>
        {
            let az = a.points[0][2] + a.points[1][2] + a.points[2][2];
            let bz = b.points[0][2] + b.points[1][2] + b.points[2][2];

            return bz - az;
        }
    );

    for (let tri of tempTriangles)
    {
        let points = tri.points;
        let col = tri.color;

        if (goofy)
            rasterize3DTriangle(points, col);
        else
        {
            let tri5 = triangleTo2D(points);
            drawTriangle(tri5, col, !wireframe);
        }
    }

    {
        let playerCenter = pPosition;
        playerCenter = offsetPoint(playerCenter, pPosition, -1);
        //console.log(playerCenter);
        let playerCenter2d = pointTo2D(playerCenter);
        //console.log(playerCenter2d);
        drawPixel(playerCenter2d, "red", 6);
    }
}


function printStats()
{
    console.log(`Position: ${pPosition[0]}, ${pPosition[1]}, ${pPosition[2]}`);
    console.log(`Rotation: ${Math.round(pRotation[0] * 100) / 100}, ${Math.round(pRotation[1] * 100) / 100}, ${Math.round(pRotation[2] * 100) / 100}`);
    console.log(`FOV: ${pFov}`);
    console.log("");
}

function generateLocalCubes(dist)
{
    let center;
    let cubeArr = [];

    // down
    center = [pPosition[0], pPosition[1] + dist, pPosition[2]];
    cubeArr.push(addCube(center, 5));

    // up
    center = [pPosition[0], pPosition[1] - dist, pPosition[2]];
    cubeArr.push(addCube(center, 5));

    // right
    center = [pPosition[0] + dist, pPosition[1], pPosition[2]];
    cubeArr.push(addCube(center, 5));

    // left
    center = [pPosition[0] - dist, pPosition[1], pPosition[2]];
    cubeArr.push(addCube(center, 5));

    // forward
    center = [pPosition[0], pPosition[1], pPosition[2] + dist];
    cubeArr.push(addCube(center, 5));

    // back
    center = [pPosition[0], pPosition[1], pPosition[2] - dist];
    cubeArr.push(addCube(center, 5));


    return cubeArr;
}

function doFrame()
{
    //printStats();

    const drawCubes = false;
    let cubes;
    if (drawCubes)
        cubes = generateLocalCubes(100);

    drawTriangles();

    if (drawCubes)
        for (let cube of cubes)
            removeCube(cube);
}

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

// basically repeat the keydownrepeathandler until keyup

let keyDict = {};
function keyDownHandler(key)
{
    if (keyDict[key.key])
        return;

    if (key.key == "g")
        goofy = !goofy;
    else if (key.key == "m")
        move = !move;
    else if (key.key == "x")
        wireframe = !wireframe;

    keyDict[key.key] = setInterval(() => {keyDownRepeatHandler((key))}, 1000 / 40);
}


function keyUpHandler(key)
{
    clearInterval(keyDict[key.key]);
    delete keyDict[key.key];
}

function radFromDeg(deg)
{
    return deg * Math.PI / 180;
}

function goofy2AxisRot(euler)
{
    let x = Math.sin(euler[0]) * Math.cos(euler[1]);
    let y = Math.cos(euler[0]) * Math.cos(euler[1]);
    let z = Math.sin(euler[1]);

    // x = Math.round(x * 100) / 100;
    // y = Math.round(y * 100) / 100;
    // z = Math.round(z * 100) / 100;

    return [x, y, z];
}

function moveFrom2AxisRotation(currentRot, offSetRot, mult, multArr)
{
    if (!multArr)
        multArr = [1,1,1];
    let tempPos;

    let ax = currentRot[0];
    let ay = currentRot[1];

    ax += offSetRot[0];
    ay += offSetRot[1];

    let rot = goofy2AxisRot([ax, ay]);

    tempPos = [rot[0], rot[2], rot[1]];

    tempPos[0] *= mult * multArr[0];
    tempPos[1] *= mult * -1 * multArr[1];
    tempPos[2] *= mult * multArr[2];


    pPosition[0] += tempPos[0];
    pPosition[1] += tempPos[1];
    pPosition[2] += tempPos[2];
}

let shouldDoFrame = true;

function keyDownRepeatHandler(key)
{
    if (key.key == "w")
        moveFrom2AxisRotation(pRotation, [0, 0], 5);
    else if (key.key == "s")
        moveFrom2AxisRotation(pRotation, [0, 0], -5);
    else if (key.key == "a")
        moveFrom2AxisRotation(pRotation, [radFromDeg(90), 0], -5, [1, 0, 1]);
    else if (key.key == "d")
        moveFrom2AxisRotation(pRotation, [radFromDeg(90), 0], 5, [1, 0, 1]);
    else if (key.key == "e")
        moveFrom2AxisRotation(pRotation, [0, radFromDeg(90)], 5);
    else if (key.key == "q")
        moveFrom2AxisRotation(pRotation, [0, radFromDeg(90)], -5);

    else if (key.key == "ArrowUp")
        pRotation[1] += 0.04;
    else if (key.key == "ArrowDown")
        pRotation[1] -= 0.04;
    else if (key.key == "ArrowLeft")
        pRotation[0] -= 0.04;
    else if (key.key == "ArrowRight")
        pRotation[0] += 0.04;

    else if (key.key == "r")
        pFov += 10;
    else if (key.key == "f")
        pFov -= 10;

    else if (key.key == " ")
    {
        pPosition = [0, -30, -200];
        pRotation = [0, 0, 0];
        pFov = 300;
    }

    else if (key.key == "p")
        console.log(globTriangles);

    shouldDoFrame = true;
}

let hold = false;
let lastMouseX = 0;
let lastMouseY = 0;
document.addEventListener('mousedown', (e) =>
{
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    hold = true;
});
document.addEventListener('mouseup', () => hold = false);



document.addEventListener('mousemove', (e) =>
{
    if (!hold)
        return;

    let dx = e.clientX - lastMouseX;
    let dy = e.clientY - lastMouseY;

    pRotation[0] += dx / 200;
    pRotation[1] -= dy / 200;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});




function addCube(centerPoint, cubeOffset)
{
    let cube = [
        addTriangle(-cubeOffset, -cubeOffset, -cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, cubeOffset, cubeOffset, "red"),
        addTriangle(-cubeOffset, -cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, cubeOffset, "red"),

        addTriangle(-cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, cubeOffset, "green"),
        addTriangle(-cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, "green"),

        addTriangle(-cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, cubeOffset, -cubeOffset, "blue"),
        addTriangle(-cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, "blue"),

        addTriangle(-cubeOffset, cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, "yellow"),
        addTriangle(-cubeOffset, cubeOffset, -cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, -cubeOffset, "yellow"),

        addTriangle(cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, "cyan"),
        addTriangle(cubeOffset, -cubeOffset, -cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, -cubeOffset, "cyan"),

        addTriangle(-cubeOffset, -cubeOffset, cubeOffset, -cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, "magenta"),
        addTriangle(-cubeOffset, -cubeOffset, cubeOffset, cubeOffset, -cubeOffset, cubeOffset, cubeOffset, cubeOffset, cubeOffset, "magenta"),
    ];

    for(let i = 0; i < cube.length; i++)
    {
        let tri = cube[i];
        for(let j = 0; j < tri.points.length; j++)
        {
            let point = tri.points[j];
            point[0] += centerPoint[0];
            point[1] += centerPoint[1];
            point[2] += centerPoint[2];
        }
    }

    return cube;
}

function removeCube(cube)
{
    for (let i = 0; i < cube.length; i++)
    {
        let tri = cube[i];
        let index = globTriangles.indexOf(tri);
        if (index > -1)
            globTriangles.splice(index, 1);
    }
}



function addTeapot(bottomPoint, mult)
{
    let teapot = [];

    for (let index = 0; index < _teapot.length; index += 9)
    {
        let x1 = _teapot[index + 0];
        let y1 = _teapot[index + 1];
        let z1 = _teapot[index + 2];

        let x2 = _teapot[index + 3];
        let y2 = _teapot[index + 4];
        let z2 = _teapot[index + 5];

        let x3 = _teapot[index + 6];
        let y3 = _teapot[index + 7];
        let z3 = _teapot[index + 8];


        x1 *= mult;
        y1 *= mult;
        z1 *= mult;

        x2 *= mult;
        y2 *= mult;
        z2 *= mult;

        x3 *= mult;
        y3 *= mult;
        z3 *= mult;

        x1 += bottomPoint[0];
        y1 += bottomPoint[1];
        z1 += bottomPoint[2];

        x2 += bottomPoint[0];
        y2 += bottomPoint[1];
        z2 += bottomPoint[2];

        x3 += bottomPoint[0];
        y3 += bottomPoint[1];
        z3 += bottomPoint[2];

        teapot.push(addTriangle(x1, y1, z1, x2, y2, z2, x3, y3, z3, "white"));
    }
    return teapot;
}

function moveTeaPot(teapot, offset)
{
    for (let i = 0; i < teapot.length; i++)
    {
        let tri = teapot[i];
        for (let j = 0; j < tri.points.length; j++)
        {
            let point = tri.points[j];
            point[0] += offset[0];
            point[1] += offset[1];
            point[2] += offset[2];
        }
    }
}





initCanvas(window.innerWidth, window.innerHeight);

addCube([0,100,0], 50);
addCube([200,0,0], 25);

let pot = addTeapot([0, 0, 0], 50);

setInterval(testFrame, 1000 / 30);

let frame = 0;
function testFrame()
{
    if (move)
    {
        frame++;
        moveTeaPot(pot, [0, (frame % 40 > 20) ? 2 : -2, 0]);
        shouldDoFrame = true;
    }

    if (!shouldDoFrame)
        return;
    doFrame();
    shouldDoFrame = false;
    console.log("FRAME")
}