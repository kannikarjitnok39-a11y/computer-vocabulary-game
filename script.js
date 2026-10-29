
const levels = [
  [["CPU","หน่วยประมวลผลกลาง"],["Keyboard","แป้นพิมพ์"],["Monitor","จอภาพ"],["Mouse","เมาส์"],["Printer","เครื่องพิมพ์"]],
  [["Software","ซอฟต์แวร์"],["Hardware","อุปกรณ์คอมพิวเตอร์"],["Memory","หน่วยความจำ"],["Browser","โปรแกรมท่องเว็บ"],["Network","เครือข่าย"]],
  [["Database","ฐานข้อมูล"],["Password","รหัสผ่าน"],["Download","ดาวน์โหลด"],["Upload","อัปโหลด"],["Algorithm","ขั้นตอนวิธี"]],
  [["Operating System","ระบบปฏิบัติการ"],["Application","แอปพลิเคชัน"],["Cybersecurity","ความปลอดภัยไซเบอร์"],["Cloud Computing","การประมวลผลบนคลาวด์"],["Artificial Intelligence","ปัญญาประดิษฐ์"]]
];

const $ = id => document.getElementById(id);
let level=0, score=0, lives=3, timeLeft=60;
let matched=0, attempts=0, correctPairs=0;
let selectedEnglish=null, selectedThai=null, timerId=null;
let gameActive=false, soundOn=true, audioCtx=null;

function showScreen(id){
  ["homeScreen","gameScreen","resultScreen"].forEach(s=>
    $(s).classList.toggle("active",s===id));
}
function sound(type){
  if(!soundOn)return;
  try{
    audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    osc.connect(gain);gain.connect(audioCtx.destination);
    const notes={good:[660,880],bad:[180,130],click:[440],win:[523,659,784],lose:[330,220]};
    const seq=notes[type]||notes.click,t=audioCtx.currentTime;
    seq.forEach((f,i)=>osc.frequency.setValueAtTime(f,t+i*.11));
    gain.gain.setValueAtTime(.06,t);
    gain.gain.exponentialRampToValueAtTime(.001,t+seq.length*.12);
    osc.start(t);osc.stop(t+seq.length*.12);
  }catch(e){}
}
let musicOn = false;
let musicGain = null;
let musicTimer = null;
let musicStep = 0;

function startMusic() {
  if (musicOn) return;

  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume();

    musicOn = true;
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.30;
    musicGain.connect(audioCtx.destination);

    const chords = [
      [261.63, 329.63, 392.00],
      [220.00, 261.63, 329.63],
      [174.61, 220.00, 261.63],
      [196.00, 246.94, 293.66]
    ];

    function playChord() {
      if (!musicOn || !musicGain) return;

      const chord = chords[musicStep % chords.length];
      musicStep++;

      chord.forEach((frequency, index) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.value = frequency;
        osc.connect(noteGain);
        noteGain.connect(musicGain);

        const now = audioCtx.currentTime;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(0.025, now + 0.25);
        noteGain.gain.linearRampToValueAtTime(0.0001, now + 1.7);

        osc.start(now);
        osc.stop(now + 1.8);
      });
    }

    playChord();
    musicTimer = setInterval(playChord, 1800);

    $("musicToggle").textContent = "🎵 ปิดเพลง";
  } catch (error) {
    musicOn = false;
  }
}

function stopMusic() {
  musicOn = false;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }

  if (musicGain && audioCtx) {
    musicGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    musicGain = null;
  }

  $("musicToggle").textContent = "🎵 เปิดเพลง";
}

$("musicToggle").onclick = () => {
  if (musicOn) {
    stopMusic();
  } else {
    startMusic();
  }
};
$("soundToggle").onclick=()=>{
  soundOn=!soundOn;
  $("soundToggle").textContent=soundOn?"🔊 เสียงเปิด":"🔇 เสียงปิด";
  if(soundOn)sound("click");
};
$("startBtn").onclick=startGame;
$("againBtn").onclick=startGame;
$("menuBtn").onclick=()=>{
  stopTimer();gameActive=false;showScreen("homeScreen");
};
$("homeBtn").onclick=()=>{
  if(confirm("ต้องการออกจากเกมหรือไม่?")){
    endGame(false,"ออกจากเกม");
  }
};

function stopTimer(){
  if(timerId){clearInterval(timerId);timerId=null;}
}
function startGame(){
  stopTimer();
  level=0;score=0;lives=3;timeLeft=60;
  attempts=0;correctPairs=0;gameActive=true;
  $("timer").style.color="";
  showScreen("gameScreen");
  loadLevel();startTimer();sound("click");
}


