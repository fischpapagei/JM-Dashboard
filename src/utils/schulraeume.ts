import { getJvaById, JVAS } from '../data/jvas';
import type { SchoolRoom } from '../types/domain';

export interface SchulraumRow {
  key: string;
  kind: 'room' | 'jva-sum' | 'total';
  jvaId: string;
  jvaName: string;
  showJva: boolean;
  jvaSpan: number;
  designation: string;
  roomCount: number;
  squareMeters: number;
  elisFlag: number;
  schoolSeats: number;
}

export interface SchulraumTable {
  rows: SchulraumRow[];
  totals: {
    roomCount: number;
    squareMeters: number;
    elisFlag: number;
    schoolSeats: number;
  };
}

function roomTotals(rooms: SchoolRoom[]) {
  return rooms.reduce(
    (totals, room) => ({
      roomCount: totals.roomCount + room.roomCount,
      squareMeters: totals.squareMeters + room.squareMeters,
      elisFlag: totals.elisFlag + (room.isElis ? 1 : 0),
      schoolSeats: totals.schoolSeats + room.schoolSeats,
    }),
    { roomCount: 0, squareMeters: 0, elisFlag: 0, schoolSeats: 0 },
  );
}

export function buildSchulraumTable(rooms: SchoolRoom[]): SchulraumTable {
  const rows: SchulraumRow[] = [];
  const grand = { roomCount: 0, squareMeters: 0, elisFlag: 0, schoolSeats: 0 };

  for (const jva of [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de'))) {
    const jvaRooms = rooms
      .filter((room) => room.jvaId === jva.id)
      .slice()
      .sort((a, b) => a.designation.localeCompare(b.designation, 'de-DE'));
    if (jvaRooms.length === 0) continue;

    const totals = roomTotals(jvaRooms);
    grand.roomCount += totals.roomCount;
    grand.squareMeters += totals.squareMeters;
    grand.elisFlag += totals.elisFlag;
    grand.schoolSeats += totals.schoolSeats;

    jvaRooms.forEach((room, index) => {
      rows.push({
        key: room.id,
        kind: 'room',
        jvaId: jva.id,
        jvaName: getJvaById(jva.id)?.name ?? jva.name,
        showJva: index === 0,
        jvaSpan: jvaRooms.length,
        designation: room.designation,
        roomCount: room.roomCount,
        squareMeters: room.squareMeters,
        elisFlag: room.isElis ? 1 : 0,
        schoolSeats: room.schoolSeats,
      });
    });

    rows.push({
      key: `${jva.id}-sum`,
      kind: 'jva-sum',
      jvaId: jva.id,
      jvaName: jva.name,
      showJva: false,
      jvaSpan: 1,
      designation: `Summe ${jva.name}`,
      roomCount: totals.roomCount,
      squareMeters: totals.squareMeters,
      elisFlag: totals.elisFlag,
      schoolSeats: totals.schoolSeats,
    });
  }

  if (rows.length === 0) {
    return { rows, totals: grand };
  }

  rows.push({
    key: 'gesamtsumme',
    kind: 'total',
    jvaId: '',
    jvaName: '',
    showJva: false,
    jvaSpan: 1,
    designation: 'Gesamtsumme',
    roomCount: grand.roomCount,
    squareMeters: grand.squareMeters,
    elisFlag: grand.elisFlag,
    schoolSeats: grand.schoolSeats,
  });

  return { rows, totals: grand };
}
