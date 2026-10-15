const uvod = document.getElementById("uvod");
const hra = document.getElementById("hra");
const deska = document.getElementById("deska");
const stav = document.getElementById("stav");
const zprava = document.getElementById("zprava");
const kodInput = document.getElementById("kod");
const okno = document.getElementById("okno");
const oknoText = document.getElementById("oknoText");
const N = 8;
const CIL = 4;
const SMERY = [[0, 1], [1, 0], [1, 1], [1, -1]];
let pole, hrac, konec, moje, spojeni, peer, tlacitka;
let rezim = "offline";
let posledni = -1;
let casovacBota = null;

function konfety() {
  const ems = ["🎉", "✨", "💖", "🎊", "⭐"];
  for (let k = 0; k < 28; k++) {
    const s = document.createElement("span");
    s.className = "konfeta";
    s.textContent = ems[k % ems.length];
    s.style.left = Math.random() * 95 + "vw";
    s.style.animationDelay = Math.random() * 1.2 + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 4500);
  }
}

function ukazOkno(text, vyhral) {
  setTimeout(() => {
    if (!konec) return;
    oknoText.textContent = text;
    okno.hidden = false;
    if (vyhral) konfety();
  }, 700);
}

function ukazStav() {
  if (konec) return;
  if (rezim === "offline") {
    stav.textContent = "Na tahu: " + hrac + " 🎯";
  } else if (rezim === "bot") {
    stav.textContent = hrac === "X" ? "Jsi na tahu (X) 🎯" : "Bot přemýšlí... 🤖";
  } else {
    stav.textContent = hrac === moje
      ? "Jsi na tahu (" + hrac + ") 🎯"
      : "Hraje soupeř (" + hrac + ") ⏳";
  }
}

function novaHra(odeslat) {
  if (odeslat && spojeni) spojeni.send({ typ: "znovu" });
  clearTimeout(casovacBota);
  okno.hidden = true;
  pole = Array(N * N).fill("");
  hrac = "X";
  konec = false;
  posledni = -1;
  deska.innerHTML = "";
  tlacitka = pole.map((_, i) => {
    const b = document.createElement("button");
    b.className = "policko";
    b.addEventListener("click", () => {
      if (konec || pole[i]) return;
      if (rezim === "online" && hrac !== moje) return;
      if (rezim === "bot" && hrac !== "X") return;
      tah(i, rezim === "online");
    });
    deska.appendChild(b);
    return b;
  });
  ukazStav();
}

function linie(i, kdo) {
  const r = Math.floor(i / N);
  const c = i % N;
  let nej = [];
  for (const [dr, dc] of SMERY) {
    const bunky = [i];
    for (const s of [1, -1]) {
      let rr = r + dr * s;
      let cc = c + dc * s;
      while (rr >= 0 && rr < N && cc >= 0 && cc < N && pole[rr * N + cc] === kdo) {
        bunky.push(rr * N + cc);
        rr += dr * s;
        cc += dc * s;
      }
    }
    if (bunky.length > nej.length) nej = bunky;
  }
  return nej;
}

function maSouseda(i) {
  const r = Math.floor(i / N);
  const c = i % N;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr;
      const cc = c + dc;
      if ((dr || dc) && rr >= 0 && rr < N && cc >= 0 && cc < N && pole[rr * N + cc]) return true;
    }
  }
  return false;
}

function ohodnot(i) {
  const m = linie(i, "O").length;
  const s = linie(i, "X").length;
  if (m >= CIL) return 10000;
  if (s >= CIL) return 5000;
  let sk = m * m * 10 + s * s * 8;
  if (m === CIL - 1) sk += 300;
  if (s === CIL - 1) sk += 250;
  if (maSouseda(i)) sk += 15;
  const r = Math.floor(i / N);
  const c = i % N;
  sk -= Math.abs(r - 3.5) + Math.abs(c - 3.5);
  return sk + Math.random();
}

function botTah() {
  if (konec) return;
  let nej = -1;
  let nejSk = -Infinity;
  pole.forEach((p, i) => {
    if (p) return;
    const sk = ohodnot(i);
    if (sk > nejSk) {
      nejSk = sk;
      nej = i;
    }
  });
  if (nej >= 0) tah(nej, false);
}