function startTimer(){
  timerId=setInterval(()=>{
    if(!gameActive)return;
    timeLeft--;
    $("timer").textContent=timeLeft;
    $("timer").style.color=timeLeft<=10?"#ff4d6d":"";

    if(timeLeft<=10 && timeLeft>0){
      sound("bad");
    }

    if(timeLeft<=0){
      endGame(false,"หมดเวลา!");
    }
  },1000);
}

function shuffle(a){
  a=[...a];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function loadLevel(){
  matched=0;selectedEnglish=null;selectedThai=null;
  $("levelTitle").textContent=`ด่าน ${level+1}/${levels.length}`;
  $("score").textContent=score;
  $("lives").textContent="❤️".repeat(lives)+"🖤".repeat(3-lives);
  $("timer").textContent=timeLeft;
  $("progress").textContent=`0/${levels[level].length}`;
  $("progressBar").style.width="0%";
  $("feedback").className="feedback";
  $("feedback").textContent="เลือกคำศัพท์ภาษาอังกฤษ แล้วเลือกความหมายภาษาไทย";
  $("englishCards").innerHTML="";
  $("thaiCards").innerHTML="";
  shuffle(levels[level].map((p,i)=>({word:p[0],pair:i})))
    .forEach(x=>$("englishCards").appendChild(makeCard(x,"en")));
  shuffle(levels[level].map((p,i)=>({word:p[1],pair:i})))
    .forEach(x=>$("thaiCards").appendChild(makeCard(x,"th")));
}
function makeCard(item,side){
  const b=document.createElement("button");
  b.className="word-card";b.textContent=item.word;
  b.dataset.pair=item.pair;b.dataset.side=side;
  b.onclick=()=>chooseCard(b);
  return b;
}
function chooseCard(card){
  if(!gameActive||card.disabled||card.classList.contains("matched"))return;
  sound("click");
  if(card.dataset.side==="en"){
    if(selectedEnglish)selectedEnglish.classList.remove("selected");
    selectedEnglish=card;card.classList.add("selected");
  }else{
    if(selectedThai)selectedThai.classList.remove("selected");
    selectedThai=card;card.classList.add("selected");
  }
  if(selectedEnglish&&selectedThai)checkMatch();
}
function checkMatch(){
  attempts++;
  const en=selectedEnglish,th=selectedThai;
  if(en.dataset.pair===th.dataset.pair){
    en.classList.remove("selected");th.classList.remove("selected");
    en.classList.add("matched");th.classList.add("matched");
    en.disabled=true;th.disabled=true;
    matched++;correctPairs++;
    score+=100+Math.max(0,timeLeft);
    $("score").textContent=score;
    $("progress").textContent=`${matched}/${levels[level].length}`;
    $("progressBar").style.width=
      `${matched/levels[level].length*100}%`;
    $("feedback").className="feedback success";
    $("feedback").textContent="ถูกต้อง! ได้คะแนนเพิ่ม ✨";
    sound("good");
    selectedEnglish=null;selectedThai=null;
    if(matched===levels[level].length){
      if(level===levels.length-1){
        setTimeout(()=>endGame(true,"คุณผ่านทุกด่านแล้ว!"),650);
      }else{
        score+=200;level++;
        $("feedback").textContent="ผ่านด่าน! โบนัส 200 คะแนน";
        $("score").textContent=score;
        setTimeout(()=>{if(gameActive)loadLevel();},850);
      }
    }
  }else{
    lives--;
    $("lives").textContent="❤️".repeat(lives)+"🖤".repeat(3-lives);
    en.classList.add("wrong");th.classList.add("wrong");
    $("feedback").className="feedback error";
    $("feedback").textContent="ยังไม่ถูก ลองอีกครั้งนะ";
    sound("bad");
    selectedEnglish=null;selectedThai=null;
    setTimeout(()=>{
      en.classList.remove("wrong","selected");
      th.classList.remove("wrong","selected");
    },450);
    if(lives<=0)setTimeout(()=>{
      endGame(false,"หัวใจหมดแล้ว! ลองใหม่อีกครั้งนะ");
    },500);
  }
}
function endGame(won,message){
  if(!gameActive)return;
  gameActive=false;stopTimer();showScreen("resultScreen");
  $("resultIcon").textContent=won?"🏆":timeLeft<=0?"⏰":"💡";
  $("resultTitle").textContent=won?"ยอดเยี่ยมมาก!":"จบภารกิจ";
  $("resultMessage").textContent=message;
  $("finalScore").textContent=score;
  $("finalCorrect").textContent=correctPairs;
  $("finalLevel").textContent=won?levels.length:level+1;
  $("finalAccuracy").textContent=
    (attempts?Math.round(correctPairs/attempts*100):0)+"%";
  sound(won?"win":"lose");
}
