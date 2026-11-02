export type Stop = {offset: number; color: string};

export const STOPS: Stop[] = [
  {offset: 0, color: '#340B05'},
  {offset: 0.183, color: '#0358F7'},
  {offset: 0.284, color: '#5092C7'},
  {offset: 0.413, color: '#E1ECFE'},
  {offset: 0.587, color: '#FFD400'},
  {offset: 0.683, color: '#FA3D1D'},
  {offset: 0.803, color: '#FD02F5'},
  {offset: 1, color: '#FFC0FD00'},
];

export const PALETTES: Record<string, Stop[]> = {
  Peak: STOPS,
  Ocean: [{offset: 0, color: '#05122E'}, {offset: 0.22, color: '#0358F7'}, {offset: 0.45, color: '#19C3D6'}, {offset: 0.62, color: '#A8F0E0'}, {offset: 0.8, color: '#7B61FF'}, {offset: 1, color: '#C0E8FF00'}],
  Sunset: [{offset: 0, color: '#2A0A05'}, {offset: 0.24, color: '#7A1F12'}, {offset: 0.46, color: '#FA3D1D'}, {offset: 0.64, color: '#FFD400'}, {offset: 0.82, color: '#FF7AD9'}, {offset: 1, color: '#FFC0FD00'}],
  Aurora: [{offset: 0, color: '#021018'}, {offset: 0.22, color: '#0B6E4F'}, {offset: 0.44, color: '#1FD18E'}, {offset: 0.64, color: '#9CF6C8'}, {offset: 0.82, color: '#56D6E8'}, {offset: 1, color: '#CFFAF200'}],
  Candy: [{offset: 0, color: '#FF7AB6'}, {offset: 0.26, color: '#FFA1D2'}, {offset: 0.5, color: '#C9A8FF'}, {offset: 0.7, color: '#A7D8FF'}, {offset: 0.86, color: '#FFF3B0'}, {offset: 1, color: '#FFFFFF00'}],
  Ember: [{offset: 0, color: '#1A0400'}, {offset: 0.28, color: '#8E1600'}, {offset: 0.52, color: '#FF4D00'}, {offset: 0.72, color: '#FF9E1B'}, {offset: 0.88, color: '#FFE7A3'}, {offset: 1, color: '#FFF6E000'}],
  Mono: [{offset: 0, color: '#0A1A4A'}, {offset: 0.35, color: '#2B5BFF'}, {offset: 0.62, color: '#6E97FF'}, {offset: 0.82, color: '#BBD0FF'}, {offset: 1, color: '#E8F0FF00'}],
};

export const BARS = 9;
export const BLUR = 15;
export const PEAK = 0.98;
export const VALLEY = 0.55;
export const RISE_MS = 1100;
export const GROUND = '#ffffff';