function konecHry(kdo) {
  if (rezim === "offline") {
    stav.textContent = "Vyhrál " + kdo + "! 🎉";
    ukazOkno("Gratuluji, vyhrál hráč " + kdo + "🎉", true);
  } else {
    const vyhral = rezim === "bot" ? kdo === "X" : kdo === moje;
    stav.textContent = vyhral ? "Vyhrál jsi! 🎉" : (rezim === "bot" ? "Bot vyhrál 🤖" : "Soupeř vyhrál 😅");
    ukazOkno(vyhral ? "Gratuluji, vyhrál jsi🎉" : "Prohrál jsi, zkus to znova🍀", vyhral);
  }
}

function tah(i, odeslat) {
  if (konec || pole[i]) return;
  pole[i] = hrac;
  const b = tlacitka[i];
  b.textContent = hrac;
  b.classList.add(hrac === "X" ? "x" : "o", "nove");
  if (posledni >= 0) tlacitka[posledni].classList.remove("posledni");
  b.classList.add("posledni");
  posledni = i;
  if (odeslat) spojeni.send({ typ: "tah", i: i });
  const l = linie(i, hrac);
  if (l.length >= CIL) {
    konec = true;
    l.forEach(k => tlacitka[k].classList.add("vitez"));
    konecHry(hrac);
  } else if (pole.every(p => p)) {
    konec = true;
    stav.textContent = "Remíza 🤝";
    ukazOkno("Remíza🤝", false);
  } else {
    hrac = hrac === "X" ? "O" : "X";
    ukazStav();
    if (rezim === "bot" && hrac === "O") {
      casovacBota = setTimeout(botTah, 700);
    }
  }
}

function nastavSpojeni(c) {
  spojeni = c;
  c.on("data", d => {
    if (d.typ === "tah") tah(d.i, false);
    if (d.typ === "znovu") novaHra(false);
  });
  c.on("close", () => {
    konec = true;
    okno.hidden = true;
    stav.textContent = "Soupeř se odpojil 👋";
  });
}

function start() {
  uvod.hidden = true;
  hra.hidden = false;
  novaHra(false);
}

function vytvor() {
  const kod = String(Math.floor(1000 + Math.random() * 9000));
  rezim = "online";
  moje = "X";
  peer = new Peer("pisk-" + kod);
  peer.on("open", () => {
    zprava.textContent = "Kód hry: " + kod + ". Pošli ho kamarádovi a počkej, až se připojí.";
  });
  peer.on("connection", c => {
    c.on("open", () => {
      nastavSpojeni(c);
      start();
    });
  });
  peer.on("error", e => {
    if (e.type === "unavailable-id") vytvor();
    else zprava.textContent = "Chyba: " + e.type;
  });
}

function pripoj() {
  const kod = kodInput.value.trim();
  if (!kod) {
    zprava.textContent = "Zadej kód hry.";
    return;
  }
  rezim = "online";
  moje = "O";
  zprava.textContent = "Připojuji...";
  peer = new Peer();
  peer.on("open", () => {
    const c = peer.connect("pisk-" + kod);
    c.on("open", () => {
      nastavSpojeni(c);
      start();
    });
  });
  peer.on("error", e => {
    zprava.textContent = e.type === "peer-unavailable"
      ? "Hra s tímto kódem neexistuje."
      : "Chyba: " + e.type;
  });
}

document.getElementById("offline").addEventListener("click", () => {
  rezim = "offline";
  start();
});
document.getElementById("bot").addEventListener("click", () => {
  rezim = "bot";
  start();
});
document.getElementById("vytvorit").addEventListener("click", vytvor);
document.getElementById("pripojit").addEventListener("click", pripoj);
document.getElementById("znovu").addEventListener("click", () => novaHra(rezim === "online"));
document.getElementById("menu").addEventListener("click", () => location.reload());
document.getElementById("oknoZnovu").addEventListener("click", () => novaHra(rezim === "online"));
document.getElementById("oknoKonec").addEventListener("click", () => location.reload());
