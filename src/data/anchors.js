// 5 anchor questions per theme — AI takes over from Q6 onward
export const anchors = {
  Desire: [
    { q: "Is there something you want so badly you've stopped admitting it, even to yourself?", l: "Yes — I know exactly what it is", r: "I'm not sure I'd recognise it if I saw it" },
    { q: "When you imagine getting what you most want, what's the feeling underneath the wanting?", l: "Relief — like something finally makes sense", r: "Fear — like it would change too much" },
    { q: "Have you ever chosen to want something different, rather than pursue what you actually wanted?", l: "Yes — and I think I was right to", r: "Yes — and I'm not sure I was" },
    { q: "Is there something you want that you've never told anyone — not because it's shameful, but because saying it out loud would make it real?", l: "Yes — and I'm not ready for it to be real", r: "Yes — and maybe that's why I haven't said it" },
    { q: "If you got everything you wanted, what's the first thing you'd worry about next?", l: "That I'd want something else", r: "That I wouldn't know who I was anymore" },
  ],
  Mortality: [
    { q: "Do you think about your own death more or less than most people do?", l: "More — it's often close to the surface", r: "Less — I keep it at a distance" },
    { q: "What has the awareness of death changed about how you live?", l: "It's made me bolder", r: "It's made me more careful" },
    { q: "Is there something you're waiting to do until you're ready — that you suspect you'll never be ready for?", l: "Yes — and I think about it often", r: "Maybe — but I haven't named it yet" },
    { q: "Is there someone you'd want to speak to before you died — and haven't yet?", l: "Yes — and I know why I haven't", r: "Yes — and I've been telling myself there's time" },
    { q: "What do you think happens to the things you never said?", l: "They stay inside you, changing shape", r: "They disappear — which is its own kind of answer" },
  ],
  Belonging: [
    { q: "Is there a version of yourself that only one or two people have ever seen?", l: "Yes — and I protect it", r: "Yes — and I wish more people could" },
    { q: "Have you ever left somewhere you belonged because staying felt like disappearing?", l: "Yes — I know that trade-off", r: "No — I've stayed even when it cost me" },
    { q: "Do you think the people who love you know who you actually are?", l: "Some of them do", r: "Not really — and that's partly my doing" },
    { q: "Is there a place — physical or otherwise — where you've felt most like yourself?", l: "Yes — and I can't always get back there", r: "Yes — and I carry it with me" },
    { q: "Have you ever performed belonging — acted like you were part of something — when you weren't sure you really were?", l: "Yes — and sometimes the performance became real", r: "Yes — and I never stopped feeling like an observer" },
  ],
  Identity: [
    { q: "Is there a version of yourself you grew out of — that you sometimes miss?", l: "Yes — I left something real behind", r: "No — each version felt necessary" },
    { q: "Which matters more: being understood, or being free to be misunderstood?", l: "Being understood", r: "Being free to be misunderstood" },
    { q: "Is there something true about you that contradicts the image you project?", l: "Yes — and the gap is exhausting", r: "Yes — and the gap is protective" },
    { q: "How much of who you are was chosen, and how much just happened to you?", l: "More was chosen than it looks", r: "Less was chosen than I'd like to think" },
    { q: "Is there a story you tell about yourself that you're no longer sure is true?", l: "Yes — and I keep telling it anyway", r: "Yes — and I've quietly stopped telling it" },
  ],
  Memory: [
    { q: "Is there a memory you return to so often you've started to wonder if you've changed it?", l: "Yes — I can feel where the edges blur", r: "Yes — and I've decided it doesn't matter" },
    { q: "Is there something you clearly remember that no one else seems to?", l: "Yes — and I've stopped bringing it up", r: "Yes — and I wonder whose version is real" },
    { q: "If you could erase one memory, would you?", l: "Yes — there's one I'd gladly lose", r: "No — even the worst ones are mine" },
    { q: "Is there a period of your life you've never fully processed — that you orbit without landing on?", l: "Yes — and I know exactly what it is", r: "Yes — and I'm not sure I'm ready to land" },
    { q: "Do you think who you are now is continuous with who you were ten years ago, or has someone else taken over?", l: "Continuous — the same thread runs through", r: "Someone else — I barely recognise that person" },
  ],
  Fear: [
    { q: "What's something you're afraid of that isn't really about the thing itself?", l: "I know what it's actually about", r: "I'm not sure I've looked closely enough" },
    { q: "Has a fear ever protected you from something that would have been good for you?", l: "Yes — I can see that now", r: "Maybe — I can't always tell the difference" },
    { q: "Is there something you're braver about than most — and something you're more afraid of?", l: "Yes — and the two are connected", r: "Yes — but I don't think they're connected" },
    { q: "Is there a fear you've had so long it's started to feel like a personality trait?", l: "Yes — and I've almost stopped fighting it", r: "Yes — and I'm not sure I want to lose it" },
    { q: "What would you do differently if you weren't afraid of how it would look?", l: "Something I've been waiting a long time to do", r: "Something smaller than you'd expect" },
  ],
  Connection: [
    { q: "Is there someone you've drifted from — not through conflict, just through time — that you still think about?", l: "Yes — and I know why it drifted", r: "Yes — and I still don't understand how" },
    { q: "When you feel most connected to someone, what makes it feel that way?", l: "Being fully known", r: "Choosing each other, again and again" },
    { q: "Do you give more than you receive, or receive more than you give?", l: "I give more — and I've made peace with that", r: "I receive more — and I carry that" },
    { q: "Is there a conversation you've been meaning to have that you keep finding reasons to delay?", l: "Yes — and I know exactly what's in the way", r: "Yes — and I'm not sure I know how to start it" },
    { q: "Have you ever felt most alone in the middle of a crowd of people who were supposed to be your people?", l: "Yes — and I still don't fully understand why", r: "Yes — and it changed something about how I connect" },
  ],
  Purpose: [
    { q: "Is there something you do that you'd do even if no one ever knew about it?", l: "Yes — it feels like the truest thing", r: "I'm not sure — witness might matter to me" },
    { q: "Do you think purpose is something you find, or something you build?", l: "Find — something already there", r: "Build — you make it from what you have" },
    { q: "Is there something you believed was your purpose that you've had to let go of?", l: "Yes — and something better arrived", r: "Yes — and I'm still figuring out what replaced it" },
    { q: "Is there a version of your life where you would have been more useful to the world — and did you choose against it?", l: "Yes — and I've made my peace with that", r: "Maybe — I'm not sure the other version would have been happier" },
    { q: "What would it mean to live in a way you wouldn't need to justify?", l: "Complete freedom — which is frightening", r: "A quiet life, mostly — which surprises me" },
  ],
}
