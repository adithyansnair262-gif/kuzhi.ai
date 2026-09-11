// =====================================================
// KUZHI.AI
// COMPLETE FRONTEND ENGINE
// =====================================================


// =====================================================
// PAGE NAVIGATION
// =====================================================

function enterLab() {

    const landing = document.getElementById("landing");
    const lab = document.getElementById("lab");

    landing.style.display = "none";

    lab.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

    setTimeout(() => {

        lab.classList.add("show");

    }, 30);
}


function backToLanding() {

    const landing = document.getElementById("landing");
    const lab = document.getElementById("lab");

    lab.classList.remove("show");

    setTimeout(() => {

        lab.style.display = "none";

        landing.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }, 300);
}



// =====================================================
// ELEMENTS
// =====================================================

const dropzone =
    document.getElementById("dropzone");

const fileInput =
    document.getElementById("fileInput");

const srcCanvas =
    document.getElementById("srcCanvas");

const outCanvas =
    document.getElementById("outCanvas");

const previewWrap =
    document.getElementById("previewWrap");

const analyzeBtn =
    document.getElementById("analyzeBtn");

const computePanel =
    document.getElementById("computePanel");

const resultsPanel =
    document.getElementById("resultsPanel");

const noHolePanel =
    document.getElementById("noHolePanel");

const logContainer =
    document.getElementById("logContainer");



// =====================================================
// FILE UPLOAD
// =====================================================

dropzone.addEventListener(
    "click",
    () => fileInput.click()
);


fileInput.addEventListener(
    "change",
    function () {

        if (this.files.length > 0) {

            loadImage(this.files[0]);

        }

    }
);



// =====================================================
// DRAG & DROP
// =====================================================

dropzone.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        dropzone.classList.add("drag");

    }
);


dropzone.addEventListener(
    "dragleave",
    function () {

        dropzone.classList.remove("drag");

    }
);


dropzone.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        dropzone.classList.remove("drag");

        const file =
            event.dataTransfer.files[0];

        if (file) {

            loadImage(file);

        }

    }
);



// =====================================================
// LOAD IMAGE
// =====================================================

function loadImage(file) {

    if (!file.type.startsWith("image/")) {

        alert("Please upload an image.");

        return;

    }


    const reader =
        new FileReader();


    reader.onload = function (event) {

        const image =
            new Image();


        image.onload = function () {

            const maxSize = 500;

            let width =
                image.width;

            let height =
                image.height;


            const scale =
                Math.min(
                    maxSize / width,
                    maxSize / height,
                    1
                );


            width =
                Math.round(width * scale);

            height =
                Math.round(height * scale);


            srcCanvas.width = width;

            srcCanvas.height = height;


            const context =
                srcCanvas.getContext("2d");


            context.drawImage(
                image,
                0,
                0,
                width,
                height
            );


            previewWrap.classList.add("show");

            analyzeBtn.disabled = false;

            computePanel.classList.remove("show");

            resultsPanel.classList.remove("show");

            noHolePanel.classList.remove("show");

        };


        image.src =
            event.target.result;

    };


    reader.readAsDataURL(file);

}



// =====================================================
// ANALYZE BUTTON
// =====================================================

analyzeBtn.addEventListener(
    "click",
    startAnalysis
);


function startAnalysis() {

    analyzeBtn.disabled = true;

    computePanel.classList.add("show");

    resultsPanel.classList.remove("show");

    noHolePanel.classList.remove("show");

    logContainer.innerHTML = "";


    const steps = [

        "Loading specimen into pixel buffer...",

        "Converting RGB → grayscale luminance map...",

        "Estimating background colour...",

        "Searching for enclosed regions...",

        "Scoring candidate holes...",

        "Extracting boundary pixels...",

        "Computing centroid C = (x̄, ȳ)...",

        "Sampling radial distances rᵢ...",

        "Computing isoperimetric quotient...",

        "Calculating radial symmetry...",

        "Preparing mathematical verdict..."

    ];


    let index = 0;


    function nextStep() {

        if (index >= steps.length) {

            setTimeout(
                performAnalysis,
                350
            );

            return;

        }


        const line =
            document.createElement("div");


        line.className =
            "log-line";


        line.innerHTML =
            `<span>✓</span> ${steps[index]}`;


        logContainer.appendChild(line);


        setTimeout(() => {

            line.classList.add("visible");

        }, 20);


        index++;


        setTimeout(
            nextStep,
            180
        );

    }


    nextStep();

}



// =====================================================
// IMAGE ANALYSIS
// =====================================================

