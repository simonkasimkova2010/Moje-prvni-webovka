const uvod = document.getElementById("uvod");
const hra = document.getElementById("hra");
const deska = document.getElementById("deska");
const stav = document.getElementById("stav");
const N = 8;
const CIL = 3;
let pole, hrac, konec;

function novaHra() {
  pole = Array(N * N).fill("");
  hrac = "X";
  konec = false;
  stav.textContent = "Hraje X";
  deska.innerHTML = "";
  pole.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "policko";
    b.addEventListener("click", () => tah(i, b));
    deska.appendChild(b);
  });
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

function tah(i, b) {
  if (konec || pole[i]) return;
  pole[i] = hrac;
  b.textContent = hrac;
  if (vyhra(i)) {
    stav.textContent = "Vyhrál " + hrac + "! 🎉";
    konec = true;
  } else if (pole.every(p => p)) {
    stav.textContent = "Remíza 🤝";
    konec = true;
  } else {
    hrac = hrac === "X" ? "O" : "X";
    stav.textContent = "Hraje " + hrac;
  }
}

document.getElementById("tlacitko").addEventListener("click", () => {
  uvod.hidden = true;
  hra.hidden = false;
  novaHra();
});
document.getElementById("znovu").addEventListener("click", novaHra);
