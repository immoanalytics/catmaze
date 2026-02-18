/* Run once in browser console OR at build time via Node-canvas.
   We embed this as a startup script that writes icons to <link> and caches them. */

(function generateIcons() {
  const sizes = [192, 512];

  function drawCatIcon(size) {
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    const s = size / 16; // pixel unit

    // background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, size, size);

    // rounded bg
    ctx.fillStyle = "#2a2a4e";
    const pad = s;
    const rad = s * 2;
    ctx.beginPath();
    ctx.moveTo(pad + rad, pad);
    ctx.lineTo(size - pad - rad, pad);
    ctx.quadraticCurveTo(size - pad, pad, size - pad, pad + rad);
    ctx.lineTo(size - pad, size - pad - rad);
    ctx.quadraticCurveTo(size - pad, size - pad, size - pad - rad, size - pad);
    ctx.lineTo(pad + rad, size - pad);
    ctx.quadraticCurveTo(pad, size - pad, pad, size - pad - rad);
    ctx.lineTo(pad, pad + rad);
    ctx.quadraticCurveTo(pad, pad, pad + rad, pad);
    ctx.fill();

    const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*s, y*s, s, s); };

    // cat body
    const body = "#f5a623", ear = "#e08e1b";
    for (let r = 5; r < 13; r++) for (let c = 4; c < 12; c++) px(c, r, body);
    // ears
    px(4,3,ear); px(5,3,ear); px(4,4,ear); px(5,4,body);
    px(10,3,ear); px(11,3,ear); px(11,4,ear); px(10,4,body);
    // head top
    for (let c = 5; c < 11; c++) px(c, 4, body);
    // eyes
    px(6,6,"#2d2d2d"); px(9,6,"#2d2d2d");
    // nose
    px(7,8,"#ff6b8a"); px(8,8,"#ff6b8a");
    // whiskers
    px(3,7,"#fff"); px(2,7,"#fff"); px(12,7,"#fff"); px(13,7,"#fff");
    px(3,9,"#fff"); px(12,9,"#fff");
    // feet
    px(5,13,"#fff"); px(6,13,"#fff"); px(9,13,"#fff"); px(10,13,"#fff");
    // tail
    px(12,10,body); px(13,9,body); px(14,8,body);

    return c;
  }

  sizes.forEach(size => {
    const icon = drawCatIcon(size);
    const url = icon.toDataURL("image/png");

    // update link tags
    const links = document.querySelectorAll(`link[rel="icon"], link[rel="apple-touch-icon"]`);
    links.forEach(l => {
      if (size === 192) l.href = url;
    });

    // save to fetch cache for the SW
    if ('caches' in window) {
      icon.toBlob(blob => {
        caches.open("catmaze-icons-v1").then(cache => {
          cache.put(`/icons/icon-${size}.png`, new Response(blob, {
            headers: { "Content-Type": "image/png" }
          }));
        });
      }, "image/png");
    }
  });
})();
