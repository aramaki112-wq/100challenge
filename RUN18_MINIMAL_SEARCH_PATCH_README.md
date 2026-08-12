# Shogi Reflection Ver.1.8.3 — Run #18 Minimal Real Search Gate

Run #17 proved the minimal Real YaneuraOu USI handshake in both Node and Browser.
Run #18 deliberately does not return to the full Shogi Reflection application.

It extends only the isolated harness to:

`position startpos → go nodes 5000 → info → bestmove`

Required search evidence in both Node and Browser:

- score cp or mate
- depth
- nodes
- time
- PV
- bestmove

The harness uses Threads=1, USI_Hash=64 and USI_OwnBook=false only for this
minimal search proof.

Formal status: NOT FORMAL.
