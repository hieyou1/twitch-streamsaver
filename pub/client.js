const id = document.getElementById.bind(document);

window.onload = async () => {
    /**
     * @constant opts Options based on URL Search Params and default options from server
     */
    const opts = new Map(Object.entries(Object.assign({}, await (await fetch("/defaultOpts")).json(), Object.fromEntries(new URL(window.location).searchParams.entries()))));
    console.log("using options", opts);

    var arrEmotes = [];
    var preloadEmotes = [];
    /**
     * @function getRandomEmoteArray
     * @param {Number} numEmotes 
     * @param {Boolean} preload Use preloadEmotes instead of arrEmotes
     * @returns {Array}
     */
    const getRandomEmoteArray = (numEmotes, preload = true) => {
        if (preload == true) arr = preloadEmotes; else if (Array.isArray(preload)) arr = preload; else arr = arrEmotes;
        let arrReturn = [];
        for (let i = 0; i < numEmotes; ++i)
            arrReturn.push(arr[Math.floor(Math.random() * (arr.length - 1))]);
        return ((numEmotes == 1) ? arrReturn[0] : arrReturn);
    };
    // start with globals only
    arrEmotes = (await (await fetch("/emotes?channel=global")).json());

    // if other channels passed, add them to array before picking
    if (opts.has("channels") && opts.get("channels").length > 0)
        for (let i of opts.get("channels").split(","))
            if (i != null)
                for (let j of (await (await fetch(`/emotes?channel=${i}`)).json())) arrEmotes.push(j);

    arrEmotes = getRandomEmoteArray(15, arrEmotes);
    // get emotes for randomizer

    // preload emote images
    for (let i of arrEmotes) {
        if (i != null) {
            let img = document.createElement("img");
            img.src = await new Promise(async (resolve) => {
                let fr = new FileReader();
                fr.onloadend = () => {
                    resolve(fr.result)
                };
                fr.readAsDataURL(await (await fetch(i.images.url_4x)).blob());
            });
            preloadEmotes.push(img);
        }
    }

    // declare variables
    const FPS = 30;

    // ball size
    var bs = 112;

    // ball position x, y

    var bx, by;
    // ball velocity x, y (in pixels per a second, aka how many pixels it moves per frame)
    var xv, yv;
    var canvas, context;

    // get canvas and context
    canvas = document.getElementById("gameCanvas");
    context = canvas.getContext("2d");

    // sets ball position to middle of canvas
    bx = canvas.width / 2;
    by = canvas.height / 2;

    // random ball starting speed (between 25 and 100 pixels per a second)
    xv = Math.floor(Math.random() * 76 + 25) / FPS;
    yv = Math.floor(Math.random() * 76 + 25) / FPS;

    // random ball direction
    if (Math.floor(Math.random() * 2) == 0) {
        xv = -xv;
    }
    if (Math.floor(Math.random() * 2) == 0) {
        yv = -yv;
    }


    let emote = getRandomEmoteArray(1);
    // update function
    const update = () => {
        // move the ball
        bx += xv;
        by += yv;

        // bounce the ball off each wall

        let onBounce = () => {
            emote = getRandomEmoteArray(1);
        };

        // checking if ball position (minus the size of the ball) is less than zero,
        // and if velocity is 0 (works because velocity will be negative if out of bounds)
        if (bx - bs / 2 < 0 && xv < 0) {
            xv = -xv;
            onBounce();

        }
        // checking if ball position is more than the width of the canvas and if velocity is more than 0
        if (bx + bs / 2 > canvas.width && xv > 0) {
            xv = -xv;
            onBounce();

        }
        if (by - bs / 2 < 0 && yv < 0) {
            yv = -yv;
            onBounce();
        }
        if (by + bs / 2 > canvas.height && yv > 0) {
            yv = -yv;
            onBounce();
        }


        // draw background and ball
        // redraws the canvas each time, first it draws the background, then it redraws some of the black with a yellow square for the ball
        context.fillStyle = ((opts.has("greenScreen") && opts.get("greenScreen") !== false) ? "rgb(0, 255, 0)" : "black");
        context.fillRect(0, 0, canvas.width, canvas.height);
        // context.fillStyle = "yellow";
        // context.fillRect(bx - bs / 2, by - bs / 2, bs, bs);

        // Adding DVD Logo Image in place of yellow square
        context.drawImage(emote, bx - bs / 2, by - bs / 2);

    }

    // Finish loading
    document.body.removeChild(id("loading"));

    // Calls the update function every 1/30th of a second
    setInterval(update, 1000 / FPS);
};
// fix sizing
const resize = () => {
    let canvas = document.getElementById('gameCanvas');
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}
window.addEventListener('resize', resize);
resize();