function performAnalysis() {

    const width =
        srcCanvas.width;

    const height =
        srcCanvas.height;


    const context =
        srcCanvas.getContext("2d");


    const imageData =
        context.getImageData(
            0,
            0,
            width,
            height
        );


    const data =
        imageData.data;


    // -------------------------------------------------
    // GRAYSCALE
    // -------------------------------------------------

    const gray =
        new Float32Array(
            width * height
        );


    let total =
        0;


    for (
        let i = 0;
        i < width * height;
        i++
    ) {

        const p =
            i * 4;


        const value =
            0.299 * data[p] +
            0.587 * data[p + 1] +
            0.114 * data[p + 2];


        gray[i] =
            value;


        total += value;

    }


    const mean =
        total /
        (width * height);


    // -------------------------------------------------
    // STANDARD DEVIATION
    // -------------------------------------------------

    let variance = 0;


    for (
        let i = 0;
        i < gray.length;
        i++
    ) {

        variance +=
            Math.pow(
                gray[i] - mean,
                2
            );

    }


    const std =
        Math.sqrt(
            variance /
            gray.length
        );


    // -------------------------------------------------
    // BUILD DARK MASK
    // -------------------------------------------------

    const threshold =
        mean - std * 0.55;


    const mask =
        new Uint8Array(
            width * height
        );


    for (
        let i = 0;
        i < gray.length;
        i++
    ) {

        if (
            gray[i] <
            threshold
        ) {

            mask[i] = 1;

        }

    }


    // -------------------------------------------------
    // FIND COMPONENTS
    // -------------------------------------------------

    const components =
        findComponents(
            mask,
            width,
            height
        );


    // -------------------------------------------------
    // CHOOSE BEST HOLE
    // -------------------------------------------------

    let best =
        null;


    for (
        const component
        of components
    ) {

        if (
            component.size < 30
        ) {

            continue;

        }


        if (
            component.touchesEdge
        ) {

            continue;

        }


        const fraction =
            component.size /
            (width * height);


        if (
            fraction < 0.001 ||
            fraction > 0.35
        ) {

            continue;

        }


        const centerDistance =
            Math.hypot(
                component.cx - width / 2,
                component.cy - height / 2
            );


        const maximumDistance =
            Math.min(
                width,
                height
            ) / 2;


        const centered =
            Math.max(
                0,
                1 -
                centerDistance /
                maximumDistance
            );


        const sizeScore =
            1 -
            Math.min(
                1,
                Math.abs(
                    fraction - 0.06
                ) / 0.20
            );


        const score =
            centered * 0.35 +
            sizeScore * 0.25 +
            Math.min(
                1,
                component.size / 1000
            ) * 0.4;


        if (
            !best ||
            score > best.score
        ) {

            best = {

                ...component,

                score

            };

        }

    }


    // -------------------------------------------------
    // NO HOLE
    // -------------------------------------------------

    if (!best) {

        computePanel.classList.remove(
            "show"
        );


        noHolePanel.classList.add(
            "show"
        );


        analyzeBtn.disabled = false;

        noHolePanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        return;

    }


    // -------------------------------------------------
    // ANALYZE BOUNDARY
    // -------------------------------------------------

    const points = [];


    let perimeter = 0;


    for (
        let y = 1;
        y < height - 1;
        y++
    ) {

        for (
            let x = 1;
            x < width - 1;
            x++
        ) {

            const index =
                y * width + x;


            if (
                best.pixels.has(index)
            ) {

                const edge =

                    !best.pixels.has(index - 1) ||

                    !best.pixels.has(index + 1) ||

                    !best.pixels.has(index - width) ||

                    !best.pixels.has(index + width);


                if (edge) {

                    perimeter++;


                    points.push({

                        x,

                        y

                    });

                }

            }

        }

    }


    // -------------------------------------------------
    // CENTROID
    // -------------------------------------------------

    const cx =
        best.cx;

    const cy =
        best.cy;


    // -------------------------------------------------
    // RADII
    // -------------------------------------------------

    const radii =
        points.map(
            point => {

                return {

                    x: point.x,

                    y: point.y,

                    angle:
                        Math.atan2(
                            point.y - cy,
                            point.x - cx
                        ),

                    radius:
                        Math.hypot(
                            point.x - cx,
                            point.y - cy
                        )

                };

            }
        );


    if (
        radii.length < 10
    ) {

        showNoHole();

        return;

    }


    // -------------------------------------------------
    // AVERAGE RADIUS
    // -------------------------------------------------

    let radiusTotal =
        0;


    for (
        const point
        of radii
    ) {

        radiusTotal +=
            point.radius;

    }


    const averageRadius =
        radiusTotal /
        radii.length;


    // -------------------------------------------------
    // RADIAL STANDARD DEVIATION
    // -------------------------------------------------

    let radialVariance =
        0;


    for (
        const point
        of radii
    ) {

        radialVariance +=
            Math.pow(
                point.radius -
                averageRadius,
                2
            );

    }


    const radialDeviation =
        Math.sqrt(
            radialVariance /
            radii.length
        );


    // -------------------------------------------------
    // COEFFICIENT OF VARIATION
    // -------------------------------------------------

    const cv =
        averageRadius > 0

            ?

            radialDeviation /
            averageRadius

            :

            0;


    // -------------------------------------------------
    // CIRCULARITY
    // -------------------------------------------------

    const area =
        best.size;


    const circularity =
        perimeter > 0

            ?

            Math.min(
                1,
                4 *
                Math.PI *
                area /
                Math.pow(
                    perimeter,
                    2
                )
            )

            :

            0;


    // -------------------------------------------------
    // CENTER OFFSET
    // -------------------------------------------------

    const centerDistance =
        Math.hypot(
            cx - width / 2,
            cy - height / 2
        );


    const centerOffset =
        Math.min(
            100,
            centerDistance /
            (Math.min(width,height)/2) *
            100
        );


    // -------------------------------------------------
    // SCORE
    // -------------------------------------------------

    const circularityScore =
        circularity * 100;


    const symmetryScore =
        Math.max(
            0,
            100 - cv * 140
        );


    const centeringScore =
        Math.max(
            0,
            100 - centerOffset
        );


    const finalScore =
        Math.round(

            circularityScore * 0.45 +

            symmetryScore * 0.25 +

            centeringScore * 0.30

        );


    const score =
        Math.max(
            0,
            Math.min(
                100,
                finalScore
            )
        );


    // -------------------------------------------------
    // GRADE
    // -------------------------------------------------

    let grade;

    let color;


    if (score >= 90) {

        grade =
            "A+ Exemplary Kuzhi";

        color =
            "#8FF0DA";

    }

    else if (score >= 75) {

        grade =
            "A — Certified Round";

        color =
            "#8FF0DA";

    }

    else if (score >= 60) {

        grade =
            "B — Passable";

        color =
            "#FFE28A";

    }

    else if (score >= 40) {

        grade =
            "C — Eccentric";

        color =
            "#FFB3D6";

    }

    else {

        grade =
            "D — Barely a Kuzhi";

        color =
            "#FFB3D6";

    }


    // -------------------------------------------------
    // UPDATE UI
    // -------------------------------------------------

    document.getElementById(
        "mCircularity"
    ).textContent =
        circularity.toFixed(3);


    document.getElementById(
        "mCentroid"
    ).textContent =
        Math.round(centerOffset) +
        "%";


    document.getElementById(
        "mRadial"
    ).textContent =
        radialDeviation.toFixed(1) +
        " px";


    document.getElementById(
        "mCV"
    ).textContent =
        (cv * 100).toFixed(1) +
        "%";


    document.getElementById(
        "mDiameter"
    ).textContent =
        Math.round(
            averageRadius * 2
        ) +
        " px";


    document.getElementById(
        "mSample"
    ).textContent =
        radii.length.toLocaleString();


    document.getElementById(
        "boardScore"
    ).textContent =
        score;


    const gradeElement =
        document.getElementById(
            "boardGrade"
        );


    gradeElement.textContent =
        grade;


    gradeElement.style.color =
        color;


    // -------------------------------------------------
    // DRAW CHALK CIRCLE
    // -------------------------------------------------

    drawChalkCircle(
        radii,
        averageRadius
    );


    // -------------------------------------------------
    // DRAW RESULT IMAGE
    // -------------------------------------------------

    drawResult(
        width,
        height,
        cx,
        cy,
        averageRadius
    );


    // -------------------------------------------------
    // SHOW RESULTS
    // -------------------------------------------------

    computePanel.classList.remove(
        "show"
    );


    resultsPanel.classList.add(
        "show"
    );


    analyzeBtn.disabled =
        false;


    analyzeBtn.textContent =
        "Re-Run Circularity Analysis";


    resultsPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}



