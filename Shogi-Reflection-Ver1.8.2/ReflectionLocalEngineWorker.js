/*
 * Shogi Reflection Local Engine 1.0.0
 * First-party, lightweight local USI-compatible analysis worker.
 * Purpose: stable review-candidate assistance, not maximum playing strength.
 * No network access and no external model/weight files.
 */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const VALUES = Object.freeze({ P:100, L:300, N:320, S:400, G:500, B:700, R:850, K:0 });
  const PROMOTION_BONUS = Object.freeze({ P:420, L:220, N:200, S:120, B:180, R:220 });
  const PROMOTABLE = new Set(["P", "L", "N", "S", "B", "R"]);
  const HAND_ORDER = ["R", "B", "G", "S", "N", "L", "P"];
  const options = { MultiPV: 3, Threads: 1, USI_Hash: 16 };
  let currentPosition = null;
  let activeSearchToken = null;

  function emit(line) { self.postMessage({ line: String(line) }); }
  function other(side) { return side === "b" ? "w" : "b"; }
  function inside(file, rank) { return file >= 1 && file <= 9 && rank >= 1 && rank <= 9; }
  function key(file, rank) { return `${file}${rank}`; }
  function cloneHands(hands) {
    return { b: { ...hands.b }, w: { ...hands.w } };
  }
  function cloneState(state) {
    const board = new Map();
    for (const [square, piece] of state.board) board.set(square, { ...piece });
    return { board, hands: cloneHands(state.hands), side: state.side, moveNumber: state.moveNumber };
  }

  function parseSfen(sfen) {
    const parts = String(sfen).trim().split(/\s+/);
    if (parts.length < 4) throw new Error("invalid sfen");
    const [boardPart, side, handPart, moveNumberRaw] = parts;
    const ranks = boardPart.split("/");
    if (ranks.length !== 9 || !["b", "w"].includes(side)) throw new Error("invalid sfen");
    const board = new Map();
    for (let rank = 1; rank <= 9; rank += 1) {
      let file = 9;
      let promoted = false;
      for (const char of ranks[rank - 1]) {
        if (/\d/.test(char)) { file -= Number(char); continue; }
        if (char === "+") { promoted = true; continue; }
        const upper = char.toUpperCase();
        board.set(key(file, rank), { type: upper, side: char === upper ? "b" : "w", promoted });
        promoted = false;
        file -= 1;
      }
      if (file !== 0) throw new Error("invalid sfen row");
    }
    const hands = { b: {}, w: {} };
    if (handPart !== "-") {
      let digits = "";
      for (const char of handPart) {
        if (/\d/.test(char)) { digits += char; continue; }
        const upper = char.toUpperCase();
        const owner = char === upper ? "b" : "w";
        hands[owner][upper] = (hands[owner][upper] || 0) + (digits ? Number(digits) : 1);
        digits = "";
      }
    }
    return { board, hands, side, moveNumber: Number(moveNumberRaw) || 1 };
  }

  function coordToUsi(file, rank) { return `${file}${String.fromCharCode(96 + rank)}`; }
  function promotionZone(side, rank) { return side === "b" ? rank <= 3 : rank >= 7; }
  function mandatoryPromotion(type, side, rank) {
    if ((type === "P" || type === "L") && (side === "b" ? rank === 1 : rank === 9)) return true;
    if (type === "N" && (side === "b" ? rank <= 2 : rank >= 8)) return true;
    return false;
  }
  function goldVectors(side) {
    const f = side === "b" ? -1 : 1;
    return [[-1,f],[0,f],[1,f],[-1,0],[1,0],[0,-f]];
  }
  function silverVectors(side) {
    const f = side === "b" ? -1 : 1;
    return [[-1,f],[0,f],[1,f],[-1,-f],[1,-f]];
  }
  function stepVectors(piece) {
    const f = piece.side === "b" ? -1 : 1;
    if (piece.type === "K") return [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    if (piece.promoted && ["P","L","N","S"].includes(piece.type)) return goldVectors(piece.side);
    if (piece.type === "G") return goldVectors(piece.side);
    if (piece.type === "S") return silverVectors(piece.side);
    if (piece.type === "N") return [[-1,2*f],[1,2*f]];
    if (piece.type === "P") return [[0,f]];
    if (piece.promoted && piece.type === "R") return [[-1,-1],[1,-1],[-1,1],[1,1]];
    if (piece.promoted && piece.type === "B") return [[0,-1],[-1,0],[1,0],[0,1]];
    return [];
  }
  function slideVectors(piece) {
    const f = piece.side === "b" ? -1 : 1;
    if (piece.type === "R") return [[0,-1],[-1,0],[1,0],[0,1]];
    if (piece.type === "B") return [[-1,-1],[1,-1],[-1,1],[1,1]];
    if (piece.type === "L" && !piece.promoted) return [[0,f]];
    return [];
  }

  function pieceAttacksSquare(state, fromFile, fromRank, piece, targetFile, targetRank) {
    for (const [df, dr] of stepVectors(piece)) {
      if (fromFile + df === targetFile && fromRank + dr === targetRank) return true;
    }
    for (const [df, dr] of slideVectors(piece)) {
      let file = fromFile + df, rank = fromRank + dr;
      while (inside(file, rank)) {
        if (file === targetFile && rank === targetRank) return true;
        if (state.board.has(key(file, rank))) break;
        file += df; rank += dr;
      }
    }
    return false;
  }

  function findKing(state, side) {
    for (const [square, piece] of state.board) {
      if (piece.side === side && piece.type === "K") return { file:Number(square[0]), rank:Number(square[1]) };
    }
    return null;
  }
  function isInCheck(state, side) {
    const king = findKing(state, side);
    if (!king) return true;
    for (const [square, piece] of state.board) {
      if (piece.side === side) continue;
      if (pieceAttacksSquare(state, Number(square[0]), Number(square[1]), piece, king.file, king.rank)) return true;
    }
    return false;
  }

  function pushMoveVariants(moves, state, fromFile, fromRank, toFile, toRank, piece) {
    const target = state.board.get(key(toFile,toRank));
    if (target?.side === piece.side) return;
    const canPromote = !piece.promoted && PROMOTABLE.has(piece.type) && (promotionZone(piece.side, fromRank) || promotionZone(piece.side, toRank));
    const mustPromote = !piece.promoted && mandatoryPromotion(piece.type, piece.side, toRank);
    const base = { fromFile, fromRank, toFile, toRank, side:piece.side, type:piece.type, drop:false };
    if (!mustPromote) moves.push({ ...base, promote:false });
    if (canPromote) moves.push({ ...base, promote:true });
  }

  function hasUnpromotedPawnOnFile(state, side, file) {
    for (let rank=1; rank<=9; rank+=1) {
      const piece = state.board.get(key(file,rank));
      if (piece?.side === side && piece.type === "P" && !piece.promoted) return true;
    }
    return false;
  }

  function generatePseudoMoves(state, { includeDrops=true } = {}) {
    const moves = [];
    for (const [square, piece] of state.board) {
      if (piece.side !== state.side) continue;
      const fromFile=Number(square[0]), fromRank=Number(square[1]);
      for (const [df,dr] of stepVectors(piece)) {
        const toFile=fromFile+df, toRank=fromRank+dr;
        if (inside(toFile,toRank)) pushMoveVariants(moves,state,fromFile,fromRank,toFile,toRank,piece);
      }
      for (const [df,dr] of slideVectors(piece)) {
        let toFile=fromFile+df, toRank=fromRank+dr;
        while (inside(toFile,toRank)) {
          const target=state.board.get(key(toFile,toRank));
          if (target?.side === piece.side) break;
          pushMoveVariants(moves,state,fromFile,fromRank,toFile,toRank,piece);
          if (target) break;
          toFile+=df; toRank+=dr;
        }
      }
    }
    if (includeDrops) {
      const hand = state.hands[state.side] || {};
      for (const type of HAND_ORDER) {
        if (!(hand[type] > 0)) continue;
        for (let file=1;file<=9;file+=1) for (let rank=1;rank<=9;rank+=1) {
          if (state.board.has(key(file,rank))) continue;
          if ((type === "P" || type === "L") && mandatoryPromotion(type,state.side,rank)) continue;
          if (type === "N" && mandatoryPromotion(type,state.side,rank)) continue;
          if (type === "P" && hasUnpromotedPawnOnFile(state,state.side,file)) continue;
          moves.push({ side:state.side,type,drop:true,toFile:file,toRank:rank,promote:false });
        }
      }
    }
    return moves;
  }

  function applyMove(state, move) {
    const next=cloneState(state);
    const side=state.side;
    if (move.drop) {
      next.board.set(key(move.toFile,move.toRank), { type:move.type, side, promoted:false });
      next.hands[side][move.type]=(next.hands[side][move.type]||0)-1;
    } else {
      const fromKey=key(move.fromFile,move.fromRank), toKey=key(move.toFile,move.toRank);
      const piece=next.board.get(fromKey);
      next.board.delete(fromKey);
      const captured=next.board.get(toKey);
      if (captured) next.hands[side][captured.type]=(next.hands[side][captured.type]||0)+1;
      next.board.set(toKey,{...piece,promoted:piece.promoted||move.promote});
    }
    next.side=other(side); next.moveNumber=(next.moveNumber||1)+1;
    return next;
  }

  function generateLegalMoves(state) {
    return generatePseudoMoves(state).filter((move) => !isInCheck(applyMove(state,move), state.side));
  }

  function moveToUsi(move) {
    if (move.drop) return `${move.type}*${coordToUsi(move.toFile,move.toRank)}`;
    return `${coordToUsi(move.fromFile,move.fromRank)}${coordToUsi(move.toFile,move.toRank)}${move.promote?"+":""}`;
  }

  function materialScoreSente(state) {
    let score=0;
    for (const piece of state.board.values()) {
      const value=(VALUES[piece.type]||0)+(piece.promoted?(PROMOTION_BONUS[piece.type]||0):0);
      score += piece.side === "b" ? value : -value;
    }
    for (const side of ["b","w"]) for (const [type,count] of Object.entries(state.hands[side]||{})) {
      const value=(VALUES[type]||0)*count;
      score += side === "b" ? value : -value;
    }
    return score;
  }

  function kingSafetySente(state) {
    let score=0;
    for (const side of ["b","w"]) {
      const king=findKing(state,side); if(!king) continue;
      let friendly=0, hostile=0;
      for(let df=-1;df<=1;df+=1) for(let dr=-1;dr<=1;dr+=1) {
        if(!df&&!dr) continue;
        const p=state.board.get(key(king.file+df,king.rank+dr));
        if(p?.side===side) friendly+=1; else if(p) hostile+=1;
      }
      const local=friendly*8-hostile*12-(isInCheck(state,side)?45:0);
      score += side === "b" ? local : -local;
    }
    return score;
  }

  function staticScoreFor(state, perspectiveSide) {
    const sente=materialScoreSente(state)+kingSafetySente(state);
    return perspectiveSide === "b" ? sente : -sente;
  }

  function orderMoves(state,moves) {
    return moves.map((move)=>{
      let bonus=0;
      if(!move.drop){ const captured=state.board.get(key(move.toFile,move.toRank)); if(captured) bonus+=(VALUES[captured.type]||0)+200; }
      if(move.promote) bonus+=120;
      return {move,bonus};
    }).sort((a,b)=>b.bonus-a.bonus).map((x)=>x.move);
  }

  async function analyze(state, token, limits) {
    const rootSide=state.side;
    const rootMoves=orderMoves(state,generateLegalMoves(state)).slice(0,limits.maxRootMoves);
    if(!rootMoves.length) {
      return { mate:isInCheck(state,rootSide)?-1:null, candidates:[], nodes:1, depth:1 };
    }
    const candidates=[]; let nodes=0; const started=performance.now();
    for(let i=0;i<rootMoves.length;i+=1) {
      if(token.cancelled) break;
      if(performance.now()-started>limits.maxTimeMs && candidates.length) break;
      const move=rootMoves[i]; const child=applyMove(state,move); nodes+=1;
      const replies=orderMoves(child,generateLegalMoves(child)).slice(0,limits.maxReplyMoves);
      let score;
      let mate=null;
      if(!replies.length && isInCheck(child,child.side)) { score=100000; mate=1; }
      else if(!replies.length) score=staticScoreFor(child,rootSide);
      else {
        let worst=Infinity;
        for(const reply of replies) {
          const grandchild=applyMove(child,reply); nodes+=1;
          let replyScore=staticScoreFor(grandchild,rootSide);
          const ourNext=generateLegalMoves(grandchild);
          if(!ourNext.length && isInCheck(grandchild,grandchild.side)) replyScore=-100000;
          if(replyScore<worst) worst=replyScore;
          if(nodes>=limits.maxNodes) break;
        }
        score=worst;
      }
      candidates.push({move:moveToUsi(move),score,mate});
      if(i%4===3) await new Promise((resolve)=>setTimeout(resolve,0));
      if(nodes>=limits.maxNodes) break;
    }
    candidates.sort((a,b)=>b.score-a.score);
    return { candidates, nodes, depth:2 };
  }

  function parseGo(command) {
    const tokens=command.trim().split(/\s+/);
    const read=(name,fallback)=>{const i=tokens.indexOf(name); const n=i>=0?Number(tokens[i+1]):NaN; return Number.isFinite(n)&&n>0?n:fallback;};
    const maxTimeMs=Math.min(read("movetime",120),800);
    const maxNodes=Math.min(read("nodes",1600),10000);
    return { maxTimeMs, maxNodes, maxRootMoves:64, maxReplyMoves:48 };
  }

  async function runGo(command) {
    if(!currentPosition){ emit("info string no position"); emit("bestmove resign"); return; }
    const token={cancelled:false}; activeSearchToken=token;
    try {
      const result=await analyze(currentPosition,token,parseGo(command));
      const top=result.candidates.slice(0,Math.max(1,Math.min(5,options.MultiPV)));
      if(!top.length) {
        if(result.mate) emit(`info depth 1 multipv 1 score mate ${result.mate} nodes ${result.nodes} pv resign`);
        else emit(`info depth 1 multipv 1 score cp ${staticScoreFor(currentPosition,currentPosition.side)} nodes ${result.nodes} pv resign`);
        emit("bestmove resign"); return;
      }
      const rootEvaluation = staticScoreFor(currentPosition, currentPosition.side);
      top.forEach((candidate,index)=>{
        // MultiPV move ordering comes from the two-ply search, while the primary position
        // evaluation stays horizon-stable for before/after review comparison.
        const scorePart = index === 0
          ? `cp ${Math.trunc(rootEvaluation)}`
          : (candidate.mate ? `mate ${candidate.mate}` : `cp ${Math.trunc(candidate.score)}`);
        emit(`info depth ${result.depth} multipv ${index+1} score ${scorePart} nodes ${result.nodes} pv ${candidate.move}`);
      });
      emit(`bestmove ${top[0].move}`);
    } catch(error) {
      emit(`info string engine error ${String(error?.message||error)}`);
      emit("bestmove resign");
    } finally { if(activeSearchToken===token) activeSearchToken=null; }
  }

  self.addEventListener("message", (event) => {
    const command=String(event.data??"").trim();
    if(!command) return;
    if(command==="usi") {
      emit(`id name Shogi Reflection Local Engine ${VERSION}`);
      emit("id author Shogi Reflection project");
      emit("option name Threads type spin default 1 min 1 max 1");
      emit("option name USI_Hash type spin default 16 min 8 max 64");
      emit("option name MultiPV type spin default 3 min 1 max 5");
      emit("usiok"); return;
    }
    if(command==="isready") { emit("readyok"); return; }
    if(command.startsWith("setoption name ")) {
      const match=command.match(/^setoption name (.+?) value (.+)$/);
      if(match){ const name=match[1], value=Number(match[2]); if(name in options && Number.isFinite(value)) options[name]=value; }
      return;
    }
    if(command.startsWith("position sfen ")) {
      try { currentPosition=parseSfen(command.slice("position sfen ".length)); }
      catch(error){ currentPosition=null; emit(`info string invalid position ${String(error?.message||error)}`); }
      return;
    }
    if(command.startsWith("go")) { void runGo(command); return; }
    if(command==="stop") { if(activeSearchToken) activeSearchToken.cancelled=true; return; }
    if(command==="quit") { if(activeSearchToken) activeSearchToken.cancelled=true; self.close(); }
  });
})();
