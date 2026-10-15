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
let pole, hrac, konec, moje, spojeni, peer, tlacitka;
let rezim = "offline";

function ukazOkno(text) {
  setTimeout(() => {
    if (!konec) return;
    oknoText.textContent = text;
    okno.hidden = false;
  }, 400);
}

function ukazStav() {
  if (konec) return;
  if (rezim === "offline") {
    stav.textContent = "Na tahu: " + hrac;
  } else {
    stav.textContent = hrac === moje
      ? "Jsi na tahu (" + hrac + ")"
      : "Hraje soupeř (" + hrac + ")";
  }
}

function novaHra(odeslat) {
  if (odeslat && spojeni) spojeni.send({ typ: "znovu" });
  okno.hidden = true;
  pole = Array(N * N).fill("");
  hrac = "X";
  konec = false;
  deska.innerHTML = "";
  tlacitka = pole.map((_, i) => {
    const b = document.createElement("button");
    b.className = "policko";
    b.addEventListener("click", () => {
      if (konec || pole[i]) return;
      if (rezim === "online" && hrac !== moje) return;
      tah(i, rezim === "online");
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
    konec = true;
    if (rezim === "offline") {
      stav.textContent = "Vyhrál " + hrac + "! 🎉";
      ukazOkno("Gratuluji, vyhrál hráč " + hrac + "🎉");
    } else if (hrac === moje) {
      stav.textContent = "Vyhrál jsi! 🎉";
      ukazOkno("Gratuluji, vyhrál jsi🎉");
    } else {
      stav.textContent = "Soupeř vyhrál 😅";
      ukazOkno("Prohrál jsi, zkus to znova🍀");
    }
  } else if (pole.every(p => p)) {
    konec = true;
    stav.textContent = "Remíza 🤝";
    ukazOkno("Remíza🤝");
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
    okno.hidden = true;
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
document.getElementById("vytvorit").addEventListener("click", vytvor);
document.getElementById("pripojit").addEventListener("click", pripoj);
document.getElementById("znovu").addEventListener("click", () => novaHra(rezim === "online"));
document.getElementById("menu").addEventListener("click", () => location.reload());
document.getElementById("oknoZnovu").addEventListener("click", () => novaHra(rezim === "online"));
document.getElementById("oknoKonec").addEventListener("click", () => location.reload());