// =====================================================
// COMPONENT DETECTION
// =====================================================

function findComponents(
    mask,
    width,
    height
) {

    const visited =
        new Uint8Array(
            width * height
        );


    const components = [];


    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const start =
                y * width + x;


            if (
                !mask[start] ||
                visited[start]
            ) {

                continue;

            }


            const queue =
                [start];


            visited[start] =
                1;


            const pixels =
                new Set();


            let sumX = 0;

            let sumY = 0;

            let touchesEdge =
                false;


            while (
                queue.length
            ) {

                const current =
                    queue.pop();


                pixels.add(current);


                const px =
                    current % width;


                const py =
                    Math.floor(
                        current / width
                    );


                sumX += px;

                sumY += py;


                if (
                    px === 0 ||
                    py === 0 ||
                    px === width - 1 ||
                    py === height - 1
                ) {

                    touchesEdge =
                        true;

                }


                const neighbours = [

                    current - 1,

                    current + 1,

                    current - width,

                    current + width

                ];


                for (
                    const neighbour
                    of neighbours
                ) {

                    if (
                        neighbour >= 0 &&
                        neighbour < mask.length &&
                        mask[neighbour] &&
                        !visited[neighbour]
                    ) {

                        visited[neighbour] =
                            1;

                        queue.push(
                            neighbour
                        );

                    }

                }

            }


            components.push({

                pixels,

                size:
                    pixels.size,

                cx:
                    sumX /
                    pixels.size,

                cy:
                    sumY /
                    pixels.size,

                touchesEdge

            });

        }

    }


    return components;

}



