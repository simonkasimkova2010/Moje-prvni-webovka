const uvod = document.getElementById("uvod");
const hra = document.getElementById("hra");
const deska = document.getElementById("deska");
const stav = document.getElementById("stav");
const zprava = document.getElementById("zprava");
const kodInput = document.getElementById("kod");
const CIL = 4;

// rezim: "offline" (dva hráči u jednoho zařízení), "online" nebo "bot"
let pole, hrac, konec, moje, spojeni, peer, tlacitka, rezim, casovacBota;

function ukazStav() {
  if (konec) return;
  if (rezim === "offline") {
    stav.textContent = "Na tahu: " + hrac;
  } else if (rezim === "bot") {
    stav.textContent = hrac === moje
      ? "Jsi na tahu (" + hrac + ")"
      : "Bot přemýšlí... 🤖";
  } else {
    stav.textContent = hrac === moje
      ? "Jsi na tahu (" + hrac + ")"
      : "Hraje soupeř (" + hrac + ")";
  }
}

function novaHra(odeslat) {
  if (odeslat && spojeni) spojeni.send({ typ: "znovu" });
  clearTimeout(casovacBota);
  pole = Array(N * N).fill("");
  hrac = "X";
  konec = false;
  deska.innerHTML = "";
  tlacitka = pole.map((_, i) => {
    const b = document.createElement("button");
    b.className = "policko";
    b.addEventListener("click", () => {
      if (konec || pole[i]) return;
      if (rezim !== "offline" && hrac !== moje) return;
      tah(i, rezim === "online");
    });
    deska.appendChild(b);
    return b;
  });
  ukazStav();
}

// Kolik značek by bylo v nejdelší řadě přes políčko i, kdyby tam stála značka znak.
function delkaRady(i, znak) {
  const r = Math.floor(i / N);
  const c = i % N;
  const smery = [[0, 1], [1, 0], [1, 1], [1, -1]];
  let nejvic = 0;
  for (const [dr, dc] of smery) {
    let pocet = 1;
    for (const s of [1, -1]) {
      let rr = r + dr * s;
      let cc = c + dc * s;
      while (rr >= 0 && rr < N && cc >= 0 && cc < N && pole[rr * N + cc] === znak) {
        pocet++;
        rr += dr * s;
        cc += dc * s;
      }
    }
    nejvic = Math.max(nejvic, pocet);
  }
  return nejvic;
}

function vyhra(i) {
  return delkaRady(i, hrac) >= CIL;
}

function tah(i, odeslat) {
  if (konec || pole[i]) return;
  pole[i] = hrac;
  tlacitka[i].textContent = hrac;
  if (odeslat) spojeni.send({ typ: "tah", i: i });
  if (vyhra(i)) {
    if (rezim === "offline") stav.textContent = "Vyhrál " + hrac + "! 🎉";
    else if (hrac === moje) stav.textContent = "Vyhrál jsi! 🎉";
    else stav.textContent = rezim === "bot" ? "Bot vyhrál 🤖" : "Soupeř vyhrál 😅";
    konec = true;
  } else if (pole.every(p => p)) {
    stav.textContent = "Remíza 🤝";
    konec = true;
  } else {
    hrac = hrac === "X" ? "O" : "X";
    ukazStav();
    if (rezim === "bot" && hrac !== moje) {
      casovacBota = setTimeout(tahBota, 500);
    }
  }
}

function tahBota() {
  const ja = hrac;
  const souper = ja === "X" ? "O" : "X";
  let nejlepsi = -1;
  let nejlepsiSkore = -1;
  pole.forEach((p, i) => {
    if (p) return;
    const mojeRada = delkaRady(i, ja);
    const jehoRada = delkaRady(i, souper);
    let skore;
    // 1. můžu vyhrát, 2. musím zablokovat, 3. jinak stavím svoje řady a kazím soupeřovy
    if (mojeRada >= CIL) skore = 1000;
    else if (jehoRada >= CIL) skore = 500;
    else skore = mojeRada * 10 + jehoRada * 8;
    // trocha náhody, ať bot nehraje pořád stejně
    skore += Math.random() * 5;
    if (skore > nejlepsiSkore) {
      nejlepsiSkore = skore;
      nejlepsi = i;
    }
  });
  tah(nejlepsi, false);
}

function nastavSpojeni(c) {
  spojeni = c;
  c.on("data", d => {
    if (spojeni !== c) return;
    if (d.typ === "tah") tah(d.i, false);
    if (d.typ === "znovu") novaHra(false);
  });
  c.on("close", () => {
    if (spojeni !== c) return;
    konec = true;
    stav.textContent = "Soupeř se odpojil";
  });
}

function start(r) {
  rezim = r;
  uvod.hidden = true;
  hra.hidden = false;
  novaHra(false);
}

function doMenu() {
  clearTimeout(casovacBota);
  spojeni = null;
  if (peer) peer.destroy();
  peer = null;
  zprava.textContent = "";
  hra.hidden = true;
  uvod.hidden = false;
}

function vytvor() {
  if (peer) peer.destroy();
  const kod = String(Math.floor(1000 + Math.random() * 9000));
  moje = "X";
  peer = new Peer("pisk-" + kod);
  peer.on("open", () => {
    zprava.textContent = "Kód hry: " + kod + ". Pošli ho kamarádovi a počkej, až se připojí.";
  });
  peer.on("connection", c => {
    c.on("open", () => {
      // třetího hráče už nepustíme
      if (spojeni) {
        c.close();
        return;
      }
      nastavSpojeni(c);
      start("online");
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
  if (peer) peer.destroy();
  moje = "O";
  zprava.textContent = "Připojuji...";
  peer = new Peer();
  peer.on("open", () => {
    const c = peer.connect("pisk-" + kod);
    c.on("open", () => {
      nastavSpojeni(c);
      start("online");
    });
  });
  peer.on("error", e => {
    zprava.textContent = e.type === "peer-unavailable"
      ? "Hra s tímto kódem neexistuje."
      : "Chyba: " + e.type;
  });
}

document.getElementById("offline").addEventListener("click", () => start("offline"));
document.getElementById("bot").addEventListener("click", () => {
  moje = "X";
  start("bot");
});
document.getElementById("vytvorit").addEventListener("click", vytvor);
document.getElementById("pripojit").addEventListener("click", pripoj);
document.getElementById("znovu").addEventListener("click", () => novaHra(true));
document.getElementById("menu").addEventListener("click", doMenu);
