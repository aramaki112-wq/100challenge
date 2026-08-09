import test from "node:test";
import assert from "node:assert/strict";
import { initialPosition, normalizedMove } from "./ReplayTestHelpers.js";
import { UsiPositionMapper } from "./UsiPositionMapper.js";

const mapper = new UsiPositionMapper();
test("平手初期局面を標準SFENへ変換する", () => assert.equal(mapper.toSfen(initialPosition()), "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1"));
test("通常指し手をUSI Moveへ変換する", () => assert.equal(mapper.moveToUsi(normalizedMove(1, "７六歩(77)")), "7g7f"));
test("成りをUSI Moveへ変換する", () => assert.equal(mapper.moveToUsi(normalizedMove(1, "２二角成(88)")), "8h2b+"));
test("駒打ちをUSI Moveへ変換する", () => assert.equal(mapper.moveToUsi(normalizedMove(1, "５五角打")), "B*5e"));