// =====================================================
// DRAW CHALK DIAGRAM
// =====================================================

function drawChalkCircle(
    radii,
    averageRadius
) {

    const path =
        document.getElementById(
            "chalkPath"
        );


    const sorted =
        [...radii].sort(
            (a,b) =>
                a.angle -
                b.angle
        );


    const scale =
        65 /
        Math.max(
            averageRadius,
            1
        );


    let d = "";


    for (
        let i = 0;
        i < sorted.length;
        i += Math.max(
            1,
            Math.floor(
                sorted.length / 70
            )
        )
    ) {

        const point =
            sorted[i];


        const jitter =
            Math.sin(i * 4.7) * 1.5;


        const radius =
            point.radius *
            scale +
            jitter;


        const x =
            100 +
            radius *
            Math.cos(
                point.angle
            );


        const y =
            100 +
            radius *
            Math.sin(
                point.angle
            );


        d +=

            (d === "" ? "M" : "L") +

            x.toFixed(1) +

            "," +

            y.toFixed(1) +

            " ";

    }


    d += "Z";


    path.setAttribute(
        "d",
        d
    );

}



// =====================================================
// DRAW RESULT OVERLAY
// =====================================================

function drawResult(
    width,
    height,
    cx,
    cy,
    radius
) {

    outCanvas.width =
        width;

    outCanvas.height =
        height;


    const context =
        outCanvas.getContext(
            "2d"
        );


    context.drawImage(
        srcCanvas,
        0,
        0
    );


    // Image center

    context.strokeStyle =
        "rgba(255,107,87,.8)";

    context.lineWidth =
        2;


    context.beginPath();

    context.moveTo(
        width / 2 - 12,
        height / 2
    );

    context.lineTo(
        width / 2 + 12,
        height / 2
    );

    context.moveTo(
        width / 2,
        height / 2 - 12
    );

    context.lineTo(
        width / 2,
        height / 2 + 12
    );

    context.stroke();


    // Detected hole

    context.strokeStyle =
        "#38E4C0";

    context.lineWidth =
        3;


    context.beginPath();


    context.arc(
        cx,
        cy,
        radius,
        0,
        Math.PI * 2
    );


    context.stroke();


    // Centroid

    context.fillStyle =
        "#C77DFF";


    context.beginPath();


    context.arc(
        cx,
        cy,
        5,
        0,
        Math.PI * 2
    );


    context.fill();

}



// =====================================================
// RESET
// =====================================================

function resetAnalysis() {

    fileInput.value = "";

    previewWrap.classList.remove(
        "show"
    );

    computePanel.classList.remove(
        "show"
    );

    resultsPanel.classList.remove(
        "show"
    );

    noHolePanel.classList.remove(
        "show"
    );


    analyzeBtn.disabled =
        true;


    analyzeBtn.textContent =
        "🔬 Run Circularity Analysis";


    logContainer.innerHTML =
        "";


    const context =
        srcCanvas.getContext("2d");


    context.clearRect(
        0,
        0,
        srcCanvas.width,
        srcCanvas.height
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}



// =====================================================
// NO HOLE HELPER
// =====================================================

function showNoHole() {

    computePanel.classList.remove(
        "show"
    );


    resultsPanel.classList.remove(
        "show"
    );


    noHolePanel.classList.add(
        "show"
    );


    analyzeBtn.disabled =
        false;

}