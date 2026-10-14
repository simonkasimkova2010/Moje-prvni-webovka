const uvod = document.getElementById("uvod");
const hra = document.getElementById("hra");
const deska = document.getElementById("deska");
const stav = document.getElementById("stav");
const zprava = document.getElementById("zprava");
const kodInput = document.getElementById("kod");
const N = 8;
const CIL = 3;
let pole, hrac, konec, moje, spojeni, peer, tlacitka;

function ukazStav() {
  if (konec) return;
  stav.textContent = hrac === moje
    ? "Jsi na tahu (" + hrac + ")"
    : "Hraje soupeř (" + hrac + ")";
}

function novaHra(odeslat) {
  if (odeslat && spojeni) spojeni.send({ typ: "znovu" });
  pole = Array(N * N).fill("");
  hrac = "X";
  konec = false;
  deska.innerHTML = "";
  tlacitka = pole.map((_, i) => {
    const b = document.createElement("button");
    b.className = "policko";
    b.addEventListener("click", () => {
      if (konec || hrac !== moje || pole[i]) return;
      tah(i, true);
    });
    deska.appendChild(b);
    return b;
  });
  ukazStav();
}

function vyhra(i) {
  const r = Math.floor(i / N);
  const c = i % N;
  const smery = [[0, 1], [1, 0], [1, 1], [1, -1]];
  return smery.some(([dr, dc]) => {
    let pocet = 1;
    for (const s of [1, -1]) {
      let rr = r + dr * s;
      let cc = c + dc * s;
      while (rr >= 0 && rr < N && cc >= 0 && cc < N && pole[rr * N + cc] === hrac) {
        pocet++;
        rr += dr * s;
        cc += dc * s;
      }
    }
    return pocet >= CIL;
  });
}

function tah(i, odeslat) {
  if (konec || pole[i]) return;
  pole[i] = hrac;
  tlacitka[i].textContent = hrac;
  if (odeslat) spojeni.send({ typ: "tah", i: i });
  if (vyhra(i)) {
    stav.textContent = hrac === moje ? "Vyhrál jsi! 🎉" : "Soupeř vyhrál 😅";
    konec = true;
  } else if (pole.every(p => p)) {
    stav.textContent = "Remíza 🤝";
    konec = true;
  } else {
    hrac = hrac === "X" ? "O" : "X";
    ukazStav();
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
    stav.textContent = "Soupeř se odpojil";
  });
}

function start() {
  uvod.hidden = true;
  hra.hidden = false;
  novaHra(false);
}

function vytvor() {
  const kod = String(Math.floor(1000 + Math.random() * 9000));
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

document.getElementById("vytvorit").addEventListener("click", vytvor);
document.getElementById("pripojit").addEventListener("click", pripoj);
document.getElementById("znovu").addEventListener("click", () => novaHra(true));
