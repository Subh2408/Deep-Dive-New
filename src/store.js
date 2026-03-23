import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Screen routing
  screen: 'intro',
  setScreen: screen => set({ screen }),

  // Journey state
  theme: null,
  qi: 0,
  answers: [],
  leafUsed: false,
  myTrail: [],
  sharedQuestion: '',

  // Visual state
  depthVal: 0,
  aiLoading: false,
  cameraZ: 0,
  cameraZTarget: 0,
  cameraZStart: 0,
  cameraZAnimTs: 0,

  // Actions
  startTheme: name => set({
    theme: name,
    qi: 0,
    answers: [],
    leafUsed: false,
    myTrail: [],
    sharedQuestion: '',
    depthVal: 0,
    aiLoading: false,
    cameraZ: 0,
    cameraZTarget: 0,
    cameraZStart: 0,
    screen: 'fork',
  }),

  recordAnswer: (answer, side) => set(s => ({
    answers: [...s.answers, answer],
    myTrail: [...s.myTrail, side || (answer.leaf ? 'leaf' : 'left')],
  })),

  advanceQuestion: () => set(s => ({
    qi: s.qi + 1,
    depthVal: Math.min(1, (s.qi + 1) / 9.5),
  })),

  setSharedQuestion: q => set({ sharedQuestion: q }),
  setAiLoading: v => set({ aiLoading: v }),
  setLeafUsed: () => set({ leafUsed: true }),

  walkForward: () => set(s => ({
    cameraZStart: s.cameraZ,
    cameraZTarget: Math.min(1, s.cameraZTarget + 1 / 10),
    cameraZAnimTs: performance.now(),
  })),

  updateCameraZ: z => set({ cameraZ: z }),

  restart: () => set({
    screen: 'intro',
    theme: null,
    qi: 0,
    answers: [],
    leafUsed: false,
    myTrail: [],
    sharedQuestion: '',
    depthVal: 0,
    aiLoading: false,
    cameraZ: 0,
    cameraZTarget: 0,
    cameraZStart: 0,
  }),
}))
