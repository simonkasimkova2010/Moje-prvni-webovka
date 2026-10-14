const uvod = document.getElementById("uvod");
const hra = document.getElementById("hra");
const deska = document.getElementById("deska");
const stav = document.getElementById("stav");
const vyhry = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let pole, hrac, konec;

function novaHra() {
  pole = Array(9).fill("");
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

function tah(i, b) {
  if (konec || pole[i]) return;
  pole[i] = hrac;
  b.textContent = hrac;
  if (vyhry.some(v => v.every(k => pole[k] === hrac))) {
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
