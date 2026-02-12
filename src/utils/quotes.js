export const dialogues = [
    { text: "Utha le re baba, utha le! Mere ko nahi, in gareebon ko utha le!", character: "Babu Bhaiya" },
    { text: "Paisa hi paisa hoga!", character: "Raju" },
    { text: "Bilkul ricks nahi lene ka!", character: "Babu Bhaiya" },
    { text: "Khopdi tod saale ka!", character: "Babu Bhaiya" },
    { text: "Yeh Baburao ka style hai!", character: "Babu Bhaiya" },
    { text: "Tu ja yahan se, ye scheme tere liye nahi hai!", character: "Raju" },
    { text: "150 rupiya dega!", character: "Kachra Seth" },
    { text: "Aae shyaam! Inko samjha na re!", character: "Babu Bhaiya" },
    { text: "Dene wala jab bhi deta, deta chhappar phaad ke!", character: "Chorus" },
    { text: "Kutreya saala! Dekh ke number dial kar!", character: "Babu Bhaiya" },
    { text: "Mast plan hai!", character: "Raju" },
    { text: "Chilla chilla ke sabko scheme bata de!", character: "Raju" },
    { text: "Golmaal hai bhai sab golmaal hai!", character: "Theme" },
    { text: "Abhi maza aayega na bhidu!", character: "Meme" },
]

export const getRandomDialogue = () => {
    const randomIndex = Math.floor(Math.random() * dialogues.length);
    return dialogues[randomIndex];
}
